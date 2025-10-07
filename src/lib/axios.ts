const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const BASE_URL = "https://api.openai.com";

type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";

type RequestConfig = {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | null | undefined>;
};

type AxiosLikeResponse<T> = {
  data: T;
};

const buildQueryString = (params?: RequestConfig["params"]) => {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    query.append(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const handleResponse = async <T>(response: Response): Promise<AxiosLikeResponse<T>> => {
  const text = await response.text();
  let parsed: any = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      (parsed && typeof parsed === "object" && (parsed.error?.message || parsed.message)) ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).data = parsed;
    throw error;
  }

  return { data: parsed as T };
};

const request = async <T>(
  method: HttpMethod,
  url: string,
  data?: any,
  config: RequestConfig = {}
): Promise<AxiosLikeResponse<T>> => {
  const headers = new Headers(config.headers ?? {});

  if (!headers.has("OpenAI-Beta")) {
    headers.set("OpenAI-Beta", "video-generation=2024-12-17");
  }

  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key is not configured. Set VITE_OPENAI_API_KEY in your environment.");
  } else {
    headers.set("Authorization", `Bearer ${OPENAI_API_KEY}`);
  }

  let body: BodyInit | undefined;

  if (data instanceof FormData) {
    body = data;
  } else if (data !== undefined && data !== null) {
    body = JSON.stringify(data);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  } else if (method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const queryString = buildQueryString(config.params);
  const response = await fetch(`${BASE_URL}${url}${queryString}`, {
    method,
    headers,
    body,
    signal: config.signal,
  });

  return handleResponse<T>(response);
};

export const axiosPrivate = {
  get: <T>(url: string, config?: RequestConfig) => request<T>("GET", url, undefined, config),
  post: <T>(url: string, data?: any, config?: RequestConfig) => request<T>("POST", url, data, config),
  delete: <T>(url: string, config?: RequestConfig) => request<T>("DELETE", url, undefined, config),
};

export type { AxiosLikeResponse };
