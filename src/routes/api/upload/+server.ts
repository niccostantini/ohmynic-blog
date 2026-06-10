import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import sharp from 'sharp';
import type { RequestHandler } from './$types';

function getS3(): S3Client {
  const accountId  = env.R2_ACCOUNT_ID;
  const accessKey  = env.R2_ACCESS_KEY_ID;
  const secretKey  = env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('R2 credentials not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

const MAX_SIZE = 15 * 1024 * 1024; // 15 MB

export const POST: RequestHandler = async ({ request, locals }) => {
  // Only authenticated staff (admin / editor / contributor)
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let client: S3Client;
  try {
    client = getS3();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Upload non configurato sul server.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const bucket    = env.R2_BUCKET_NAME;
  const publicUrl = env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    return new Response(
      JSON.stringify({ error: 'Upload non configurato sul server.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || typeof file === 'string') {
    return new Response(
      JSON.stringify({ error: 'Nessun file ricevuto.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Server-side validation — never trust the client
  if (file.size > MAX_SIZE) {
    return new Response(
      JSON.stringify({ error: 'Il file supera il limite di 15 MB.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!file.type.startsWith('image/')) {
    return new Response(
      JSON.stringify({ error: 'Tipo file non valido. Sono accettate solo immagini.' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const raw = Buffer.from(await file.arrayBuffer());

  let buffer: Buffer;
  let contentType: string;
  let ext: string;

  if (file.type === 'image/gif') {
    buffer = raw;
    contentType = 'image/gif';
    ext = 'gif';
  } else {
    buffer = await sharp(raw)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    contentType = 'image/webp';
    ext = 'webp';
  }

  const key = `uploads/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  const url = `${publicUrl.replace(/\/$/, '')}/${key}`;

  return json({ url });
};
