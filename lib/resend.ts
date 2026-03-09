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
        <body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#09090b;border-radius:12px;border:1px solid #27272a;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:40px 32px 0;text-align:center;">
                      <div style="display:inline-block;margin-bottom:24px;">
                        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                          <tr>
                            <td style="padding-right:8px;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-1.5L20 8.5c0-2.3-1.2-3.5-1-3.5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
                            </td>
                            <td>
                              <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;background:-webkit-linear-gradient(0deg, #fbbf24, #f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;color:#f97316;">Budget Buddy</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding:16px 32px 32px;">
                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fafafa;text-align:center;">
                        You're invited!
                      </h1>
                      <p style="margin:0 0 32px;font-size:15px;color:#a1a1aa;text-align:center;line-height:1.6;">
                        <strong style="color:#fafafa;">${inviterName}</strong> has invited you to collaborate on their budget workspace.
                      </p>
                      
                      <!-- Workspace Card -->
                      <div style="background-color:#09090b;border:1px solid #27272a;border-radius:12px;padding:24px;margin-bottom:32px;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.5);">
                        <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Workspace</p>
                        <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#fafafa;">${workspaceName}</p>
                        <div style="display:inline-block;background-color:rgba(245, 158, 11, 0.15);border:1px solid rgba(245, 158, 11, 0.3);border-radius:6px;padding:4px 10px;">
                          <span style="font-size:12px;font-weight:600;color:#f59e0b;">${roleLabel} Access</span>
                        </div>
                      </div>
                      
                      <!-- CTA Button -->
                      <a href="${inviteLink}" style="display:block;background:linear-gradient(to right, #fbbf24, #f97316);color:#09090b;text-decoration:none;text-align:center;padding:14px 24px;border-radius:8px;font-size:16px;font-weight:600;margin-bottom:8px;box-shadow:0 4px 6px -1px rgba(249, 115, 22, 0.2);">
                        Accept Invitation →
                      </a>
                      
                      <p style="margin:24px 0 0;font-size:13px;color:#71717a;text-align:center;line-height:1.5;">
                        This invite expires in 48 hours.<br>
                        If you didn't expect this email, you can safely ignore it.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding:24px 32px;border-top:1px solid #27272a;background-color:#09090b;">
                      <p style="margin:0;font-size:12px;color:#71717a;text-align:center;">
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
