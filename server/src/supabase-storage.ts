import { createClient } from '@supabase/supabase-js';

const BUCKET = 'apks';

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set to upload APKs.');
  }
  return createClient(url, key);
}

let bucketReady: Promise<void> | undefined;

async function ensureBucket(): Promise<void> {
  const client = getClient();
  const { data } = await client.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await client.storage.createBucket(BUCKET, { public: true });
  if (error && !error.message.includes('already exists')) throw error;
}

export async function uploadApk(buffer: Buffer, filename: string): Promise<string> {
  bucketReady ??= ensureBucket();
  await bucketReady;

  const client = getClient();
  const path = `${Date.now()}-${filename}`;
  const { error } = await client.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'application/vnd.android.package-archive',
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
