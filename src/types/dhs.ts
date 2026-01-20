// DHS (Daily Head Start) Tracker Types

export type DHSStatus = 'on_track' | 'at_risk' | 'blocked';

export interface DHSSubmission {
  id: string;
  user_id: string;
  date: string;
  follow_ups_done: number;
  calls_made: number;
  meetings_booked: number;
  pipeline_updated: boolean;
  score?: number;
  status?: DHSStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DHSSubmissionFormData {
  follow_ups_done: number;
  calls_made: number;
  meetings_booked: number;
  pipeline_updated: boolean;
  score?: number;
  status?: DHSStatus;
  notes?: string;
}

export interface DHSTeamSummary {
  date: string;
  total_submissions: number;
  submission_rate: number;
  average_score?: number;
  total_follow_ups: number;
  total_calls: number;
  total_meetings: number;
  status_breakdown: {
    on_track: number;
    at_risk: number;
    blocked: number;
  };
}

export interface DHSSubmissionWithUser extends DHSSubmission {
  profiles?: {
    full_name?: string;
    email: string;
  };
}

