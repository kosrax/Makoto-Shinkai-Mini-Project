// src/components/FullIndexView.jsx
import React, { useState } from 'react';

export default function FullIndexView({ movies, onSelectMovie, onHoverMovie }) {
  const [hoveredMovie, setHoveredMovie] = useState(movies[0]);

  const handleRowEnter = (movie) => {
    setHoveredMovie(movie);
    onHoverMovie(movie.accentColor);
  };

  return (
    <section className="relative z-10 w-full h-full pt-28 pb-28 px-6 md:px-16 overflow-y-auto flex items-center animate-fadeIn">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Floating Preview Card (Desktop) */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-neutral-900 border border-white/15 shadow-2xl">
            <img
              key={hoveredMovie.id}
              src={hoveredMovie.image}
              alt={hoveredMovie.title}
              className="w-full h-full object-cover animate-fadeIn"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-xs font-mono text-white/60">{hoveredMovie.japaneseTitle}</p>
              <p className="text-sm text-white/85 italic mt-1 line-clamp-2">
                {hoveredMovie.quote}
              </p>
            </div>
          </div>
        </div>

        {/* Right Chronological Filmography Table */}
        <div className="lg:col-span-7 divide-y divide-white/10 border-y border-white/10">
          {movies.map((movie, idx) => (
            <div
              key={movie.id}
              onMouseEnter={() => handleRowEnter(movie)}
              onClick={() => onSelectMovie(movie)}
              className="group py-4 px-3 flex items-center justify-between gap-4 cursor-pointer transition-colors hover:bg-white/[0.04]"
            >
              <div className="flex items-baseline gap-4">
                <span className="text-xs font-mono text-white/35 w-6">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-base md:text-lg font-medium text-white group-hover:translate-x-1 transition-transform">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-white/45">{movie.japaneseTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-xs font-mono text-white/60">
                <span className="hidden sm:inline">{movie.runtime}</span>
                <span className="text-amber-300/90">★ {movie.rating}</span>
                <span className="text-white/40">{movie.year}</span>
                <span className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/60 group-hover:bg-white group-hover:text-black transition">
                  ↗
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}