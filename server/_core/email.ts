import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email using the Manus built-in email service
 * Returns `true` if successful, `false` if service is unavailable
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html } = payload;

  if (!to || !subject || !html) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Email recipient, subject, and content are required.",
    });
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    console.warn("[Email] Notification service not configured");
    return false;
  }

  try {
    // Using Manus built-in email service via Forge API
    const endpoint = new URL(
      "webdevtoken.v1.WebDevService/SendEmail",
      ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`
    ).toString();

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Email] Failed to send email to ${to} (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return false;
    }

    console.log(`[Email] Successfully sent email to ${to}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Email template for new registration notification to admin
 */
export function getNewRegistrationEmailTemplate(
  userName: string,
  userEmail: string,
  approvalUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Nuova Richiesta di Iscrizione</h1>
          </div>
          
          <div class="content">
            <p>Un nuovo utente si è iscritto a Option DAX e richiede approvazione.</p>
            
            <p><strong>Nome:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            
            <p>Clicca il pulsante sottostante per accedere al pannello di approvazione:</p>
            
            <a href="${approvalUrl}" class="button">Visualizza Richieste di Approvazione</a>
          </div>
          
          <div class="footer">
            <p>Questo è un messaggio automatico da Option DAX. Non rispondere a questa email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Email template for account approved notification
 */
export function getApprovedEmailTemplate(userName: string, loginUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Iscrizione Approvata!</h1>
          </div>
          
          <div class="content">
            <p>Ciao ${userName},</p>
            
            <p>La tua iscrizione a <strong>Option DAX</strong> è stata approvata da un amministratore! 🎉</p>
            
            <p>Puoi ora accedere alla piattaforma e iniziare a gestire le tue strategie di trading.</p>
            
            <a href="${loginUrl}" class="button">Accedi a Option DAX</a>
            
            <p>Se hai domande o hai bisogno di assistenza, contatta il nostro team di supporto.</p>
          </div>
          
          <div class="footer">
            <p>Questo è un messaggio automatico da Option DAX. Non rispondere a questa email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Email template for account rejected notification
 */
export function getRejectedEmailTemplate(
  userName: string,
  rejectionReason?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 20px; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin: 20px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Richiesta di Iscrizione Rifiutata</h1>
          </div>
          
          <div class="content">
            <p>Ciao ${userName},</p>
            
            <p>Purtroppo, la tua richiesta di iscrizione a <strong>Option DAX</strong> è stata rifiutata.</p>
            
            ${
              rejectionReason
                ? `<p><strong>Motivo:</strong> ${rejectionReason}</p>`
                : ""
            }
            
            <p>Se ritieni che si tratti di un errore o hai domande, contatta il nostro team di supporto.</p>
          </div>
          
          <div class="footer">
            <p>Questo è un messaggio automatico da Option DAX. Non rispondere a questa email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
