import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

export function sendVerificationEmail({
  to,
  displayName,
  token,
}: {
  to: string;
  displayName: string;
  token: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const verifyUrl = `https://ohmynic.co/blog/verify?token=${token}`;

  resend.emails
    .send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to,
      subject: 'Conferma il tuo account su OhMyNic!',
      html: `
        <p>Ciao ${displayName},</p>
        <p>Grazie per esserti registrato su <strong>OhMyNic!</strong>.</p>
        <p>Clicca il link qui sotto per confermare il tuo indirizzo email:</p>
        <p style="margin:24px 0;">
          <a href="${verifyUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Conferma account
          </a>
        </p>
        <p style="color:#888;font-size:0.9em;">
          Se non hai creato un account su OhMyNic!, puoi ignorare questa email.
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] email verifica fallita:', err);
    });
}

export function sendWelcomeEmail({
  to,
  displayName,
  username,
  tempPassword,
}: {
  to: string;
  displayName: string;
  username: string;
  tempPassword: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const loginUrl = 'https://ohmynic.co/blog/admin-login';

  resend.emails
    .send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to,
      subject: 'Il tuo account su OhMyNic! è pronto',
      html: `
        <p>Ciao ${displayName},</p>
        <p>Il tuo account su <strong>OhMyNic!</strong> è stato creato.</p>
        <p>
          <strong>Username:</strong> ${username}<br>
          <strong>Password temporanea:</strong> <code style="background:#f1efe8;padding:2px 6px;border-radius:4px;font-size:1rem;">${tempPassword}</code>
        </p>
        <p style="margin-top:24px;">
          <a href="${loginUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Accedi al pannello
          </a>
        </p>
        <p style="margin-top:24px;color:#888;font-size:0.9em;">
          Al primo accesso ti verrà chiesto di cambiare la password.
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] email benvenuto fallita:', err);
    });
}

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
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
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
  authorEmail,
  content,
}: {
  articleTitle: string;
  articleSlug: string;
  authorName: string | undefined;
  authorEmail: string | undefined;
  content: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  const notifyEmail = env.NOTIFY_EMAIL;

  if (!apiKey || !notifyEmail) return;

  const resend = new Resend(apiKey);
  const articleUrl = `https://ohmynic.co/blog/${articleSlug}`;
  const adminUrl = 'https://ohmynic.co/blog/admin/comments';

  const authorLine = authorName
    ? `<p><strong>Autore:</strong> ${authorName}</p>`
    : '';
  const emailLine = authorEmail
    ? `<p><strong>Email:</strong> <a href="mailto:${authorEmail}">${authorEmail}</a></p>`
    : '';

  resend.emails
    .send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to: notifyEmail,
      subject: `Nuovo commento su "${articleTitle}"`,
      html: `
        ${authorLine}
        ${emailLine}
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

// ── Editorial workflow notifications ──────────────────────────────────────────

/** 1. Contributor invia in revisione → email a Editor e Admin */
export function notifyReviewSubmitted({
  reviewers,
  articleTitle,
  articleId,
  authorName,
}: {
  reviewers: Array<{ email: string | null; displayName: string | null }>;
  articleTitle: string;
  articleId: string;
  authorName: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const adminUrl = `https://ohmynic.co/blog/admin/edit/${articleId}`;

  for (const reviewer of reviewers) {
    if (!reviewer.email) continue;
    resend.emails.send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to: reviewer.email,
      subject: `Nuovo articolo in revisione: ${articleTitle}`,
      html: `
        <p>Ciao ${reviewer.displayName ?? ''},</p>
        <p><strong>${authorName}</strong> ha inviato un articolo in revisione.</p>
        <p><strong>Titolo:</strong> ${articleTitle}</p>
        <p style="margin-top:24px;">
          <a href="${adminUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Apri nell'admin
          </a>
        </p>
      `,
    }).catch((err: unknown) => {
      console.error('[resend] notifica revisione fallita:', err);
    });
  }
}

