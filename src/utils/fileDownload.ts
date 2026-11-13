import { buildSafeDownloadFilename } from './navigationHelpers';

export async function downloadAssetFile(
  primaryUrl: string,
  titleOrFilename: string,
  options?: {
    fallbackUrl?: string;
    defaultExt?: string;
    explicitFilename?: string;
  }
): Promise<void> {
  if (!primaryUrl && !options?.fallbackUrl) return;

  const targetUrl = primaryUrl || options?.fallbackUrl || '';
  const filename =
    options?.explicitFilename ||
    buildSafeDownloadFilename(titleOrFilename, targetUrl, options?.defaultExt || 'pdf');

  try {
    let response = await fetch(targetUrl);
    if (!response.ok && options?.fallbackUrl && options.fallbackUrl !== targetUrl) {
      response = await fetch(options.fallbackUrl);
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const ct = (response.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('text/html') && options?.fallbackUrl && options.fallbackUrl !== targetUrl) {
      const retry = await fetch(options.fallbackUrl);
      if (retry.ok && !(retry.headers.get('content-type') || '').toLowerCase().includes('text/html')) {
        response = retry;
      } else {
        throw new Error('Unexpected HTML response');
      }
    } else if (ct.includes('text/html')) {
      throw new Error('Unexpected HTML response');
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch {
    const fallbackHref = options?.fallbackUrl || targetUrl;
    const link = document.createElement('a');
    link.href = fallbackHref;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
