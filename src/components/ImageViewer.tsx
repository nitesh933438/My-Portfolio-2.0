import { useState, useRef, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Sparkles } from 'lucide-react';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom and position when image index changes or viewer opens
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex, isOpen]);

  // Lock body scroll when open and restore on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

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
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-' || e.key === '_') handleZoomOut();
      if (e.key === '0') handleResetZoom();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, scale, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];
  const currentTitle = titles?.[currentIndex] || `Screenshot ${currentIndex + 1}`;

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onIndexChange((currentIndex + 1) % images.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
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
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDist !== null) {
      e.preventDefault();
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
    if (scale === 1 && touchStartX !== null && e.changedTouches.length === 1) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      const threshold = 50; // min swipe distance
      if (diff > threshold) {
        handleNext();
      } else if (diff < -threshold) {
        handlePrev();
      }
    }
    setTouchDist(null);
    setIsDragging(false);
    setTouchStartX(null);
  };

  // Double click to toggle zoom
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col select-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label={`Fullscreen image viewer for ${projectTitle}`}
        onClick={() => scale === 1 && onClose()}
      >
        {/* Top Navigation & Controls Bar */}
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-8 py-4 bg-gradient-to-b from-slate-950/95 via-slate-950/60 to-transparent pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-white font-mono text-xs font-bold tracking-widest border border-white/15 backdrop-blur-md shadow-lg">
              {currentIndex + 1} / {images.length}
            </span>
            <div className="hidden sm:block">
              <h3 className="text-white font-bold text-sm truncate max-w-xs md:max-w-md">{currentTitle}</h3>
              <p className="text-indigo-400 text-[10px] font-semibold uppercase tracking-wider">{projectTitle}</p>
            </div>
          </div>

          {/* Zoom & Action Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md shadow-2xl">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              aria-label="Zoom Out"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-slate-200 px-2 min-w-[3.2rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              aria-label="Zoom In"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-white/15 mx-0.5" />
            <button
              onClick={handleResetZoom}
              aria-label="Reset Zoom"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <a
              href={currentImage}
              target="_blank"
              rel="noopener noreferrer"
              download
              aria-label="Download or Open Original Image"
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all"
              title="Open Original in New Tab"
            >
              <Download className="w-4 h-4" />
            </a>
            <div className="w-px h-5 bg-white/15 mx-0.5" />
            <button
              onClick={onClose}
              aria-label="Close Viewer"
              className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              title="Close Viewer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Image Viewport with Panning & Zooming */}
        <div
          ref={containerRef}
          className={`flex-1 flex items-center justify-center p-4 sm:p-12 overflow-hidden relative ${
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
          <motion.img
            key={currentImage}
            src={currentImage}
            alt={currentTitle}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
            className="max-h-[80vh] max-w-[92vw] object-contain select-none shadow-2xl rounded-xl pointer-events-auto"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop';
            }}
          />
        </div>

        {/* Prev / Next Floating Arrow Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Image"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-105 active:scale-95 z-30"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Image"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-slate-900/90 hover:bg-indigo-600 text-white border border-white/15 backdrop-blur-md shadow-2xl transition-all hover:scale-105 active:scale-95 z-30"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Bottom Thumbnails & Title Bar */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent flex flex-col items-center gap-3 pointer-events-auto">
          <div className="text-center sm:hidden px-4">
            <p className="text-white font-bold text-xs truncate max-w-xs">{currentTitle}</p>
          </div>

          <div 
            ref={thumbnailContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto max-w-full py-2 px-4 custom-scrollbar"
          >
            {images.map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                onClick={() => {
                  setScale(1);
                  setPosition({ x: 0, y: 0 });
                  onIndexChange(idx);
                }}
                aria-label={`Go to screenshot ${idx + 1}`}
                className={`relative w-16 h-11 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  currentIndex === idx 
                    ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/40 ring-2 ring-indigo-500/50' 
                    : 'border-white/20 opacity-50 hover:opacity-100 hover:border-white/40'
                }`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                {currentIndex === idx && (
                  <div className="absolute inset-0 bg-indigo-500/15 pointer-events-none" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
