// Resend (https://resend.com) - plain REST call, no SDK needed, same style
// as the rest of this file's siblings (news.ts, weather.ts, sports.ts).
// Requires RESEND_API_KEY - sign up free at https://resend.com/api-keys
// Sending "from" the shared onboarding@resend.dev test address works
// without any domain verification; swap FROM_ADDRESS once a real domain is
// verified on the Resend account.

const FROM_ADDRESS = 'ChaTin <onboarding@resend.dev>';
const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }
}

export const EMAIL_DESIGNS = ['announcement', 'promo', 'newsletter'] as const;
export type EmailDesign = (typeof EMAIL_DESIGNS)[number];

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Blank-line-separated paragraphs, a "{{name}}" placeholder - same
// lightweight convention as everywhere else in this codebase that renders
// user-authored text (chat messages, announcements).
function formatParagraphs(rawBody: string, recipientName: string): string {
  const personalized = rawBody.replace(/\{\{\s*name\s*\}\}/gi, recipientName || 'there');
  return personalized
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px;">${escapeHtml(block).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

const LOGO_URL = 'https://forgeronduweb.github.io/ChaTin/images/icon.png';

// Sober card, logo + wordmark, no strong color - the safe default and what
// announcement-triggered emails always use regardless of what the admin
// picks for manual sends.
function renderAnnouncementDesign(paragraphs: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:32px 16px;background:#F7F3E6;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#EFEAD6;border-radius:16px;padding:32px 28px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:10px;">
          <img src="${LOGO_URL}" width="32" height="32" alt="ChaTin" style="border-radius:9px;display:block;" />
        </td>
        <td style="font-size:16px;font-weight:800;color:#161616;">ChaTin</td>
      </tr>
    </table>
    <div style="font-size:15px;line-height:1.6;color:#161616;">
      ${paragraphs}
    </div>
  </div>
</body>
</html>`;
}

// Bold yellow banner up top with the subject as a headline - built for
// promos/offers where the email should read as an event, not a memo.
function renderPromoDesign(subject: string, paragraphs: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:24px 16px;background:#F7F3E6;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;overflow:hidden;">
    <div style="background:#F6C445;padding:28px 28px 24px;text-align:center;">
      <img src="${LOGO_URL}" width="40" height="40" alt="ChaTin" style="border-radius:11px;display:inline-block;margin-bottom:12px;" />
      <div style="font-size:20px;font-weight:800;color:#161616;line-height:1.3;">${escapeHtml(subject)}</div>
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.6;color:#161616;">
      ${paragraphs}
    </div>
  </div>
</body>
</html>`;
}

// Dark masthead with the subject as a real H1, wider column, a footer line -
// reads as a proper newsletter issue rather than a single short notice.
function renderNewsletterDesign(subject: string, paragraphs: string): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:#161616;padding:32px 28px;text-align:center;">
      <img src="${LOGO_URL}" width="36" height="36" alt="ChaTin" style="border-radius:10px;display:inline-block;margin-bottom:10px;" />
      <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#F6C445;">ChaTin</div>
    </div>
    <div style="padding:32px 28px;">
      <h1 style="margin:0 0 20px;font-size:22px;color:#161616;line-height:1.3;">${escapeHtml(subject)}</h1>
      <div style="font-size:15px;line-height:1.7;color:#3A382F;">
        ${paragraphs}
      </div>
    </div>
    <div style="padding:20px 28px;border-top:1px solid #E6E1D2;text-align:center;font-size:12px;color:#8C876F;">
      Envoyé par ChaTin
    </div>
  </div>
</body>
</html>`;
}

export function renderEmailHtml(design: EmailDesign, subject: string, rawBody: string, recipientName: string): string {
  const paragraphs = formatParagraphs(rawBody, recipientName);
  if (design === 'promo') return renderPromoDesign(subject, paragraphs);
  if (design === 'newsletter') return renderNewsletterDesign(subject, paragraphs);
  return renderAnnouncementDesign(paragraphs);
}
