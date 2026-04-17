import { supabase } from './client'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'

const AVATARS_BUCKET = 'avatars'
const COVERS_BUCKET = 'covers'

async function uploadFile(bucket: string, path: string, fileUri: string, contentType: string) {
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: 'base64',
  })
  const { error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
    contentType,
    upsert: true,
  })
  if (error) throw error
  return getPublicUrl(bucket, path)
}

export async function uploadAvatar(userId: string, fileUri: string, contentType: string) {
  const ext = contentType.split('/')[1] ?? 'jpg'
  return uploadFile(AVATARS_BUCKET, `${userId}/avatar.${ext}`, fileUri, contentType)
}

export async function uploadClubCover(clubId: string, fileUri: string, contentType: string) {
  const ext = contentType.split('/')[1] ?? 'jpg'
  return uploadFile(COVERS_BUCKET, `${clubId}/cover.${ext}`, fileUri, contentType)
}

function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
