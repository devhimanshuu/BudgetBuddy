import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  role: string;
  inviteLink: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  workspaceName,
  role,
  inviteLink,
}: SendInviteEmailParams) {
  const roleLabel =
    role === "ADMIN" ? "Admin" : role === "EDITOR" ? "Editor" : "Viewer";

  const { data, error } = await resend.emails.send({
    from: "Budget Buddy <onboarding@resend.dev>",
    to: [to],
    subject: `${inviterName} invited you to "${workspaceName}" on Budget Buddy`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 32px 0;text-align:center;">
                      <div style="display:inline-block;margin-bottom:24px;">
                        <span style="font-size:28px;font-weight:900;letter-spacing:-0.5px;">
                            <span style="color:#fbbf24;font-size:26px;vertical-align:middle;margin-right:6px;">💰</span>
                            <span style="background:-webkit-linear-gradient(0deg, #fbbf24, #f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#f97316;vertical-align:middle;">Budget Buddy</span>
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:24px 32px;">
                      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f5f5f5;text-align:center;">
                        You're invited!
                      </h1>
                      <p style="margin:0 0 24px;font-size:15px;color:#a3a3a3;text-align:center;line-height:1.5;">
                        <strong style="color:#e5e5e5;">${inviterName}</strong> has invited you to collaborate on their budget workspace.
                      </p>
                      
                      <!-- Workspace Card -->
                      <div style="background-color:#262626;border:1px solid #333;border-radius:12px;padding:20px;margin-bottom:24px;">
                        <p style="margin:0 0 4px;font-size:12px;color:#737373;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Workspace</p>
                        <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#f5f5f5;">${workspaceName}</p>
                        <div style="display:inline-block;background-color:#451a03;border:1px solid rgba(249, 115, 22, 0.3);border-radius:6px;padding:4px 10px;">
                          <span style="font-size:12px;font-weight:600;color:#fbbf24;">${roleLabel} Access</span>
                        </div>
                      </div>
                      
                      <!-- CTA Button -->
                      <a href="${inviteLink}" style="display:block;background:linear-gradient(135deg, #fbbf24, #ea580c);color:#000000;text-decoration:none;text-align:center;padding:14px 24px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.3px;margin-bottom:8px;">
                        Accept Invitation →
                      </a>
                      
                      <p style="margin:24px 0 0;font-size:12px;color:#525252;text-align:center;line-height:1.5;">
                        This invite expires in 48 hours.<br>
                        If you didn't expect this email, you can safely ignore it.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px;border-top:1px solid #2a2a2a;">
                      <p style="margin:0;font-size:11px;color:#525252;text-align:center;">
                        Sent by <b>Budget Buddy</b> • Budget smarter, together.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });

  if (error) {
    console.error("Failed to send invite email:", error);
    throw new Error("Failed to send invite email");
  }

  return data;
}
