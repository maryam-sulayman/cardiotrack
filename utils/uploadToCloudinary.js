// utils/uploadToCloudinary.js
import { CLOUDINARY_CLOUD, CLOUDINARY_FOLDER, CLOUDINARY_PRESET } from '@/config/cloudinary';

/**
 * Upload a local image to Cloudinary (unsigned).
 * @param {string} uri - local file URI from ImagePicker
 * @param {{ publicId?: string }} options
 * @returns {Promise<{ secureUrl: string, avatarUrl: string, publicId: string }>}
 */
export async function uploadToCloudinary(uri, { publicId } = {}) {
  if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD and CLOUDINARY_PRESET.');
  }

  const data = new FormData();
  // Make sure name & type are provided; React Native uses them to set the multipart boundary correctly.
  data.append('file', {
    uri,
    type: 'image/jpeg', // If you know the real MIME, set it; jpeg works for most ImagePicker outputs
    name: publicId ? `${publicId}.jpg` : 'upload.jpg',
  });
  data.append('upload_preset', CLOUDINARY_PRESET);
  if (CLOUDINARY_FOLDER) data.append('folder', CLOUDINARY_FOLDER);
  if (publicId) data.append('public_id', publicId);

  // Do NOT set Content-Type manually; let fetch set the multipart boundary.
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: data,
  });

  const json = await res.json();

  if (!res.ok) {
    // Cloudinary returns { error: { message } } on failure.
    throw new Error(json?.error?.message || 'Cloudinary upload failed');
  }

  // A pretty avatar transformation (256x256, circle, face crop, auto format/quality)
  const avatarUrl = json.secure_url.replace(
    '/image/upload/',
    '/image/upload/f_auto,q_auto,w_256,h_256,c_fill,g_face,r_max/'
  );

  return {
    secureUrl: json.secure_url,
    avatarUrl,
    publicId: json.public_id,
  };
}
