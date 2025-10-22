import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { encodeBase64, decodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

interface PdfTextItem {
  str?: string;
}

interface PdfPage {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
}

interface PdfDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  cleanup?: () => void;
  destroy?: () => void;
}

interface PdfJsModule {
  getDocument: (src: { data: Uint8Array }) => { promise: Promise<PdfDocument> };
  GlobalWorkerOptions?: { workerSrc?: string };
}

let pdfjsLib: any | null = null;
try {
  pdfjsLib = await import("https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.mjs");
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@3.11.174/legacy/build/pdf.worker.mjs";
  }
} catch (error) {
  console.warn("[Deal Files] Failed to load pdfjs-dist; PDF parsing will fall back to base64", error);
  pdfjsLib = null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

interface DealInput {
  dealId: string;
  driveFolderId: string;
  controlTowerDealId?: string;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  createdTime?: string;
  md5Checksum?: string;
  size?: string;
}

interface SyncSummary {
  dealId: string;
  driveFolderId: string;
  filesProcessed: number;
  filesUploaded: number;
  filesSkipped: number;
  errors: string[];
}

interface GoogleServiceAccount {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
}

type ConversionResult = {
  payload: Record<string, unknown>;
  parser: "pdfjs-dist" | "base64";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    const googleKey = Deno.env.get("GOOGLE_DRIVE_API_KEY") ?? undefined;
    const googleJson = Deno.env.get("GOOGLE_DRIVE_JSON");

    if (!googleJson) {
      throw new Error("Google Drive service account JSON is not configured");
    }

    const serviceAccount = parseServiceAccount(googleJson);

    const deals = await parseRequest(req);
    if (deals.length === 0) {
      throw new Error("Request body must include at least one deal to sync");
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const summaries: SyncSummary[] = [];

    for (const deal of deals) {
      const summary: SyncSummary = {
        dealId: deal.dealId,
        driveFolderId: deal.driveFolderId,
        filesProcessed: 0,
        filesUploaded: 0,
        filesSkipped: 0,
        errors: [],
      };

      if (!deal.driveFolderId) {
        summary.errors.push("Missing driveFolderId for deal");
        summaries.push(summary);
        continue;
      }

      try {
        const driveFiles = await listFolderFiles(deal.driveFolderId, accessToken, googleKey);
        summary.filesProcessed = driveFiles.length;

        for (const file of driveFiles) {
          try {
            const fileBytes = await downloadDriveFile(file.id, accessToken, googleKey);
            const conversion = await convertFileToJson(file, fileBytes);
            const storagePath = createStoragePath(deal.dealId, file);

            const uploadError = await uploadJsonToStorage(
              supabase as any,
              storagePath,
              {
                dealId: deal.dealId,
                controlTowerDealId: deal.controlTowerDealId ?? null,
                driveFolderId: deal.driveFolderId,
                file: {
                  id: file.id,
                  name: file.name,
                  mimeType: file.mimeType,
                  modifiedTime: file.modifiedTime ?? null,
                  createdTime: file.createdTime ?? null,
                  md5Checksum: file.md5Checksum ?? null,
                  size: file.size ? Number(file.size) : null,
                },
                payload: conversion.payload,
                parser: conversion.parser,
                syncedAt: new Date().toISOString(),
              },
            );

            if (uploadError) {
              summary.filesSkipped++;
              summary.errors.push(`Failed to upload ${file.name}: ${uploadError}`);
              continue;
            }

            const metadataError = await upsertMetadata(
              supabase as any,
              {
                deal_id: deal.dealId,
                client_id: null,
                drive_file_id: file.id,
                drive_folder_id: deal.driveFolderId,
                drive_file_name: file.name,
                drive_file_type: file.mimeType,
                storage_bucket_path: storagePath,
                json_snapshot_path: storagePath,
                drive_last_modified_at: file.modifiedTime ?? null,
                drive_created_at: file.createdTime ?? null,
                file_size: file.size ? Number(file.size) : null,
                checksum: file.md5Checksum ?? null,
              },
            );

            if (metadataError) {
              summary.filesSkipped++;
              summary.errors.push(`Failed to record metadata for ${file.name}: ${metadataError}`);
              continue;
            }

            summary.filesUploaded++;
          } catch (fileError) {
            const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
            summary.filesSkipped++;
            summary.errors.push(`Error processing ${file.name}: ${errorMessage}`);
            console.warn(`[Deal Files] Error processing file ${file.id}:`, fileError);
          }
        }
      } catch (folderError) {
        const errorMessage = folderError instanceof Error ? folderError.message : String(folderError);
        summary.errors.push(`Failed to enumerate folder: ${errorMessage}`);
        console.error(`[Deal Files] Failed to sync folder ${deal.driveFolderId}:`, folderError);
      }

      summaries.push(summary);
    }

    return new Response(
      JSON.stringify({
        deals: summaries,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("[Deal Files] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function parseRequest(req: Request): Promise<DealInput[]> {
  const bodyText = await req.text();
  if (!bodyText) {
    return [];
  }

  try {
    const parsed = JSON.parse(bodyText);

    if (Array.isArray(parsed)) {
      return normalizeDealInputArray(parsed);
    }

    const dealsField = (parsed as { deals?: unknown }).deals;
    if (Array.isArray(dealsField)) {
      return normalizeDealInputArray(dealsField);
    }

    const record = parsed as Record<string, unknown>;
    if (record && record.dealId && record.driveFolderId) {
      return normalizeDealInputArray([record]);
    }

    return [];
  } catch (_error) {
    throw new Error("Invalid JSON body supplied");
  }
}

function normalizeDealInputArray(values: unknown[]): DealInput[] {
  return values
    .map((value) => {
      if (!value || typeof value !== "object") return null;
      const record = value as Record<string, unknown>;
      const dealId = readStringField(record, ["dealId", "deal_id"]);
      const driveFolderId = readStringField(record, ["driveFolderId", "drive_folder_id"]);
      if (!dealId || !driveFolderId) {
        return null;
      }
      const controlTowerDealId = readStringField(record, ["controlTowerDealId", "control_tower_deal_id"]);
      const normalized: DealInput = controlTowerDealId
        ? { dealId, driveFolderId, controlTowerDealId }
        : { dealId, driveFolderId };
      return normalized;
    })
    .filter((value): value is DealInput => Boolean(value));
}

function readStringField(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function parseServiceAccount(raw: string): GoogleServiceAccount {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Service account JSON must be an object");
    }
    return parsed as GoogleServiceAccount;
  } catch (_error) {
    try {
      const decoded = decodeBase64(raw.replace(/\s+/g, ""));
      const json = new TextDecoder().decode(decoded);
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Service account JSON must be an object");
      }
      return parsed as GoogleServiceAccount;
    } catch (decodeError) {
      throw new Error(`Failed to parse GOOGLE_DRIVE_JSON: ${decodeError instanceof Error ? decodeError.message : String(decodeError)}`);
    }
  }
}

async function getGoogleAccessToken(serviceAccount: GoogleServiceAccount): Promise<string> {
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!clientEmail || !privateKey) {
    throw new Error("Service account JSON must include client_email and private_key");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const key = await importPrivateKey(privateKey);
  const encoder = new TextEncoder();
  const headerPayload = `${base64UrlEncode(encoder.encode(JSON.stringify(header)))}.${base64UrlEncode(encoder.encode(JSON.stringify(payload)))}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(headerPayload));
  const jwt = `${headerPayload}.${base64UrlEncode(new Uint8Array(signature))}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    throw new Error(`Failed to obtain Google access token: ${tokenResponse.status} ${text}`);
  }

  const tokenJson = await tokenResponse.json();
  if (!tokenJson.access_token) {
    throw new Error("Google token response did not include access_token");
  }

  return tokenJson.access_token as string;
}

async function importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
  const cleaned = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const raw = decodeBase64(cleaned);
  return await crypto.subtle.importKey(
    "pkcs8",
    raw as any,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"],
  );
}

function base64UrlEncode(bytes: Uint8Array): string {
  return encodeBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function listFolderFiles(folderId: string, accessToken: string, apiKey?: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id,name,mimeType,modifiedTime,createdTime,md5Checksum,size)",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    if (apiKey) {
      params.set("key", apiKey);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to list Drive files: ${response.status} ${text}`);
    }

    const json = await response.json();
    const pageFiles = (json.files ?? []) as DriveFile[];
    files.push(...pageFiles);
    pageToken = json.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

async function downloadDriveFile(fileId: string, accessToken: string, apiKey?: string): Promise<Uint8Array> {
  const params = new URLSearchParams({ alt: "media" });
  if (apiKey) {
    params.set("key", apiKey);
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to download Drive file ${fileId}: ${response.status} ${text}`);
  }

  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

async function convertFileToJson(file: DriveFile, data: Uint8Array): Promise<ConversionResult> {
  if (file.mimeType === "application/pdf" && pdfjsLib?.getDocument) {
    try {
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      const pages: Array<{ pageNumber: number; text: string }> = [];

      for (let index = 1; index <= pdf.numPages; index++) {
        const page = await pdf.getPage(index);
        const textContent = await page.getTextContent();
        const text = textContent.items
          .map((item: any) => (typeof item.str === "string" ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        pages.push({ pageNumber: index, text });
      }

      try {
        if (typeof pdf.cleanup === "function") {
          pdf.cleanup();
        }
        if (typeof pdf.destroy === "function") {
          pdf.destroy();
        }
      } catch (_cleanupError) {
        // Ignore cleanup issues; pdf.js sometimes throws for already-cleaned documents
      }

      return {
        parser: "pdfjs-dist",
        payload: {
          type: "pdf",
          pageCount: pdf.numPages,
          pages,
        },
      };
    } catch (pdfError) {
      console.warn(`[Deal Files] Failed to parse PDF ${file.id}, falling back to base64:`, pdfError);
    }
  }

  return {
    parser: "base64",
    payload: {
      type: "binary",
      mimeType: file.mimeType,
      data: encodeBase64(data),
    },
  };
}

function createStoragePath(dealId: string, file: DriveFile): string {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9-_.]+/g, "_");
  const timestamp = file.modifiedTime ?? file.createdTime ?? new Date().toISOString();
  const suffix = timestamp.replace(/[^0-9A-Za-z]/g, "");
  return `${dealId}/${sanitizedName}-${suffix}.json`;
}

async function uploadJsonToStorage(
  supabase: ReturnType<typeof createClient>,
  storagePath: string,
  json: Record<string, unknown>,
): Promise<string | null> {
  const payload = JSON.stringify(json, null, 2);
  const file = new Blob([payload], { type: "application/json" });

  const { error } = await supabase
    .storage
    .from("deal-files")
    .upload(storagePath, file, {
      contentType: "application/json",
      upsert: true,
    });

  return error ? (error.message ?? "Unknown storage error") : null;
}

async function upsertMetadata(
  supabase: any,
  record: any,
): Promise<string | null> {
  const { error } = await supabase
    .from("deal_files")
    .upsert(record, { onConflict: "drive_file_id" });

  return error ? (error.message ?? "Unknown metadata error") : null;
}