/** 2. Editor approva → email agli Admin */
export function notifyArticleApproved({
  admins,
  articleTitle,
  articleId,
  approvedByName,
}: {
  admins: Array<{ email: string | null; displayName: string | null }>;
  articleTitle: string;
  articleId: string;
  approvedByName: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const adminUrl = `https://ohmynic.co/blog/admin/edit/${articleId}`;

  for (const admin of admins) {
    if (!admin.email) continue;
    resend.emails.send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to: admin.email,
      subject: `Articolo approvato pronto per pubblicazione: ${articleTitle}`,
      html: `
        <p>Ciao ${admin.displayName ?? ''},</p>
        <p><strong>${approvedByName}</strong> ha approvato l'articolo "${articleTitle}".</p>
        <p>È pronto per la pubblicazione.</p>
        <p style="margin-top:24px;">
          <a href="${adminUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Pubblica ora
          </a>
        </p>
      `,
    }).catch((err: unknown) => {
      console.error('[resend] notifica approvazione fallita:', err);
    });
  }
}

/** 3. Rimanda in bozza → email all'autore */
export function notifyReturnedToDraft({
  to,
  authorName,
  articleTitle,
  articleId,
  note,
}: {
  to: string;
  authorName: string;
  articleTitle: string;
  articleId: string;
  note: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const editUrl = `https://ohmynic.co/blog/admin/edit/${articleId}`;

  resend.emails.send({
    from: 'OhMyNic! Blog <noreply@ohmynic.co>',
    to,
    subject: `Revisione richiesta per: ${articleTitle}`,
    html: `
      <p>Ciao ${authorName},</p>
      <p>Il tuo articolo "<strong>${articleTitle}</strong>" è stato rimandato in bozza per una revisione.</p>
      <p><strong>Nota del revisore:</strong></p>
      <blockquote style="border-left:3px solid #7c5cbf;padding-left:12px;color:#555;margin:12px 0;">
        ${note.replace(/\n/g, '<br>')}
      </blockquote>
      <p style="margin-top:24px;">
        <a href="${editUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
          Modifica articolo
        </a>
      </p>
    `,
  }).catch((err: unknown) => {
    console.error('[resend] notifica rimanda in bozza fallita:', err);
  });
}

// ── Editorial comment notifications ──────────────────────────────────────────

export function notifyNewEditorialComment({
  recipients,
  articleTitle,
  articleId,
  authorName,
  commentContent,
  blockSnapshot,
}: {
  recipients: Array<{ email: string | null; displayName: string | null }>;
  articleTitle: string;
  articleId: string;
  authorName: string;
  commentContent: string;
  blockSnapshot?: string | null;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const adminUrl = `https://ohmynic.co/blog/admin/edit/${articleId}`;
  const blockHtml = blockSnapshot
    ? `<blockquote style="border-left:3px solid #d8d0f0;padding-left:10px;color:#888;font-style:italic;margin:0 0 12px;">${blockSnapshot}</blockquote>`
    : '';

  for (const recipient of recipients) {
    if (!recipient.email) continue;
    resend.emails.send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to: recipient.email,
      subject: `[${articleTitle}] Nuovo commento di ${authorName}`,
      html: `
        <p>Ciao ${recipient.displayName ?? ''},</p>
        <p><strong>${authorName}</strong> ha commentato l'articolo "<strong>${articleTitle}</strong>".</p>
        ${blockHtml}
        <blockquote style="border-left:3px solid #7c5cbf;padding-left:12px;color:#555;margin:12px 0;">
          ${commentContent.replace(/\n/g, '<br>')}
        </blockquote>
        <p style="margin-top:24px;">
          <a href="${adminUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Vedi nell'admin
          </a>
        </p>
      `,
    }).catch((err: unknown) => {
      console.error('[resend] notifica commento editoriale fallita:', err);
    });
  }
}

