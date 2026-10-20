// src/components/MovieDetailModal.jsx
import React, { useEffect } from 'react';

export default function MovieDetailModal({ movie, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!movie) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-black/80 backdrop-blur-xl animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-[#111113] border border-white/15 shadow-2xl grid grid-cols-1 md:grid-cols-12"
      >
        {/* Left Visual Column */}
        <div className="relative md:col-span-5 h-64 md:h-auto overflow-hidden">
          <img
            src={movie.image}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent to-[#111113]" />
        </div>

        {/* Right Details Column */}
        <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-white/50">
                {movie.japaneseTitle}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mt-2">
              {movie.title}
            </h1>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2.5 mt-4 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white">
                Release: {movie.year}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300">
                Rating: ★ {movie.rating}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/80">
                Runtime: {movie.runtime}
              </span>
            </div>

            {/* Iconic Quote */}
            <blockquote
              className="mt-6 pl-4 border-l-2 italic text-sm text-white/80"
              style={{ borderColor: movie.accentColor }}
            >
              {movie.quote}
            </blockquote>

            {/* Synopsis */}
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Synopsis
              </h3>
              <p className="text-sm leading-relaxed text-white/80">
                {movie.synopsis}
              </p>
            </div>

            {/* Visual & Thematic Notes */}
            <div className="mt-5">
              <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Aesthetic & Motif
              </h3>
              <p className="text-sm leading-relaxed text-white/65">
                {movie.directorNote}
              </p>
            </div>
          </div>

          {/* Core Themes */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
            {movie.themes.map((theme) => (
              <span
                key={theme}
                className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70"
              >
                #{theme}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}