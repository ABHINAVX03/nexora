import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface PostMediaCarouselProps {
  mediaUrls: string[];
  alt?: string;
}

export const PostMediaCarousel: React.FC<PostMediaCarouselProps> = ({
  mediaUrls,
  alt = 'Post attachment',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const validUrls = (mediaUrls || []).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  if (validUrls.length === 0) {
    return null;
  }

  // Single Image View
  if (validUrls.length === 1) {
    const singleUrl = validUrls[0];
    return (
      <>
        <div className="relative rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 bg-slate-100 dark:bg-dark-elevated max-h-[520px] group">
          <img
            src={singleUrl}
            alt={alt}
            loading="lazy"
            className="w-full h-full max-h-[520px] object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
            onClick={() => setIsLightboxOpen(true)}
          />
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900/80"
            title="Expand image"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={singleUrl}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  // Multi-Image Carousel View (2 to 6 images)
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validUrls.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validUrls.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) {
      // Swiped right -> prev
      setCurrentIndex((prev) => (prev === 0 ? validUrls.length - 1 : prev - 1));
    } else if (deltaX < -40) {
      // Swiped left -> next
      setCurrentIndex((prev) => (prev === validUrls.length - 1 ? 0 : prev + 1));
    }
    setTouchStartX(null);
  };

  return (
    <div className="space-y-2">
      {/* Main Active Image Display */}
      <div
        className="relative rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 bg-slate-950 aspect-[16/10] sm:aspect-[16/9] max-h-[500px] group select-none flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={validUrls[currentIndex]}
          alt={`${alt} - ${currentIndex + 1}`}
          loading="lazy"
          className="w-full h-full object-contain cursor-pointer transition-opacity duration-300"
          onClick={() => setIsLightboxOpen(true)}
        />

        {/* Counter Badge (e.g. 1 / 3) */}
        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-white text-xs font-bold shadow-md border border-white/10">
          {currentIndex + 1} / {validUrls.length}
        </div>

        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md opacity-85 group-hover:opacity-100 hover:bg-slate-900 transition-all hover:scale-110 shadow-lg border border-white/10"
          title="Previous photo"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md opacity-85 group-hover:opacity-100 hover:bg-slate-900 transition-all hover:scale-110 shadow-lg border border-white/10"
          title="Next photo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Bottom Slide Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10">
          {validUrls.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx
                  ? 'w-5 bg-brand-400 shadow-sm'
                  : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              title={`Go to photo ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Thumbnail Strip */}
      {validUrls.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
          {validUrls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === idx
                  ? 'border-brand-500 ring-2 ring-brand-500/30 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative max-w-[92vw] max-h-[92vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validUrls[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scale-in"
            />

            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

