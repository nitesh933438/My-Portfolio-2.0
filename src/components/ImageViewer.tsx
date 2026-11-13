import React, { useState, useRef, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Maximize, 
  Minimize, 
  Maximize2, 
  ImageOff, 
  Loader2,
  Sparkles
} from 'lucide-react';
import { useModalHistory } from '../hooks/useModalHistory';
import { downloadAssetFile } from '../utils/fileDownload';

interface ImageViewerProps {
  isOpen: boolean;
  images: string[];
  currentIndex: number;
  titles?: string[];
  projectTitle: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const ImageViewer: FC<ImageViewerProps> = ({
  isOpen,
  images,
  currentIndex,
  titles,
  projectTitle,
  onClose,
  onIndexChange,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDist, setTouchDist] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { closeModal } = useModalHistory(isOpen, 'image-viewer', onClose);

  const viewerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const totalImages = images.length;
  const currentImage = images[currentIndex] || images[0] || '';
  const currentTitle = titles?.[currentIndex] || `Screenshot ${currentIndex + 1}`;

  // Reset zoom, position, loading & error states when current index or image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsLoading(true);
    setHasError(false);
  }, [currentIndex, isOpen, currentImage]);

  // Prevent background scrolling while open, restore previous state on close
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Track Fullscreen status change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex, isOpen]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is inside an input/textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, currentIndex, totalImages, closeModal]);

  if (!isOpen || totalImages === 0) return null;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onIndexChange((currentIndex + 1) % totalImages);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onIndexChange((currentIndex - 1 + totalImages) % totalImages);
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFitScreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (!document.fullscreenElement && viewerRef.current) {
        await viewerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen API error:', err);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentImage || isDownloading) return;

    try {
      setIsDownloading(true);
      await downloadAssetFile(currentImage, `${projectTitle}_screenshot_${currentIndex + 1}`, {
        defaultExt: 'jpg',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.25 : -0.25;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + zoomFactor, 1), 4);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Drag / Pan handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for swipe (unzoomed), pinch (zoomed/unzoomed), & pan (zoomed)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDist(dist);
    } else if (e.touches.length === 1) {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      } else {
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDist !== null) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDist;
      setScale((prev) => Math.min(Math.max(prev * factor, 1), 4));
      setTouchDist(dist);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale === 1 && touchStartX !== null && touchStartY !== null && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      const threshold = 40; // min swipe distance in px

      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    setTouchDist(null);
    setIsDragging(false);
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Double tap / double click to toggle zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={viewerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col select-none overflow-hidden touch-none"
        role="dialog"
        aria-modal="true"
        aria-label={`Fullscreen image viewer for ${projectTitle}`}
        onClick={() => scale === 1 && closeModal()}
      >
        {/* Top Control Bar */}
        <header 
          className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent pointer-events-auto gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left: Counter & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono text-xs font-bold tracking-widest border border-indigo-500/20 shrink-0 shadow-sm">
              {currentIndex + 1} / {totalImages}
            </span>
            <div className="hidden sm:block min-w-0">
              <h3 className="text-white font-bold text-sm truncate max-w-xs md:max-w-md leading-snug">
                {currentTitle}
              </h3>
              <p className="text-indigo-400 text-[10px] font-semibold uppercase tracking-wider truncate">
                {projectTitle}
              </p>
            </div>
          </div>

          {/* Right: Controls Strip */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/90 p-1 sm:p-1.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl shrink-0">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              aria-label="Zoom Out (-)"
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[11px] font-mono font-bold text-slate-200 px-1 sm:px-2 min-w-[2.8rem] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              aria-label="Zoom In (+)"
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-white/15 mx-0.5 hidden sm:block" />

            {/* Reset Zoom */}
            <button
              onClick={handleResetZoom}
              aria-label="Reset Zoom (0)"
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Fit Screen */}
            <button
              onClick={handleFitScreen}
              aria-label="Fit to Screen"
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Fit to Screen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Native Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 hidden sm:flex min-w-[36px] min-h-[36px] items-center justify-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Download Original */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label="Download Image"
              className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Download Original Screenshot"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Download className="w-4 h-4" />}
            </button>

            <div className="w-px h-4 bg-white/15 mx-0.5" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => closeModal()}
              aria-label="Close Viewer (Esc)"
              className="p-2 sm:p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30 active:scale-95 min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Close Viewer (Esc)"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <div
          ref={containerRef}
          className={`flex-1 flex items-center justify-center p-3 sm:p-8 pt-16 pb-24 overflow-hidden relative w-full h-full ${
            scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {/* Loading Indicator */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 pointer-events-none z-10">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Loading Screenshot...</span>
            </div>
          )}

          {/* Error Fallback Frame (No broken images or external unverified hosts) */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-slate-900/90 border border-slate-800 text-center max-w-md shadow-2xl z-20">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <ImageOff className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-base">Image Unavailable</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  The requested screenshot asset could not be loaded.
                </p>
              </div>
              <button
                onClick={() => {
                  setHasError(false);
                  setIsLoading(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <motion.img
              key={currentImage}
              src={currentImage}
              alt={currentTitle}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              className={`max-h-[calc(100vh-160px)] max-w-[94vw] object-contain select-none shadow-2xl rounded-xl pointer-events-auto ${
                isLoading ? 'opacity-0' : 'opacity-100'
              } transition-opacity duration-300`}
              draggable={false}
            />
          )}
        </div>

        {/* Floating Navigation Arrows */}
        {totalImages > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-white/10 backdrop-blur-md shadow-2xl transition-all hover:scale-105 active:scale-95 z-30 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 p-3 sm:p-4 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-white/10 backdrop-blur-md shadow-2xl transition-all hover:scale-105 active:scale-95 z-30 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Bottom Thumbnail Strip & Mobile Title */}
        <footer 
          className="absolute bottom-0 inset-x-0 z-40 p-2 sm:p-4 bg-gradient-to-t from-slate-950/98 via-slate-950/80 to-transparent flex flex-col items-center gap-2 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Title display */}
          <div className="text-center sm:hidden px-4 min-w-0 max-w-full">
            <p className="text-white font-bold text-xs truncate max-w-[280px]">
              {currentTitle}
            </p>
          </div>

          {/* Thumbnail strip */}
          <div 
            ref={thumbnailContainerRef}
            className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full py-1.5 px-3 custom-scrollbar"
          >
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                  onIndexChange(idx);
                }}
                aria-label={`Go to screenshot ${idx + 1}`}
                className={`relative w-14 h-10 sm:w-16 sm:h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  currentIndex === idx 
                    ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/50' 
                    : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/30'
                }`}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${idx + 1}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {currentIndex === idx && (
                  <div className="absolute inset-0 bg-indigo-500/15 pointer-events-none" />
                )}
                <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/80 text-[8px] font-mono text-white font-bold">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};
