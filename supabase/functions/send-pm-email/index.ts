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
    const { dealId, recipientEmail, recipientName, subject, message, dealTitle, dealUrl } = await req.json();

    if (!recipientEmail || !subject || !message) {
      throw new Error('Missing required fields: recipientEmail, subject, message');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sender info from auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get sender profile
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const senderName = senderProfile?.full_name || user.email;
    const senderEmail = senderProfile?.email || user.email;

    // Send email via SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Message regarding: ${dealTitle || 'Deal'}</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            ${dealUrl ? `<p><a href="${dealUrl}" style="color: #2563eb; text-decoration: none;">View Deal Details →</a></p>` : ''}
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Sent by ${senderName} (${senderEmail})<br>
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
          to: [{ email: recipientEmail, name: recipientName }],
          subject: subject,
        }],
        from: {
          email: senderEmail,
          name: senderName,
        },
        content: [{
          type: 'text/html',
          value: emailBody,
        }],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('[Send PM Email] SendGrid error:', errorText);
      throw new Error(`SendGrid API error: ${sendGridResponse.status}`);
    }

    // Log email as activity/comment
    if (dealId) {
      await supabase.from('deal_comments').insert({
        deal_id: dealId,
        user_id: user.id,
        comment: `📧 Email sent to ${recipientName} (${recipientEmail})\n\nSubject: ${subject}\n\n${message}`,
      });
    }

    console.log(`[Send PM Email] Email sent to ${recipientEmail} successfully`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Send PM Email] Error:', error);
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
