interface InviteEmailProps {
  ownerName: string
  eventName: string
  role:      string
  inviteUrl: string
}

export function buildInviteEmail({ ownerName, eventName, role, inviteUrl }: InviteEmailProps): string {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1).replace(/-/g, ' ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>You're invited to co-host ${eventName}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-size:22px;font-weight:800;letter-spacing:-.02em;color:#ffffff;">
                Evenzi
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#1a1a1a;border-radius:20px;border:1px solid #2a2a2a;padding:40px 36px;">

              <!-- Icon -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;text-align:center;">
                    <div style="display:inline-block;width:56px;height:56px;border-radius:16px;background:#e53935;line-height:56px;text-align:center;font-size:26px;">
                      🎉
                    </div>
                  </td>
                </tr>

                <!-- Heading -->
                <tr>
                  <td style="text-align:center;padding-bottom:8px;">
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-.02em;line-height:1.2;">
                      You&rsquo;re invited!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.6;">
                      <strong style="color:#ffffff;">${ownerName}</strong> has invited you to help manage
                      <strong style="color:#ffffff;">${eventName}</strong> as a <strong style="color:#e53935;">${roleLabel}</strong>.
                    </p>
                  </td>
                </tr>

                <!-- CTA -->
                <tr>
                  <td style="text-align:center;padding-bottom:32px;">
                    <a href="${inviteUrl}"
                       style="display:inline-block;background:#e53935;color:#ffffff;font-size:14px;font-weight:700;
                              letter-spacing:.06em;text-transform:uppercase;text-decoration:none;
                              padding:14px 32px;border-radius:9999px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="border-top:1px solid #2a2a2a;padding-top:24px;">
                    <p style="margin:0;font-size:12px;color:#6b7280;text-align:center;line-height:1.6;">
                      If the button doesn&rsquo;t work, copy and paste this link into your browser:<br/>
                      <a href="${inviteUrl}" style="color:#e53935;word-break:break-all;">${inviteUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                &copy; 2026 Evenzi &middot; You received this because someone invited you to their event.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
