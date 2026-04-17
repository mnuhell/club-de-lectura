import { supabase } from './client';

const AVATARS_BUCKET = 'avatars';
const COVERS_BUCKET = 'covers';

export async function uploadAvatar(userId: string, fileUri: string, contentType: string) {
  const ext = fileUri.split('.').pop();
  const path = `${userId}/avatar.${ext}`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(AVATARS_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  return getPublicUrl(AVATARS_BUCKET, path);
}

export async function uploadClubCover(clubId: string, fileUri: string, contentType: string) {
  const ext = fileUri.split('.').pop();
  const path = `${clubId}/cover.${ext}`;

  const response = await fetch(fileUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from(COVERS_BUCKET).upload(path, blob, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  return getPublicUrl(COVERS_BUCKET, path);
}

function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
