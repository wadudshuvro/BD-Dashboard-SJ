import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrollmentConfig {
  scheduling_mode: 'immediate' | 'scheduled' | 'drip';
  batch_config?: {
    messagesPerBatch: number;
    interval: number;
    intervalUnit: 'minutes' | 'hours' | 'days';
  };
  send_days?: string[];
  time_window_start?: string;
  time_window_end?: string;
  start_date_time?: string;
  email_template_id: string;
}

interface EnrollRequest {
  sequenceId: string;
  contactIds: string[];
  config: EnrollmentConfig;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { sequenceId, contactIds, config }: EnrollRequest = await req.json();

    console.log('Enrolling contacts:', { sequenceId, contactCount: contactIds.length, config });

    // Validate sequence exists and is active
    const { data: sequence, error: seqError } = await supabase
      .from('campaign_sequences')
      .select('id, campaign_id, status')
      .eq('id', sequenceId)
      .single();

    if (seqError || !sequence) {
      throw new Error('Sequence not found');
    }

    if (sequence.status !== 'active') {
      throw new Error('Sequence is not active');
    }

    // Validate contacts belong to campaign
    const { data: contacts, error: contactsError } = await supabase
      .from('campaign_contacts')
      .select('id')
      .eq('campaign_id', sequence.campaign_id)
      .in('id', contactIds);

    if (contactsError || !contacts || contacts.length !== contactIds.length) {
      throw new Error('Some contacts do not belong to this campaign');
    }

    const totalToSend = contactIds.length;
    const startTime = config.start_date_time ? new Date(config.start_date_time) : new Date();

    // Create enrollments for each contact
    const enrollments = contactIds.map(contactId => ({
      sequence_id: sequenceId,
      contact_id: contactId,
      status: 'active',
      current_step: 0,
      scheduling_mode: config.scheduling_mode,
      batch_config: config.batch_config || { messagesPerBatch: 25, interval: 1, intervalUnit: 'days' },
      send_days: config.send_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      time_window_start: config.time_window_start || null,
      time_window_end: config.time_window_end || null,
      start_date_time: startTime.toISOString(),
      next_batch_at: config.scheduling_mode === 'drip' ? startTime.toISOString() : null,
      total_sent: 0,
      total_to_send: totalToSend,
      email_template_id: config.email_template_id,
      enrolled_at: new Date().toISOString(),
    }));

    const { data: createdEnrollments, error: enrollError } = await supabase
      .from('contact_sequence_enrollments')
      .insert(enrollments)
      .select('id');

    if (enrollError) {
      console.error('Error creating enrollments:', enrollError);
      throw new Error(`Failed to create enrollments: ${enrollError.message}`);
    }

    let batchesCreated = 0;

    // Create batch queue for drip mode
    if (config.scheduling_mode === 'drip' && createdEnrollments) {
      const batchSize = config.batch_config?.messagesPerBatch || 25;
      const interval = config.batch_config?.interval || 1;
      const intervalUnit = config.batch_config?.intervalUnit || 'days';

      // Calculate batches
      const batches = [];
      for (let i = 0; i < contactIds.length; i += batchSize) {
        const batchNumber = Math.floor(i / batchSize) + 1;
        const batchContacts = contactIds.slice(i, i + batchSize);
        
        // Calculate scheduled time for this batch
        let scheduledFor = new Date(startTime);
        const batchDelay = (batchNumber - 1) * interval;
        
        if (intervalUnit === 'minutes') {
          scheduledFor.setMinutes(scheduledFor.getMinutes() + batchDelay);
        } else if (intervalUnit === 'hours') {
          scheduledFor.setHours(scheduledFor.getHours() + batchDelay);
        } else {
          scheduledFor.setDate(scheduledFor.getDate() + batchDelay);
        }

        batches.push({
          enrollment_id: createdEnrollments[0].id,
          batch_number: batchNumber,
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          contacts_in_batch: batchContacts,
        });
      }

      const { error: batchError } = await supabase
        .from('sequence_batch_queue')
        .insert(batches);

      if (batchError) {
        console.error('Error creating batches:', batchError);
      } else {
        batchesCreated = batches.length;
      }
    }

    console.log('Enrollment complete:', {
      enrolled: createdEnrollments?.length || 0,
      batchesCreated,
    });

    return new Response(
      JSON.stringify({
        enrolled: createdEnrollments?.length || 0,
        failed: contactIds.length - (createdEnrollments?.length || 0),
        batchesCreated,
        message: `Successfully enrolled ${createdEnrollments?.length} contacts${batchesCreated > 0 ? ` in ${batchesCreated} batches` : ''}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in sequence-enroll-contacts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});