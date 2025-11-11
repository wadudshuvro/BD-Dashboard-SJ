import { supabase } from "@/integrations/supabase/client";

export interface Sequence {
  id: string;
  name: string;
  description: string | null;
  campaign_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  channel_type: string;
  delay_days: number;
  delay_hours: number;
  custom_message: string | null;
}

export interface SequenceWithSteps extends Sequence {
  outreach_sequence_steps?: SequenceStep[];
}

export interface CreateSequencePayload {
  name: string;
  description?: string;
  campaign_id?: string;
  steps: any[];
}

export const sequencesApi = {
  async listSequences(campaignId?: string) {
    let query = supabase
      .from('outreach_sequences' as any)
      .select('*')
      .order('created_at', { ascending: false });
    
    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any as SequenceWithSteps[];
  },

  async getSequence(id: string) {
    const { data, error } = await supabase
      .from('outreach_sequences' as any)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return (data || {}) as SequenceWithSteps;
  },

  async createSequence(payload: CreateSequencePayload) {
    const { steps, ...sequenceData } = payload;
    
    const { data: sequence, error: seqError } = await supabase
      .from('outreach_sequences' as any)
      .insert(sequenceData)
      .select()
      .single();
    
    if (seqError) throw seqError;
    const seq = sequence as any;
    
    if (steps.length > 0) {
      const stepsWithSeqId = steps.map(step => ({
        ...step,
        sequence_id: seq.id
      }));
      
      const { error: stepsError } = await supabase
        .from('outreach_sequence_steps' as any)
        .insert(stepsWithSeqId);
      
      if (stepsError) throw stepsError;
    }
    
    return this.getSequence(seq.id);
  },

  async updateSequence(id: string, updates: any) {
    const { data, error } = await supabase
      .from('outreach_sequences' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSequence(id: string) {
    const { error } = await supabase
      .from('outreach_sequences' as any)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async toggleSequence(id: string, isActive: boolean) {
    return this.updateSequence(id, { is_active: isActive });
  }
};
