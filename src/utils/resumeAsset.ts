import { useEffect, useMemo, useState } from 'react';
import { resolveAssetUrl } from '../services/supabaseStorage';

export const DEFAULT_RESUME_PDF_PATH = '/assets/aistudio/Nitesh_Kumar_-_Resume_8ce55380.pdf';
export const DEFAULT_RESUME_IMG_PATH = '/assets/nitesh_resume_page.png';

export function toAbsoluteAssetUrl(url: string): string {
  if (!url) return '';
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

export function useResolvedResume(rawResumeUrl?: string) {
  const fallbackPdfUrl = useMemo(
    () => toAbsoluteAssetUrl(resolveAssetUrl(DEFAULT_RESUME_PDF_PATH, 'resume')),
    []
  );

  const resumeImageUrl = useMemo(
    () => toAbsoluteAssetUrl(resolveAssetUrl(DEFAULT_RESUME_IMG_PATH, 'resume')),
    []
  );

  const initialCandidate = useMemo(() => {
    const trimmed = (rawResumeUrl || '').trim();
    if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
      return fallbackPdfUrl;
    }
    return toAbsoluteAssetUrl(resolveAssetUrl(trimmed, 'resume'));
  }, [rawResumeUrl, fallbackPdfUrl]);

  const [pdfUrl, setPdfUrl] = useState<string>(initialCandidate);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let createdBlobUrl: string | null = null;
    const trimmed = (rawResumeUrl || '').trim();

    if (!trimmed || trimmed.startsWith('blob:')) {
      setPdfUrl(fallbackPdfUrl);
      setIsVerifying(false);
      return;
    }

    // Convert data: URI to a live Blob URL so Chrome/Edge/Safari allow opening it in a new tab
    if (trimmed.startsWith('data:')) {
      setIsVerifying(true);
      fetch(trimmed)
        .then((res) => res.blob())
        .then((blob) => {
          if (!active) return;
          createdBlobUrl = URL.createObjectURL(blob);
          setPdfUrl(createdBlobUrl);
        })
        .catch(() => {
          if (active) setPdfUrl(fallbackPdfUrl);
        })
        .finally(() => {
          if (active) setIsVerifying(false);
        });

      return () => {
        active = false;
        if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
      };
    }

    const candidateUrl = toAbsoluteAssetUrl(resolveAssetUrl(trimmed, 'resume'));
    setPdfUrl(candidateUrl);

    if (candidateUrl === fallbackPdfUrl) {
      setIsVerifying(false);
      return;
    }

    const isSameOrigin = (() => {
      try {
        return new URL(candidateUrl, window.location.href).origin === window.location.origin;
      } catch {
        return true;
      }
    })();

    // Verify PDF actually exists and isn't an SPA 404 HTML fallback page
    setIsVerifying(true);
    fetch(candidateUrl, { method: 'HEAD' })
      .then((res) => {
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!res.ok || ct.includes('text/html')) {
          throw new Error('Invalid PDF response');
        }
        if (active) setPdfUrl(candidateUrl);
      })
      .catch(() => {
        // Retry with GET range in case host rejects HEAD (405)
        fetch(candidateUrl, { headers: { Range: 'bytes=0-32' } })
          .then((res) => {
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (!res.ok || ct.includes('text/html')) {
              throw new Error('Invalid PDF response');
            }
            if (active) setPdfUrl(candidateUrl);
          })
          .catch(() => {
            // Only force fallback if same-origin check failed (404/unreachable); keep cross-origin HTTPS URLs if CORS blocked fetch
            if (active && isSameOrigin) setPdfUrl(fallbackPdfUrl);
          })
          .finally(() => {
            if (active) setIsVerifying(false);
          });
      })
      .finally(() => {
        if (active) setIsVerifying(false);
      });

    return () => {
      active = false;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [rawResumeUrl, fallbackPdfUrl]);

  return {
    pdfUrl,
    fallbackPdfUrl,
    resumeImageUrl,
    isVerifying,
  };
}
