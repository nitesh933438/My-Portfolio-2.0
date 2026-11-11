/**
 * Resolve API paths for both same-origin hosting and a separately hosted backend.
 * Leave VITE_API_BASE_URL empty when Express serves the frontend and API together.
 */
const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE = configuredBase.replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};

export async function readJsonResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const body = await response.text();
  if (!contentType.toLowerCase().includes('application/json')) {
    const preview = body.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`API returned ${response.status} ${response.statusText} instead of JSON. Check backend URL/deployment. Response: ${preview || 'empty response'}`);
  }
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new Error('The API returned malformed JSON. Check the backend logs and retry.');
  }
}
