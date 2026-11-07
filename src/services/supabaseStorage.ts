import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing in environment variables. Storage features will be unavailable.');
}

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
  // Sanitize filename
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  return cleanName;
};

/**
 * Proxy-based Upload: Calls the project backend to perform a secure upload to Supabase.
 * This bridges Firebase Authentication with Supabase Storage without exposing the Service Role Key.
 */
export const uploadFileProxy = async (
  file: File, 
  folder: AssetFolder, 
  idToken: string
): Promise<{ path: string; url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload file');
  }

  return await response.json();
};

/**
 * Proxy-based Delete: Calls the project backend to securely delete from Supabase.
 */
export const deleteFileProxy = async (path: string, idToken: string): Promise<void> => {
  const response = await fetch('/api/storage/delete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete file');
  }
};

/**
 * Resolves the public URL for a file.
 * If the path is a full URL, returns it. Otherwise, generates a Supabase Public URL.
 */
export const getStorageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  
  if (!supabase) {
    console.warn('Supabase storage not configured. Returning raw path.');
    return path;
  }
  
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return data.publicUrl;
};

/**
 * Resolves a signed URL for private files (e.g., documents).
 */
export const getSignedUrlProxy = async (path: string, idToken: string): Promise<string> => {
  const response = await fetch(`/api/storage/signed-url?path=${encodeURIComponent(path)}`, {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get signed URL');
  }

  const { url } = await response.json();
  return url;
};

/**
 * Generic Asset Resolver: Handles resolving URLs for all portfolio assets.
 * 1. Returns full HTTP URLs as is.
 * 2. Resolves Supabase paths (e.g. certificates/filename.jpg) to public URLs.
 * 3. Resolves local filenames to public/ repository paths.
 */
export const resolveAssetUrl = (pathOrUrl: string, type: AssetFolder): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  
  let cleanPath = pathOrUrl;
  while (cleanPath.startsWith('./') || cleanPath.startsWith('/')) {
    if (cleanPath.startsWith('./')) cleanPath = cleanPath.slice(2);
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.slice(1);
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  const prefix = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  // Known local static asset paths in /public directory
  if (
    cleanPath.startsWith('assets/') ||
    cleanPath.startsWith('images/') ||
    cleanPath === 'nitesh_kumar_resume.pdf' ||
    cleanPath.startsWith('resume/') ||
    cleanPath.startsWith('certificates/certificate-') ||
    cleanPath.startsWith('certificate-')
  ) {
    if (cleanPath.startsWith('certificate-')) {
      return `${prefix}certificates/${cleanPath}`;
    }
    return `${prefix}${cleanPath}`;
  }

  // Known Supabase storage folder prefix check
  const isSupabaseFolder = ['certificates', 'projects', 'profile', 'resume', 'documents'].some(folder => 
    cleanPath.startsWith(`${folder}/`)
  );

  if (isSupabaseFolder) {
    return getStorageUrl(cleanPath);
  }

  // Fallback to local static asset in the respective public folder
  if (cleanPath.startsWith(`${type}/`)) {
    return `${prefix}${cleanPath}`;
  }
  
  return `${prefix}${type}/${cleanPath}`;
};