export function notifyEditorialCommentReply({
  to,
  recipientName,
  articleTitle,
  articleId,
  replierName,
  originalContent,
  replyContent,
}: {
  to: string;
  recipientName: string;
  articleTitle: string;
  articleId: string;
  replierName: string;
  originalContent: string;
  replyContent: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const adminUrl = `https://ohmynic.co/blog/admin/edit/${articleId}`;

  resend.emails.send({
    from: 'OhMyNic! Blog <noreply@ohmynic.co>',
    to,
    subject: `[${articleTitle}] ${replierName} ha risposto al tuo commento`,
    html: `
      <p>Ciao ${recipientName},</p>
      <p><strong>${replierName}</strong> ha risposto al tuo commento sull'articolo "<strong>${articleTitle}</strong>".</p>
      <p style="color:#888;font-size:0.9em;margin-bottom:4px;">Il tuo commento:</p>
      <blockquote style="border-left:3px solid #d8d0f0;padding-left:12px;color:#888;margin:0 0 16px;">${originalContent.replace(/\n/g, '<br>')}</blockquote>
      <p style="color:#555;font-size:0.9em;margin-bottom:4px;">Risposta:</p>
      <blockquote style="border-left:3px solid #7c5cbf;padding-left:12px;color:#555;margin:0 0 16px;">${replyContent.replace(/\n/g, '<br>')}</blockquote>
      <p style="margin-top:24px;">
        <a href="${adminUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
          Vedi nell'admin
        </a>
      </p>
    `,
  }).catch((err: unknown) => {
    console.error('[resend] notifica risposta commento editoriale fallita:', err);
  });
}

// ── Password reset ────────────────────────────────────────────────────────────

export function sendReaderPasswordReset({
  to,
  displayName,
  token,
}: {
  to: string;
  displayName: string;
  token: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const resetUrl = `https://ohmynic.co/blog/reset-password?token=${token}`;

  resend.emails
    .send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to,
      subject: 'Reimposta la tua password su OhMyNic!',
      html: `
        <p>Ciao ${displayName},</p>
        <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account su <strong>OhMyNic!</strong>.</p>
        <p>Clicca il link qui sotto per scegliere una nuova password:</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Reimposta password
          </a>
        </p>
        <p style="color:#888;font-size:0.9em;">
          Il link è valido per 1 ora. Se non hai richiesto il reset, puoi ignorare questa email.
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] email reset password lettore fallita:', err);
    });
}

export function sendAdminPasswordReset({
  to,
  displayName,
  token,
}: {
  to: string;
  displayName: string;
  token: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const resetUrl = `https://ohmynic.co/blog/admin-reset-password?token=${token}`;

  resend.emails
    .send({
      from: 'OhMyNic! Blog <noreply@ohmynic.co>',
      to,
      subject: 'Reimposta la tua password admin su OhMyNic!',
      html: `
        <p>Ciao ${displayName},</p>
        <p>Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account admin su <strong>OhMyNic!</strong>.</p>
        <p>Clicca il link qui sotto per scegliere una nuova password:</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
            Reimposta password
          </a>
        </p>
        <p style="color:#888;font-size:0.9em;">
          Il link è valido per 1 ora. Se non hai richiesto il reset, puoi ignorare questa email.
        </p>
      `,
    })
    .catch((err: unknown) => {
      console.error('[resend] email reset password admin fallita:', err);
    });
}

/** 4. Admin pubblica → email all'autore */
export function notifyArticlePublished({
  to,
  authorName,
  articleTitle,
  articleSlug,
}: {
  to: string;
  authorName: string;
  articleTitle: string;
  articleSlug: string;
}): void {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const publicUrl = `https://ohmynic.co/blog/${articleSlug}`;

  resend.emails.send({
    from: 'OhMyNic! Blog <noreply@ohmynic.co>',
    to,
    subject: `Il tuo articolo è online: ${articleTitle}`,
    html: `
      <p>Ciao ${authorName},</p>
      <p>Il tuo articolo "<strong>${articleTitle}</strong>" è stato pubblicato ed è ora visibile online.</p>
      <p style="margin-top:24px;">
        <a href="${publicUrl}" style="background:#7c55d4;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:500;">
          Leggi l'articolo
        </a>
      </p>
    `,
  }).catch((err: unknown) => {
    console.error('[resend] notifica pubblicazione fallita:', err);
  });
}
