// Notification Engine: lib/notifications/engine.ts
// Secure backend dispatcher for in-app alert feeds and transactional email routing.

import { createAdminClient } from '@/lib/supabase/admin';

export type NotificationType =
  | 'order_placed'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'order_cancelled'
  | 'escrow_released'
  | 'payout_requested'
  | 'payout_processed'
  | 'payout_rejected'
  | 'refund_requested'
  | 'refund_approved'
  | 'refund_rejected'
  | 'new_message'
  | 'review_received'
  | 'system_alert';

export interface SendNotificationInput {
  profileId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, any>;
  sendEmail?: boolean;
  recipientEmail?: string | null;
}

/**
 * Dispatches an in-app notification securely via the Admin Client (bypassing strict RLS).
 * Optionally triggers transactional emails using direct HTTP Resend API integration.
 */
export async function sendNotification(input: SendNotificationInput): Promise<any> {
  try {
    const supabase = await createAdminClient();

    // 1. Insert in-app notification into the database
    const { data: dbNotification, error } = await supabase
      .from('notifications')
      .insert({
        profile_id: input.profileId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata || {},
        is_read: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('🔴 Failed to insert in-app notification:', error);
      throw new Error(`In-app notification failure: ${error.message}`);
    }

    console.log(`🔔 [IN-APP ALERT] Created notification ${dbNotification.id} for profile ${input.profileId}`);

    // 2. Route email notifications if enabled
    if (input.sendEmail && input.recipientEmail) {
      await routeEmailNotification(input.recipientEmail, input.title, input.body);
    }

    return dbNotification;
  } catch (err: any) {
    console.error('🔴 Error in sendNotification dispatcher:', err);
    throw err;
  }
}

/**
 * Integrates directly with Resend REST endpoints using Fetch API.
 * Gracefully falls back to beautiful console mock tracking if environment key is missing.
 */
async function routeEmailNotification(to: string, subject: string, bodyText: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Essaouira Marketplace <onboarding@resend.dev>';

  if (!apiKey) {
    // Elegant local developer tracking block
    console.log(`
┌──────────────────────────────────────────────────────────┐
│ ✉️  [MOCK EMAIL DISPATCH - DEV SANDBOX MODE]            │
├──────────────────────────────────────────────────────────┤
│ To:      ${to.padEnd(47)} │
│ Subject: ${subject.slice(0, 47).padEnd(47)} │
│ Message: ${bodyText.slice(0, 47).padEnd(47)}... │
├──────────────────────────────────────────────────────────┤
│ Setup RESEND_API_KEY in .env.local to enable live emails.│
└──────────────────────────────────────────────────────────┘
`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${subject}</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; margin: 0; padding: 40px 10px; color: #343a40;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e9ecef;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 30px; text-align: center;">
                    <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">Essaouira Artisan Marketplace</h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 5px 0 0 0; text-transform: uppercase;">Essaouira, Morocco</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1e293b; font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 20px;">${subject}</h2>
                    <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">${bodyText}</p>
                    <div style="margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                      <a href="https://essaouira-marketplace.com" style="display: inline-block; background-color: #0284c7; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px;">Visit Marketplace Storefront</a>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
                    <p style="margin: 5px 0 0 0;">© 2026 Essaouira Marketplace. Medina Hubs. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `
      })
    });

    if (!res.ok) {
      const responseErr = await res.json();
      console.error('🔴 Resend API returned error status:', responseErr);
    } else {
      console.log(`✉️ [LIVE EMAIL DISPATCH] Successfully routed email to ${to}`);
    }
  } catch (err) {
    console.error('🔴 Failed to dispatch email via Resend:', err);
  }
}
