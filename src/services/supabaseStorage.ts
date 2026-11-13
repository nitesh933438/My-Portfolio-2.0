import { createClient } from '@supabase/supabase-js';
import { apiUrl } from './api';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const STORAGE_BUCKET = 'portfolio-assets';

export type AssetFolder = 'certificates' | 'projects' | 'profile' | 'resume' | 'documents';

/**
 * Validates a file before upload
 */
export const validateFile = (file: File, allowedTypes: string[], maxSizeBytes: number) => {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }
  if (file.size > maxSizeBytes) {
    throw new Error(`File size ${Math.round(file.size / 1024 / 1024)}MB exceeds the limit of ${Math.round(maxSizeBytes / 1024 / 1024)}MB`);
  }
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return cleanName;
};

/**
 * Converts a File to an optimized Data URL (compressing images via HTML5 Canvas so they fit cleanly in Firestore
 * when deployed on static hosts without an Express backend).
 */
async function fileToClientDataUrl(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    try {
      const bitmap = await createImageBitmap(file);
      const maxDim = 1280;
      let width = bitmap.width;
      let height = bitmap.height;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        if (compressed && compressed.length < 900_000) {
          return compressed;
        }
        return canvas.toDataURL('image/jpeg', 0.65);
      }
    } catch {
      // Fallback to FileReader below
    }
  }

  return new Promise<string>((resolve, reject) => {
    // Reject non-image files over 700KB on static hosts instead of storing ephemeral blob: URLs that break in new tabs/reloads
    if (file.size > 700 * 1024 && !file.type.startsWith('image/')) {
      reject(
        new Error(
          'PDF size exceeds 700KB limit for static hosting fallback. Please compress the PDF under 700KB or upload with the backend/Supabase active.'
        )
      );
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read uploaded file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Proxy-based Upload with automatic client-side fallback when deployed on static hosts (405 Not Allowed).
 */
export const uploadFileProxy = async (
  file: File, 
  folder: AssetFolder, 
  idToken: string
): Promise<{ path: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // 1. Try Express backend proxy (/api/storage/upload)
  try {
    const response = await fetch(apiUrl('/api/storage/upload'), {
      method: 'POST',
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
      body: formData
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.toLowerCase().includes('application/json')) {
      const data = await response.json();
      if (data?.path && data?.url) {
        return { path: data.path, url: data.url };
      }
    }
  } catch (err) {
    console.warn('[Storage] Express upload endpoint unreachable, trying fallback:', err);
  }

  // 2. Try direct Supabase client upload if configured
  if (supabase) {
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `${folder}/${Date.now()}_${cleanName}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (!error) {
        const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
        return { path: storagePath, url: data.publicUrl };
      }
    } catch (supaErr) {
      console.warn('[Storage] Direct Supabase upload fallback skipped:', supaErr);
    }
  }

  // 3. Universal browser Data URL fallback (works 100% offline & on static hosts like GitHub Pages / nginx)
  const dataUrl = await fileToClientDataUrl(file);
  return { path: dataUrl, url: dataUrl };
};

/**
 * Proxy-based Delete: Calls the project backend to securely delete from storage,
 * and gracefully succeeds on static hosts or Data URLs.
 */
export const deleteFileProxy = async (path: string, idToken: string): Promise<void> => {
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) {
    return;
  }
  try {
    await fetch(apiUrl('/api/storage/delete'), {
      method: 'POST',
      headers: {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ path })
    });
  } catch (err) {
    console.warn('[Storage] Non-fatal delete warning:', err);
  }
};

/**
 * Resolves the public URL for a file.
 */
export const getStorageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  if (!supabase) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Resolves a signed URL for private files (e.g., documents).
 */
export const getSignedUrlProxy = async (path: string, idToken: string): Promise<string> => {
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) {
    return path;
  }
  if (path.startsWith('/uploads/') || path.startsWith('uploads/') || !supabase) {
    return path.startsWith('/') ? path : `/${path}`;
  }
  try {
    const response = await fetch(apiUrl(`/api/storage/signed-url?path=${encodeURIComponent(path)}`), {
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {}
    });
    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.toLowerCase().includes('application/json')) {
      const { url } = await response.json();
      if (url) return url;
    }
  } catch {
    // Fallback to public URL
  }
  return getStorageUrl(path);
};

/**
 * Generic Asset Resolver: Handles resolving URLs for all portfolio assets.
 */
export const resolveAssetUrl = (pathOrUrl: string, type: AssetFolder): string => {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  
  let cleanPath = pathOrUrl;
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  if (cleanPath.startsWith('uploads/')) {
    return `${prefix}${cleanPath}`;
  }

  const isTimestampedSupabasePath = /^(certificates|projects|profile|resume|documents)\/\d{10,}_/.test(cleanPath);

  if (isTimestampedSupabasePath) {
    return getStorageUrl(cleanPath);
  }

  if (
    cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('images/') ||
    cleanPath === 'nitesh_kumar_resume.pdf' ||
    cleanPath.startsWith('resume/') ||
    cleanPath.startsWith('certificates/') ||
    cleanPath.startsWith('certificate-') ||
    cleanPath.startsWith('nptel-')
  ) {
    if (cleanPath.startsWith('certificate-') || cleanPath.startsWith('nptel-')) {
      return `${prefix}certificates/${cleanPath}`;
    }
    return `${prefix}${cleanPath}`;
  }

  if (cleanPath.startsWith(`${type}/`)) {
    return `${prefix}${cleanPath}`;
  }
  
  return `${prefix}${type}/${cleanPath}`;
};
