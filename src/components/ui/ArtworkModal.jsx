import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Square } from 'lucide-react';

export default function ArtworkModal({ artwork, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const utteranceRef = useRef(null);

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Stop any ongoing speech if the artwork changes or component unmounts
  useEffect(() => {
    stopAudio();
    return () => {
      stopAudio();
    };
  }, [artwork]);

  const startAudio = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    // Stop current speech first
    window.speechSynthesis.cancel();

    // Prepare text to read
    const textToRead = artwork.audioText || `${artwork.title} by ${artwork.artist}. ${artwork.description}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;

    // Configure voice properties
    utterance.rate = 0.95; // Slightly slower, museum guide pace
    utterance.pitch = 1.0;

    // Handle speech state changes
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      setIsPlaying(false);
    };

    // Begin speaking
    window.speechSynthesis.speak(utterance);
  };

  const toggleAudio = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  if (!artwork) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-96 z-20 pointer-events-auto flex flex-col font-sans bg-[#F2EDE1] text-[#1A1A1A] rounded-none shadow-[0_24px_60px_rgba(0,0,0,0.5)] border border-[#D4AF37]/30 overflow-hidden animate-slide-in-right">

      {/* 1. HEADER IMAGE (mounted plate with hairline gold rule beneath) */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-[#E9E3D4] border-b border-[#D4AF37]/30">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-3 right-3 w-8 h-8 rounded-none border border-black/30 bg-[#F2EDE1]/90 text-[#1A1A1A] hover:bg-[#F2EDE1] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. PLAQUE BODY */}
      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6 plaque-scrollbar">

        {/* Title block */}
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-luxury-extreme text-[#D4AF37] mb-2">
            SHAKYA CATALOGUE
          </span>
          <h2 className="font-serif text-[28px] font-medium leading-tight text-[#141110]">
            {artwork.title}
          </h2>
          <p className="mt-1 font-serif italic text-[15px] text-[#45403A]">
            {artwork.artist}
          </p>
        </div>

        {/* Catalogue details */}
        <dl className="border-y border-black/10 divide-y divide-black/10">
          {[
            ['Year', artwork.year],
            ['Medium', artwork.medium],
            ...(artwork.widthIn != null && artwork.heightIn != null
              ? [[
                  'Dimensions',
                  `${artwork.widthIn} × ${artwork.heightIn} in · ${Math.round(artwork.widthIn * 2.54)} × ${Math.round(artwork.heightIn * 2.54)} cm`,
                ]]
              : []),
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[10px] font-bold uppercase tracking-luxury-wide text-[#6D675C] shrink-0">
                {label}
              </dt>
              <dd className="text-xs font-semibold text-[#1A1A1A] text-right min-w-0">
                {value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Audio guide */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h4 className="text-[10px] font-bold uppercase tracking-luxury-wide text-[#D4AF37]">
              Audio Guide
            </h4>
            <p className="text-[11px] text-[#6D675C] mt-1 truncate">
              {isPlaying ? 'Narration playing…' : 'Listen to the curatorial analysis'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Monochrome equalizer while speaking */}
            {isPlaying && (
              <div className="flex items-end gap-[3px] h-5 w-8">
                <span className="w-[3px] h-3 bg-[#D4AF37] rounded-none animate-audio-bar-1"></span>
                <span className="w-[3px] h-5 bg-[#D4AF37] rounded-none animate-audio-bar-2"></span>
                <span className="w-[3px] h-2 bg-[#D4AF37] rounded-none animate-audio-bar-3"></span>
                <span className="w-[3px] h-4 bg-[#D4AF37] rounded-none animate-audio-bar-4"></span>
              </div>
            )}

            <button
              onClick={toggleAudio}
              aria-label={isPlaying ? 'Stop narration' : 'Play narration'}
              className={`w-10 h-10 rounded-none flex items-center justify-center transition-colors ${
                isPlaying
                  ? 'border border-[#D4AF37] bg-transparent text-[#1A1A1A] hover:bg-black/5'
                  : 'bg-[#111111] text-[#F2EDE1] hover:bg-[#222222]'
              }`}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          </div>
        </div>

        <div className="h-px bg-black/10" />

        {/* Curator's note */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-luxury-wide text-[#6D675C] mb-2">
            Curator's Note
          </h4>
          <p className="font-serif text-[14px] leading-relaxed text-[#26221C] text-justify">
            {artwork.description}
          </p>
        </div>

      </div>

      {/* 3. FOOTER */}
      <div className="shrink-0 p-4 bg-[#E9E3D4] border-t border-[#D4AF37]/30">
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#111111] text-[#F2EDE1] text-[10px] font-bold uppercase tracking-luxury-extreme hover:bg-[#D4AF37] hover:text-[#111111] transition-all rounded-none shadow-md"
        >
          Return to Gallery
        </button>
      </div>
    </div>
  );
}
