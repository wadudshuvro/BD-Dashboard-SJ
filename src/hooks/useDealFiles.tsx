import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DealFileMetadata {
  name?: string | null;
  source?: string | null;
  origin?: string | null;
  local_json_path?: string | null;
  local_path?: string | null;
  storage_url?: string | null;
  google_drive_url?: string | null;
  drive_url?: string | null;
  last_synced_at?: string | null;
  [key: string]: unknown;
}

export interface DealFile {
  id: string;
  deal_id: string | null;
  client_id: string | null;
  file_name: string | null;
  file_source?: string | null;
  file_type?: string | null;
  storage_path?: string | null;
  local_path?: string | null;
  external_url?: string | null;
  last_synced_at?: string | null;
  metadata?: DealFileMetadata | null;
  created_at: string;
  updated_at: string;
}

interface UseDealFilesParams {
  clientId?: string;
  dealId?: string;
  enabled?: boolean;
}

interface UseDealFilesReturn {
  files: DealFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDealFiles({ clientId, dealId, enabled = true }: UseDealFilesParams = {}): UseDealFilesReturn {
  const { user } = useAuth();
  const [files, setFiles] = useState<DealFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!user?.id || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('deal_files').select('*').order('last_synced_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setFiles((data || []) as DealFile[]);
    } catch (err) {
      console.error('Failed to load deal files', err);
      setError(err instanceof Error ? err.message : 'Unable to load stored files');
    } finally {
      setLoading(false);
    }
  }, [user?.id, enabled, clientId, dealId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const refetch = useCallback(async () => {
    await fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    refetch,
  };
}
