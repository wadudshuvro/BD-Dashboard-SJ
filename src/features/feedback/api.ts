import { supabase } from "@/integrations/supabase/client";
import axiosPrivate from "@/lib/axiosPrivate";

export type FeedbackType = "bug" | "feature";
export type FeedbackStatus = "open" | "in_review" | "resolved" | "closed";

export interface SubmitFeedbackPayload {
  id?: string;
  type: FeedbackType;
  subject: string;
  description?: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
}

export interface FeedbackReport {
  id: string;
  type: FeedbackType;
  subject: string;
  description: string | null;
  status: FeedbackStatus;
  email: string | null;
  attachment_url: string | null;
  created_by: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  submitted_by_name?: string | null;
  reviewed_by_name?: string | null;
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  author_name?: string | null;
  author_email?: string | null;
}

export interface FeedbackListResponse {
  items: FeedbackReport[];
  total: number;
}

export interface FeedbackDetailResponse {
  feedback: FeedbackReport;
  comments: FeedbackComment[];
  attachment_signed_url?: string | null;
}

export async function submitFeedback(payload: SubmitFeedbackPayload) {
  // Explicitly get the current session and pass the token
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("[submitFeedback] Session retrieval error:", sessionError);
    throw new Error("Unable to retrieve authentication session");
  }

  if (!session) {
    console.error("[submitFeedback] No active session found");
    throw new Error("No active session. Please log in again.");
  }

  console.log("[submitFeedback] Token valid until:", new Date(session.expires_at! * 1000).toISOString());

  const { data, error } = await supabase.functions.invoke<{ id: string; status: FeedbackStatus }>("submit-feedback", {
    body: payload,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    console.error("[submitFeedback] Edge function error:", error);
    throw new Error(error.message || "Failed to submit feedback");
  }

  console.log("[submitFeedback] Success:", data);
  return data!;
}

export async function listFeedbackReports(params: {
  type?: FeedbackType;
  status?: FeedbackStatus;
  includeClosed?: boolean;
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const response = await axiosPrivate.get<FeedbackListResponse>("/manage-feedback/list", {
    params,
  });
  return response.data;
}

export async function getFeedbackDetail(id: string) {
  const response = await axiosPrivate.get<FeedbackDetailResponse>(`/manage-feedback/${id}`);
  return response.data;
}

export async function postFeedbackComment(id: string, comment: string) {
  const response = await axiosPrivate.post<FeedbackComment>(`/manage-feedback/${id}/comment`, { comment });
  return response.data;
}

export async function updateFeedbackStatus(id: string, status: FeedbackStatus) {
  const response = await axiosPrivate.put<FeedbackReport>(`/manage-feedback/${id}/status`, { status });
  return response.data;
}

export async function deleteFeedback(id: string) {
  const response = await axiosPrivate.delete<{ success: boolean }>(`/manage-feedback/${id}`);
  return response.data;
}
