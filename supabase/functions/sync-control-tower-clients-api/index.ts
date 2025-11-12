/**
 * Control Tower Clients REST API Sync Edge Function
 *
 * Syncs clients from Control Tower REST API to local BD Portal database.
 * Uses the official Control Tower REST API instead of direct Supabase-to-Supabase connection.
 *
 * Features:
 * - Pagination support (fetches all pages)
 * - Rate limit handling
 * - Upsert logic (prevents duplicates)
 * - Comprehensive error handling
 * - Progress tracking
 * - Sync logging
 *
 * @endpoint POST /sync-control-tower-clients-api
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

// ============================================================================
// Type Definitions
// ============================================================================

interface SyncResult {
  clients: {
    new: number;
    updated: number;
    skipped: number;
    failed: number;
    total_fetched: number;
  };
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: string;
  };
  errors: string[];
  warnings: string[];
  duration: number;
  pages_fetched: number;
}

interface APIClient {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'archived';
  website?: string;
  industry?: string;
  contact_person?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const result: SyncResult = {
    clients: {
      new: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      total_fetched: 0,
    },
    errors: [],
    warnings: [],
    duration: 0,
    pages_fetched: 0,
  };

  try {
    console.log('[ClientsAPI] Starting Control Tower Clients REST API sync...');

    // ========================================================================
    // Authentication & Setup
    // ========================================================================

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.warn('[ClientsAPI] Unable to resolve user:', authError.message);
    }

    const userId = user?.id ?? null;
    console.log(`[ClientsAPI] User ID: ${userId || 'service'}`);

    // ========================================================================
    // Get Control Tower REST API Configuration
    // ========================================================================

    // Get API base URL from edge secrets
    const apiBaseUrl = Deno.env.get('CONTROL_TOWER_API_URL') ||
                      'https://ttlmdbgptqlvjswtcrnq.supabase.co/functions/v1';

    // Get API key from edge secrets (required scope: clients)
    const apiKey = Deno.env.get('CONTROLTOWERAPIKEY');

    if (!apiKey) {
      throw new Error('Control Tower API key not configured in edge secrets (CONTROLTOWERAPIKEY)');
    }

    console.log(`[ClientsAPI] Using API base URL: ${apiBaseUrl}`);

    // ========================================================================
    // Create or Update Sync Status Record
    // ========================================================================

    let syncStatusId: string | null = null;

    try {
      const { data: statusData, error: statusError } = await supabase
        .from('control_tower_sync_status')
        .upsert({
          sync_type: 'clients_api',
          status: 'running',
          started_at: new Date().toISOString(),
          metadata: {
            current_phase: 'clients',
            api_sync: true,
            user_id: userId,
          },
        }, {
          onConflict: 'sync_type',
        })
        .select('id')
        .single();

      if (statusError) {
        console.warn('[ClientsAPI] Could not create sync status:', statusError);
      } else {
        syncStatusId = statusData?.id;
      }
    } catch (e) {
      console.warn('[ClientsAPI] Sync status tracking unavailable:', e);
    }

    // ========================================================================
    // Fetch Clients from Control Tower REST API
    // ========================================================================

    let currentPage = 1;
    let hasMorePages = true;
    let totalPages = 1;
    const pageLimit = 100; // Max allowed by API

    while (hasMorePages) {
      console.log(`[ClientsAPI] Fetching page ${currentPage}/${totalPages}...`);

      try {
        // Make API request
        const apiUrl = `${apiBaseUrl}/api-v1-clients?page=${currentPage}&limit=${pageLimit}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        // Extract rate limit info
        const rateLimitHeader = {
          limit: response.headers.get('X-RateLimit-Limit'),
          remaining: response.headers.get('X-RateLimit-Remaining'),
          reset: response.headers.get('X-RateLimit-Reset'),
        };

        if (rateLimitHeader.limit && rateLimitHeader.remaining && rateLimitHeader.reset) {
          result.rateLimit = {
            limit: parseInt(rateLimitHeader.limit, 10),
            remaining: parseInt(rateLimitHeader.remaining, 10),
            reset: rateLimitHeader.reset,
          };

          console.log(`[ClientsAPI] Rate limit: ${result.rateLimit.remaining}/${result.rateLimit.limit}`);

          // Warning if running low on rate limit
          if (result.rateLimit.remaining < 10) {
            const warning = `Rate limit nearly exceeded: ${result.rateLimit.remaining} requests remaining`;
            result.warnings.push(warning);
            console.warn(`[ClientsAPI] ${warning}`);
          }
        }

        // Handle rate limiting
        if (response.status === 429) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          throw new Error(`Rate limit exceeded. Resets at ${resetTime}`);
        }

        // Parse response
        const responseData = await response.json();

        // Handle API errors
        if (!response.ok) {
          const errorCode = responseData.error?.code || 'unknown';
          const errorMessage = responseData.error?.message || 'Unknown API error';
          throw new Error(`API Error [${errorCode}]: ${errorMessage} (HTTP ${response.status})`);
        }

        // Extract clients and pagination from response
        const clients: APIClient[] = responseData.clients || responseData.data || [];
        const pagination: PaginationInfo | undefined = responseData.pagination;

        console.log(`[ClientsAPI] Fetched ${clients.length} clients from page ${currentPage}`);
        result.clients.total_fetched += clients.length;
        result.pages_fetched++;

        // Update pagination info
        if (pagination) {
          totalPages = pagination.total_pages;
          hasMorePages = pagination.has_next_page;
          console.log(`[ClientsAPI] Pagination: page ${pagination.page}/${pagination.total_pages}, total items: ${pagination.total_items}`);
        } else {
          // No pagination info, assume this is the only page
          hasMorePages = false;
        }

        // ====================================================================
        // Sync Clients to Local Database
        // ====================================================================

        for (const apiClient of clients) {
          try {
            // Check if client already exists by control_tower_client_id
            const { data: existingClient, error: checkError } = await supabase
              .from('clients')
              .select('id, name, updated_at')
              .eq('control_tower_client_id', apiClient.id)
              .maybeSingle();

            if (checkError) {
              console.error(`[ClientsAPI] Error checking existing client ${apiClient.id}:`, checkError);
              result.clients.failed++;
              result.errors.push(`Failed to check client ${apiClient.name}: ${checkError.message}`);
              continue;
            }

            // Prepare client data for upsert
            const clientData = {
              name: apiClient.name,
              email: apiClient.email || null,
              company: apiClient.company || null,
              phone: apiClient.phone || null,
              status: apiClient.status || 'active',
              website: apiClient.website || null,
              industry: apiClient.industry || null,
              contact_person: apiClient.contact_person || null,
              address: apiClient.address || null,
              control_tower_client_id: apiClient.id,
              synced_from_control_tower_api: true,
              last_api_sync_at: new Date().toISOString(),
            };

            if (existingClient) {
              // Update existing client
              const { error: updateError } = await supabase
                .from('clients')
                .update(clientData)
                .eq('id', existingClient.id);

              if (updateError) {
                console.error(`[ClientsAPI] Failed to update client ${apiClient.id}:`, updateError);
                result.clients.failed++;
                result.errors.push(`Failed to update client ${apiClient.name}: ${updateError.message}`);
              } else {
                result.clients.updated++;
                console.log(`[ClientsAPI] Updated client: ${apiClient.name}`);
              }
            } else {
              // Insert new client
              const { error: insertError } = await supabase
                .from('clients')
                .insert(clientData);

              if (insertError) {
                // Check if it's a duplicate error (unique constraint on name or email)
                if (insertError.code === '23505') {
                  console.warn(`[ClientsAPI] Client already exists: ${apiClient.name}`);
                  result.clients.skipped++;
                  result.warnings.push(`Client already exists: ${apiClient.name}`);
                } else {
                  console.error(`[ClientsAPI] Failed to insert client ${apiClient.id}:`, insertError);
                  result.clients.failed++;
                  result.errors.push(`Failed to insert client ${apiClient.name}: ${insertError.message}`);
                }
              } else {
                result.clients.new++;
                console.log(`[ClientsAPI] Created new client: ${apiClient.name}`);
              }
            }
          } catch (clientError) {
            console.error(`[ClientsAPI] Error processing client ${apiClient.id}:`, clientError);
            result.clients.failed++;
            result.errors.push(`Error processing client ${apiClient.name || apiClient.id}: ${clientError.message}`);
          }
        }

        // ====================================================================
        // Update Sync Status Progress
        // ====================================================================

        if (syncStatusId && currentPage % 5 === 0) {
          // Update every 5 pages
          await supabase
            .from('control_tower_sync_status')
            .update({
              metadata: {
                current_phase: 'clients',
                api_sync: true,
                user_id: userId,
                pages_fetched: result.pages_fetched,
                clients_synced: result.clients.new + result.clients.updated,
                last_heartbeat: new Date().toISOString(),
              },
            })
            .eq('id', syncStatusId);
        }

        // Move to next page
        currentPage++;

        // Small delay to be nice to the API (and avoid hitting rate limits)
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (pageError) {
        console.error(`[ClientsAPI] Error fetching page ${currentPage}:`, pageError);
        result.errors.push(`Failed to fetch page ${currentPage}: ${pageError.message}`);
        // Don't break the loop, try to continue with next page
        hasMorePages = false; // But stop trying
      }
    }

    // ========================================================================
    // Finalize Sync
    // ========================================================================

    result.duration = Date.now() - startTime;

    console.log(`[ClientsAPI] Sync completed in ${result.duration}ms`);
    console.log(`[ClientsAPI] Results:`, JSON.stringify(result.clients, null, 2));

    // Create sync log entry
    try {
      await supabase
        .from('control_tower_sync_log')
        .insert({
          sync_type: 'pull_clients_api',
          status: result.errors.length > 0 ? 'partial_success' : 'success',
          records_synced: result.clients.new + result.clients.updated,
          records_failed: result.clients.failed,
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          duration_ms: result.duration,
          metadata: {
            new: result.clients.new,
            updated: result.clients.updated,
            skipped: result.clients.skipped,
            failed: result.clients.failed,
            total_fetched: result.clients.total_fetched,
            pages_fetched: result.pages_fetched,
            warnings: result.warnings,
            rate_limit: result.rateLimit,
          },
        });
    } catch (logError) {
      console.warn('[ClientsAPI] Failed to create sync log:', logError);
    }

    // Update sync status to completed
    if (syncStatusId) {
      await supabase
        .from('control_tower_sync_status')
        .update({
          status: result.errors.length > 0 ? 'partial_success' : 'completed',
          completed_at: new Date().toISOString(),
          metadata: {
            current_phase: 'completed',
            api_sync: true,
            user_id: userId,
            pages_fetched: result.pages_fetched,
            clients_synced: result.clients.new + result.clients.updated,
            result,
          },
        })
        .eq('id', syncStatusId);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('[ClientsAPI] Sync failed:', error);

    result.duration = Date.now() - startTime;
    result.errors.push(error.message);

    // Try to log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('control_tower_sync_log')
        .insert({
          sync_type: 'pull_clients_api',
          status: 'failed',
          records_synced: result.clients.new + result.clients.updated,
          records_failed: result.clients.failed,
          error_message: error.message,
          duration_ms: result.duration,
          metadata: {
            error: error.message,
            stack: error.stack,
            result,
          },
        });
    } catch (logError) {
      console.warn('[ClientsAPI] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        result,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
