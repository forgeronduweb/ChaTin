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

export const EMAIL_DESIGNS = ['announcement', 'promo', 'newsletter', 'welcome'] as const;
export type EmailDesign = (typeof EMAIL_DESIGNS)[number];

export type EmailCta = { label: string; url: string } | null | undefined;

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
const FONT_STACK = "-apple-system,'Segoe UI',Roboto,sans-serif";

// A real <table> button, not a styled <a> - Outlook's Word rendering engine
// ignores padding/border-radius on anchors but honours it on table cells,
// which is why every email-safe button pattern is built this way.
function renderCtaButton(cta: EmailCta, align: 'left' | 'center'): string {
  if (!cta?.label || !cta.url) return '';
  const margin = align === 'center' ? '28px auto 0' : '28px 0 0';
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:${margin};">
      <tr><td style="background:#F6C445;border-radius:999px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:14px 30px;font-size:14px;font-weight:800;color:#161616;text-decoration:none;font-family:${FONT_STACK};">${escapeHtml(cta.label)}</a>
      </td></tr>
    </table>`;
}

// Shared brand sign-off - every reference design (G-Shock, Akkio, Foxbit,
// CairPair...) ends on some kind of footer, so all 4 designs get this
// instead of just trailing off after the content.
function renderFooter(): string {
  return `<div style="text-align:center;padding:22px 20px 4px;font-size:11px;color:#8C876F;font-family:${FONT_STACK};">ChaTin — ton compagnon IA sympa, disponible à tout moment.</div>`;
}

// Sober card, logo + wordmark, a thin brand-colour top edge - the safe
// default and what announcement-triggered emails always use regardless of
// what's selected for manual sends.
function renderAnnouncementDesign(paragraphs: string, cta: EmailCta): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:32px 16px;background:#F7F3E6;font-family:${FONT_STACK};">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:#EFEAD6;border-radius:16px;overflow:hidden;border-top:4px solid #F6C445;">
      <div style="padding:32px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
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
        ${renderCtaButton(cta, 'left')}
      </div>
    </div>
    ${renderFooter()}
  </div>
</body>
</html>`;
}

// Bold yellow banner up top with the subject as a headline - built for
// promos/offers where the email should read as an event, not a memo.
function renderPromoDesign(subject: string, paragraphs: string, cta: EmailCta): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:24px 16px;background:#F7F3E6;font-family:${FONT_STACK};">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <div style="background:#F6C445;padding:30px 28px 26px;text-align:center;">
        <img src="${LOGO_URL}" width="40" height="40" alt="ChaTin" style="border-radius:11px;display:inline-block;margin-bottom:12px;" />
        <div style="font-size:21px;font-weight:800;color:#161616;line-height:1.3;">${escapeHtml(subject)}</div>
      </div>
      <div style="padding:28px;text-align:center;">
        <div style="font-size:15px;line-height:1.6;color:#161616;text-align:left;">
          ${paragraphs}
        </div>
        ${renderCtaButton(cta, 'center')}
      </div>
    </div>
    ${renderFooter()}
  </div>
</body>
</html>`;
}

// Dark masthead with the subject as a real H1, wider column - reads as a
// proper newsletter issue rather than a single short notice.
function renderNewsletterDesign(subject: string, paragraphs: string, cta: EmailCta): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:${FONT_STACK};">
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
      ${renderCtaButton(cta, 'left')}
    </div>
    <div style="padding:20px 28px;border-top:1px solid #E6E1D2;text-align:center;font-size:12px;color:#8C876F;">
      Envoyé par ChaTin
    </div>
  </div>
</body>
</html>`;
}

// Pink -> yellow -> green gradient masthead, echoing the flower mark's own
// petal colours - onboarding/first-touch emails (welcome, "let's get
// started"), the one place a bit of celebration earns its keep.
function renderWelcomeDesign(subject: string, paragraphs: string, cta: EmailCta): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:24px 16px;background:#F7F3E6;font-family:${FONT_STACK};">
  <div style="max-width:480px;margin:0 auto;">
    <div style="background:#FFFFFF;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#F3A7C7 0%,#F6C445 55%,#3FBE7A 100%);padding:40px 28px;text-align:center;">
        <div style="font-size:38px;line-height:1;margin-bottom:10px;">🌸</div>
        <div style="font-size:24px;font-weight:800;color:#161616;">${escapeHtml(subject)}</div>
      </div>
      <div style="padding:30px 28px;text-align:center;">
        <div style="font-size:15px;line-height:1.6;color:#161616;text-align:left;">
          ${paragraphs}
        </div>
        ${renderCtaButton(cta, 'center')}
      </div>
    </div>
    ${renderFooter()}
  </div>
</body>
</html>`;
}

export function renderEmailHtml(design: EmailDesign, subject: string, rawBody: string, recipientName: string, cta?: EmailCta): string {
  const paragraphs = formatParagraphs(rawBody, recipientName);
  if (design === 'promo') return renderPromoDesign(subject, paragraphs, cta);
  if (design === 'newsletter') return renderNewsletterDesign(subject, paragraphs, cta);
  if (design === 'welcome') return renderWelcomeDesign(subject, paragraphs, cta);
  return renderAnnouncementDesign(paragraphs, cta);
}
