"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  motion, 
  useScroll, 
  useTransform, 
  useMotionValueEvent, 
  useReducedMotion,
  useSpring,
  AnimatePresence
} from "framer-motion";

const TOTAL_FRAMES = 28;
const BASE_PATH = "/animated-s26-ultra-app";
const FRAME_PATH = (index: number) =>
  `${BASE_PATH}/images/s26-ultra/ezgif-frame-${(index + 1).toString().padStart(3, "0")}.webp`;

export default function S26UltraScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number | null>(null);
  
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Add cinematic smoothing to scroll progress to eliminate mouse-wheel chunkiness
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 15,
    mass: 0.1,
    restDelta: 0.001
  });

  // Preload images
  useEffect(() => {
    let isMounted = true;
    let loaded = 0;
    const imgArray: HTMLImageElement[] = [];

    const loadImages = async () => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = FRAME_PATH(i);
        
        img.onload = () => {
          if (!isMounted) return;
          loaded++;
          setLoadedCount(loaded);
          if (loaded === TOTAL_FRAMES) {
            setImages(imgArray);
            setIsLoaded(true);
          }
        };
        
        img.onerror = () => {
          if (!isMounted) return;
          // Gracefully continue on error
          loaded++;
          setLoadedCount(loaded);
          if (loaded === TOTAL_FRAMES) {
            setImages(imgArray);
            setIsLoaded(true);
          }
        };
        
        imgArray.push(img);
      }
    };
    
    if (!prefersReducedMotion) {
      loadImages();
    } else {
      const img = new Image();
      img.src = FRAME_PATH(0);
      img.onload = () => {
        if (isMounted) {
          setImages([img]);
          setIsLoaded(true);
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [prefersReducedMotion]);

  // Canvas rendering
  const renderFrame = React.useCallback((index: number) => {
    if (!canvasRef.current || !images[index] || !images[index].complete) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const img = images[index];
    
    // Draw deep black background exactly matching theme
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Contain Math using physical pixels
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    
    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawWidth = canvas.height * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    } else {
      drawHeight = canvas.width / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    }

    // High quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }, [images]);

  // Setup canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      // Use exact physical pixels for crisp Retina rendering
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      // Re-render current frame immediately on resize
      if (images.length > 0) {
        const progress = smoothProgress.get();
        const frameIndex = Math.min(
          TOTAL_FRAMES - 1,
          Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1)))
        );
        renderFrame(frameIndex);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [images, smoothProgress, renderFrame]);

  // Handle scroll updates
  useMotionValueEvent(smoothProgress, "change", (latest) => {
    if (prefersReducedMotion || !isLoaded || images.length === 0) return;
    
    const frameIndex = Math.min(
      TOTAL_FRAMES - 1,
      Math.max(0, Math.floor(latest * (TOTAL_FRAMES - 1)))
    );
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => renderFrame(frameIndex));
  });

  // Initial render and cleanup
  useEffect(() => {
    if (isLoaded && images.length > 0) {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => renderFrame(0));
    }
    
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isLoaded, images, renderFrame]);

  // Smooth cinematic text interpolations
  const opacity0 = useTransform(smoothProgress, [0, 0.1, 0.2], [1, 1, 0]);
  const y0 = useTransform(smoothProgress, [0, 0.2], [0, -40]);

  const opacity30 = useTransform(smoothProgress, [0.2, 0.3, 0.4], [0, 1, 0]);
  const y30 = useTransform(smoothProgress, [0.2, 0.3, 0.4], [40, 0, -40]);

  const opacity60 = useTransform(smoothProgress, [0.5, 0.6, 0.7], [0, 1, 0]);
  const y60 = useTransform(smoothProgress, [0.5, 0.6, 0.7], [40, 0, -40]);

  const opacity90 = useTransform(smoothProgress, [0.8, 0.9, 0.95], [0, 1, 0]);
  const y90 = useTransform(smoothProgress, [0.8, 0.9, 0.95], [40, 0, -40]);

  const loadingProgress = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  // Reduced motion alternative layout
  if (prefersReducedMotion) {
    return (
      <div className="w-full bg-[#050505] py-24 flex flex-col items-center justify-center gap-16 text-center relative z-10 px-8">
        <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white/90">Galaxy S26 Ultra</h2>
        <p className="text-xl text-white/60">Precision, redefined.</p>
        {images[0] && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img 
            src={images[0].src} 
            alt="Galaxy S26 Ultra Assembled" 
            className="w-full max-w-4xl object-contain h-[50vh] md:h-[70vh]" 
          />
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto text-left mt-12">
          <div>
            <h3 className="text-2xl font-light mb-4">Engineered from the inside out.</h3>
            <p className="text-white/60">Every layer works together with purpose. Explore the architecture behind the flagship.</p>
          </div>
          <div>
            <h3 className="text-2xl font-light mb-4">Technology, refined.</h3>
            <p className="text-white/60">Everything returns to one extraordinary form, precisely placed for ultimate performance.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-[400vh] bg-[#050505]">
      
      {/* Cinematic Loader */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white"
          >
            <h1 className="text-xl md:text-2xl tracking-[0.2em] font-medium text-white/90">GALAXY S26 ULTRA</h1>
            <p className="mt-6 text-sm tracking-widest text-white/60 transition-all duration-300">
              {loadingProgress}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Canvas Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-[#050505]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          // We don't set inline style width/height here since CSS classes handle it,
          // and getBoundingClientRect() calculates the physical dimension in resize handler.
        />

        {/* Cinematic Text Overlays */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6"
          style={{ opacity: opacity0, y: y0, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
        >
          <h2 className="text-5xl md:text-7xl font-light tracking-tight text-white mb-4">Galaxy S26 Ultra</h2>
          <p className="text-sm md:text-base uppercase tracking-[0.2em] text-white/70">Precision, redefined.</p>
        </motion.div>

        <motion.div 
          className="absolute inset-y-0 left-0 w-full md:w-1/2 flex flex-col justify-center pl-8 md:pl-24 pointer-events-none px-6"
          style={{ opacity: opacity30, y: y30, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
        >
          <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-6">Designed to disappear.</h2>
          <p className="text-sm md:text-base uppercase tracking-[0.15em] text-white/70 max-w-md leading-relaxed">Ultra-thin. Titanium-inspired.<br/>Engineered around every detail.</p>
        </motion.div>

        <motion.div 
          className="absolute inset-y-0 right-0 w-full md:w-1/2 flex flex-col justify-center items-end pr-8 md:pr-24 text-right pointer-events-none px-6"
          style={{ opacity: opacity60, y: y60, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
        >
          <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-6">Capture every detail.</h2>
          <p className="text-sm md:text-base uppercase tracking-[0.15em] text-white/70 max-w-md leading-relaxed">Pro-grade imaging with<br/>intelligent processing.</p>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6"
          style={{ opacity: opacity90, y: y90, textShadow: "0 4px 24px rgba(0,0,0,0.8)" }}
        >
          <h2 className="text-4xl md:text-6xl font-light tracking-tight text-white mb-6">Power without compromise.</h2>
          <p className="text-sm md:text-base uppercase tracking-[0.15em] text-white/70 max-w-md mx-auto leading-relaxed">Galaxy performance, refined<br/>for everything you do.</p>
        </motion.div>
      </div>
    </div>
  );
}
