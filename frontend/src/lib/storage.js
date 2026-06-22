import { supabase } from './supabase'

/**
 * Buckets expected in Supabase Storage (create these in Step 5 of setup):
 *  - avatars         (public)
 *  - post-images     (public)
 *  - event-posters   (public)
 *  - community-banners (public)
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file) {
  if (!file) return 'No file selected.'
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, WEBP, or GIF images are allowed.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Image must be smaller than 5MB.'
  }
  return null
}

/**
 * Uploads a file to a bucket under the current user's folder and returns
 * the public URL. Path shape: {userId}/{timestamp}-{filename}
 */
export async function uploadImage(bucket, file, userId) {
  const error = validateImageFile(file)
  if (error) throw new Error(error)

  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteImage(bucket, publicUrl, userId) {
  // Extract storage path from public URL (everything after the bucket name)
  const marker = `/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  if (!path.startsWith(userId)) return // safety: only delete own files client-side
  await supabase.storage.from(bucket).remove([path])
}
