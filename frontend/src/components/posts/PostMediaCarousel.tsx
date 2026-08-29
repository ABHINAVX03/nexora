import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Grid, Columns } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const validUrls = (mediaUrls || []).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  if (validUrls.length === 0) {
    return null;
  }

  const openLightboxAtIndex = (idx: number) => {
    setCurrentIndex(idx);
    setIsLightboxOpen(true);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validUrls.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === validUrls.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) {
      handlePrev();
    } else if (deltaX < -40) {
      handleNext();
    }
    setTouchStartX(null);
  };

  // Render Grid Layouts (1, 2, 3, 4+ images)
  const renderGridLayout = () => {
    const count = validUrls.length;

    // 1 Image: Full view
    if (count === 1) {
      return (
        <div className="relative rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 bg-slate-100 dark:bg-dark-elevated max-h-[540px] group">
          <img
            src={validUrls[0]}
            alt={alt}
            loading="lazy"
            className="w-full h-full max-h-[540px] object-cover hover:scale-[1.01] transition-transform duration-300 cursor-pointer"
            onClick={() => openLightboxAtIndex(0)}
          />
          <button
            onClick={() => openLightboxAtIndex(0)}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/60 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900/80"
            title="Expand image"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // 2 Images: 2-column side-by-side
    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 aspect-[16/9] max-h-[460px] bg-slate-900">
          {validUrls.map((url, idx) => (
            <div
              key={idx}
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              onClick={() => openLightboxAtIndex(idx)}
            >
              <img
                src={url}
                alt={`${alt} ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      );
    }

    // 3 Images: 1 large left, 2 stacked right
    if (count === 3) {
      return (
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 aspect-[16/9] max-h-[480px] bg-slate-900">
          <div
            className="relative w-full h-full overflow-hidden cursor-pointer group"
            onClick={() => openLightboxAtIndex(0)}
          >
            <img
              src={validUrls[0]}
              alt={`${alt} 1`}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="grid grid-rows-2 gap-1.5 h-full">
            <div
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              onClick={() => openLightboxAtIndex(1)}
            >
              <img
                src={validUrls[1]}
                alt={`${alt} 2`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              onClick={() => openLightboxAtIndex(2)}
            >
              <img
                src={validUrls[2]}
                alt={`${alt} 3`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      );
    }

    // 4+ Images: 2x2 grid (with +N overlay if > 4)
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 rounded-2xl overflow-hidden border border-light-border/70 dark:border-dark-border/70 aspect-[16/10] sm:aspect-[16/9] max-h-[500px] bg-slate-900">
        {validUrls.slice(0, 4).map((url, idx) => {
          const isFourthWithMore = idx === 3 && count > 4;
          return (
            <div
              key={idx}
              className="relative w-full h-full overflow-hidden cursor-pointer group"
              onClick={() => openLightboxAtIndex(idx)}
            >
              <img
                src={url}
                alt={`${alt} ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {isFourthWithMore && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-white text-2xl font-bold">
                  +{count - 3}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Slider / Carousel View
  const renderCarouselLayout = () => {
    return (
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

        {/* Counter Badge */}
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
    );
  };

  return (
    <div className="space-y-2">
      {/* Top Toggle for Multi-image posts (> 1 image) */}
      {validUrls.length > 1 && (
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-dark-muted">
          <span className="font-semibold">{validUrls.length} Photos</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-elevated rounded-lg p-0.5 border border-light-border/60 dark:border-dark-border/60">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'carousel'
                  ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Slider view"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Display: Grid or Carousel */}
      {viewMode === 'grid' ? renderGridLayout() : renderCarouselLayout()}

      {/* Interactive Thumbnail Strip (for Carousel or Quick Jump) */}
      {validUrls.length > 1 && viewMode === 'carousel' && (
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
          {/* Close Lightbox */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Lightbox Photo Counter */}
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-sm font-semibold border border-white/10 z-10">
            {currentIndex + 1} of {validUrls.length}
          </div>

          <div
            className="relative max-w-[92vw] max-h-[92vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validUrls[currentIndex]}
              alt={`${alt} - ${currentIndex + 1}`}
              className="max-w-[92vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-scale-in"
            />

            {validUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all hover:scale-110 shadow-xl border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-all hover:scale-110 shadow-xl border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


