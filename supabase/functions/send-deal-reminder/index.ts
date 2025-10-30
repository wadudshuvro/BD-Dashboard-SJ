import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch due reminders (not yet sent, and reminder_date <= now)
    const { data: reminders, error: fetchError } = await supabase
      .from('deal_reminders')
      .select(`
        *,
        deals:deal_id (
          id,
          title,
          slug,
          stage,
          owner_id,
          pm_assigned_id
        ),
        creator:created_by (
          id,
          email,
          full_name
        )
      `)
      .is('sent_at', null)
      .lte('reminder_date', new Date().toISOString());

    if (fetchError) {
      throw fetchError;
    }

    console.log(`[Deal Reminders] Found ${reminders?.length || 0} due reminders`);

    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const reminder of reminders || []) {
      try {
        const deal = reminder.deals;
        const creator = reminder.creator;

        const dealUrl = `${Deno.env.get('SUPABASE_URL')?.replace('/functions/v1', '')}/${deal.stage}/${deal.slug}`;

        const emailBody = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">🔔 Deal Reminder: ${deal.title}</h2>
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <p><strong>Reminder Type:</strong> ${reminder.reminder_type.replace('_', ' ')}</p>
                  ${reminder.message ? `<p><strong>Message:</strong><br>${reminder.message.replace(/\n/g, '<br>')}</p>` : ''}
                </div>
                <p><a href="${dealUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">View Deal →</a></p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px;">
                  Reminder set by ${creator?.full_name || creator?.email || 'System'}<br>
                  ${new Date().toLocaleString()}
                </p>
              </div>
            </body>
          </html>
        `;

        const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: reminder.recipient_email }],
              subject: `🔔 Reminder: ${deal.title}`,
            }],
            from: {
              email: creator?.email || 'noreply@yourdomain.com',
              name: 'Deal Reminder System',
            },
            content: [{
              type: 'text/html',
              value: emailBody,
            }],
          }),
        });

        if (sendGridResponse.ok) {
          // Mark as sent
          await supabase
            .from('deal_reminders')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', reminder.id);

          // Log as comment
          await supabase.from('deal_comments').insert({
            deal_id: deal.id,
            user_id: reminder.created_by,
            comment: `🔔 Reminder sent to ${reminder.recipient_email}\n\n${reminder.message || ''}`,
          });

          sentCount++;
          console.log(`[Deal Reminders] Sent reminder ${reminder.id} to ${reminder.recipient_email}`);
        } else {
          const errorText = await sendGridResponse.text();
          console.error(`[Deal Reminders] SendGrid error for ${reminder.id}:`, errorText);
          errorCount++;
        }
      } catch (err) {
        console.error(`[Deal Reminders] Error processing reminder ${reminder.id}:`, err);
        errorCount++;
      }
    }

    console.log(`[Deal Reminders] Complete: ${sentCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        total: reminders?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Deal Reminders] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
