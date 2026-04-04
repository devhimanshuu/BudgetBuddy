import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
	console.warn("SENDGRID_API_KEY is not set in environment variables.");
} else {
	sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_FROM || "hello@budgetbuddy.app";

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

	const roleColor =
		role === "ADMIN" ? "#f59e0b" : role === "EDITOR" ? "#fb923c" : "#a1a1aa";

	const msg = {
		to: to,
		from: FROM_EMAIL,
		subject: `${inviterName} invited you to "${workspaceName}" on Budget Buddy`,
		html: `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>You're invited to ${workspaceName}</title>
  <!--[if mso]>
  <style>
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#050505;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  
  <!-- Preheader text (hidden, shows in email preview) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${inviterName} has invited you to collaborate on "${workspaceName}" — join now and start budgeting smarter, together.
  </div>

  <!-- OUTER WRAPPER -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#050505;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <!-- MAIN CARD -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          
          <!-- ═══════════════════════════════════════ -->
          <!-- TOP ACCENT BAR (amber gradient) -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #ea580c 100%);border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- CARD BODY -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="background-color:#0a0a0b;border-left:1px solid #1c1c1e;border-right:1px solid #1c1c1e;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                
                <!-- ─── LOGO SECTION ─── -->
                <tr>
                  <td style="padding:48px 40px 0;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td style="vertical-align:middle;padding-right:10px;">
                          <!-- Piggy Bank Logo - using high-quality PNG from emoji CDN -->
                          <img 
                            src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f416.png" 
                            alt="🐖" 
                            width="44" 
                            height="44" 
                            style="display:block;width:44px;height:44px;border:0;outline:none;"
                          >
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:30px;font-weight:800;letter-spacing:-1px;color:#fbbf24;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Budget</span>
                          <span style="font-size:30px;font-weight:800;letter-spacing:-1px;color:#f97316;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Buddy</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ─── DIVIDER ─── -->
                <tr>
                  <td style="padding:28px 40px 0;">
                    <div style="height:1px;background:linear-gradient(90deg, transparent 0%, #27272a 30%, #27272a 70%, transparent 100%);"></div>
                  </td>
                </tr>

                <!-- ─── HERO TEXT ─── -->
                <tr>
                  <td style="padding:32px 40px 0;text-align:center;">
                    <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#fafafa;line-height:1.2;letter-spacing:-0.5px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                      You've been invited! ✨
                    </h1>
                    <p style="margin:0;font-size:16px;color:#a1a1aa;line-height:1.7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                      <strong style="color:#e4e4e7;">${inviterName}</strong> wants you to join their workspace and start managing budgets together.
                    </p>
                  </td>
                </tr>

                <!-- ─── WORKSPACE CARD ─── -->
                <tr>
                  <td style="padding:32px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111113;border:1px solid #1e1e21;border-radius:12px;overflow:hidden;">
                      <!-- Card top accent -->
                      <tr>
                        <td style="height:3px;background:linear-gradient(90deg, #f59e0b 0%, #f97316 100%);font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                      <tr>
                        <td style="padding:24px 28px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <!-- Workspace name -->
                            <tr>
                              <td>
                                <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;font-family:'Inter',-apple-system,sans-serif;">Workspace</p>
                                <p style="margin:0;font-size:22px;font-weight:700;color:#fafafa;letter-spacing:-0.3px;font-family:'Inter',-apple-system,sans-serif;">${workspaceName}</p>
                              </td>
                            </tr>
                            <!-- Spacer -->
                            <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
                            <!-- Role + Inviter row -->
                            <tr>
                              <td>
                                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                  <tr>
                                    <!-- Role badge -->
                                    <td style="padding-right:12px;">
                                      <div style="display:inline-block;background-color:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);border-radius:8px;padding:6px 14px;">
                                        <span style="font-size:12px;font-weight:600;color:${roleColor};font-family:'Inter',-apple-system,sans-serif;">● ${roleLabel}</span>
                                      </div>
                                    </td>
                                    <!-- Invited by -->
                                    <td>
                                      <div style="display:inline-block;background-color:rgba(161,161,170,0.08);border:1px solid rgba(161,161,170,0.15);border-radius:8px;padding:6px 14px;">
                                        <span style="font-size:12px;font-weight:500;color:#a1a1aa;font-family:'Inter',-apple-system,sans-serif;">Invited by ${inviterName}</span>
                                      </div>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ─── CTA BUTTON ─── -->
                <tr>
                  <td style="padding:32px 40px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="border-radius:12px;background:linear-gradient(135deg, #f59e0b 0%, #f97316 60%, #ea580c 100%);">
                          <a href="${inviteLink}" target="_blank" style="display:block;padding:16px 32px;font-size:16px;font-weight:700;color:#0a0a0b;text-decoration:none;text-align:center;letter-spacing:-0.2px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
                            Accept Invitation →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ─── SECONDARY LINK ─── -->
                <tr>
                  <td style="padding:16px 40px 0;text-align:center;">
                    <p style="margin:0;font-size:13px;color:#52525b;font-family:'Inter',-apple-system,sans-serif;">
                      or copy this link: <a href="${inviteLink}" style="color:#f59e0b;text-decoration:underline;word-break:break-all;">${inviteLink}</a>
                    </p>
                  </td>
                </tr>

                <!-- ─── EXPIRY NOTICE ─── -->
                <tr>
                  <td style="padding:28px 40px 0;text-align:center;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td style="background-color:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.12);border-radius:10px;padding:12px 20px;">
                          <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;font-family:'Inter',-apple-system,sans-serif;">
                            ⏳ This invitation expires in <strong style="color:#f59e0b;">48 hours</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ─── BOTTOM SPACING ─── -->
                <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>

              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- FOOTER -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="background-color:#080809;border-top:1px solid #1c1c1e;border-left:1px solid #1c1c1e;border-right:1px solid #1c1c1e;border-bottom:1px solid #1c1c1e;border-radius:0 0 16px 16px;padding:28px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 8px;font-size:13px;color:#52525b;font-family:'Inter',-apple-system,sans-serif;">
                      Sent by <strong style="color:#71717a;">Budget Buddy</strong> • Budget smarter, together.
                    </p>
                    <p style="margin:0;font-size:12px;color:#3f3f46;font-family:'Inter',-apple-system,sans-serif;">
                      If you didn't expect this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══════════════════════════════════════ -->
          <!-- BRAND FOOTER BADGE -->
          <!-- ═══════════════════════════════════════ -->
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#27272a;letter-spacing:1px;text-transform:uppercase;font-weight:600;font-family:'Inter',-apple-system,sans-serif;">
                Powered by BudgetBuddy
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
	};

	try {
		const result = await sgMail.send(msg);
		return result;
	} catch (error: any) {
		console.error(
			"Failed to send invite email:",
			error.response?.body || error.message,
		);
		throw new Error("Failed to send invite email");
	}
}
