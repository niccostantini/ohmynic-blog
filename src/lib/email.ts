import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

export function sendCommentReply({
  to,
  articleTitle,
  articleSlug,
  replyText,
}: {
  to: string;
  articleTitle: string;
  articleSlug: string;
  replyText: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const articleUrl = `https://ohmynic.co/blog/${articleSlug}`;

  resend.emails
    .send({
      from: 'OhMyNic! Blog <onboarding@resend.dev>',
      to,
      subject: `Re: il tuo commento su "${articleTitle}"`,
      html: `
        <p>${replyText.replace(/\n/g, '<br>')}</p>
        <p style="margin-top:24px;">
          <a href="${articleUrl}">Leggi l'articolo</a>
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] risposta commento fallita:', err);
    });
}

export function notifyNewComment({
  articleTitle,
  articleSlug,
  authorName,
  content,
}: {
  articleTitle: string;
  articleSlug: string;
  authorName: string | undefined;
  content: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  const notifyEmail = env.NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const author = authorName || 'Anonimo';
  const articleUrl = `https://ohmynic.co/blog/${articleSlug}`;
  const adminUrl = 'https://ohmynic.co/blog/admin/comments';

  resend.emails
    .send({
      from: 'OhMyNic! Blog <onboarding@resend.dev>',
      to: notifyEmail,
      subject: `Nuovo commento su "${articleTitle}"`,
      html: `
        <p><strong>Autore:</strong> ${author}</p>
        <p><strong>Commento:</strong></p>
        <blockquote style="border-left:3px solid #7c5cbf;padding-left:12px;color:#555;">
          ${content.replace(/\n/g, '<br>')}
        </blockquote>
        <p>
          <a href="${articleUrl}">Vai all'articolo</a> &nbsp;·&nbsp;
          <a href="${adminUrl}">Approva o elimina</a>
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] notifica commento fallita:', err);
    });
}
