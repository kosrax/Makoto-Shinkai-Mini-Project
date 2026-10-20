import React, { useState, useMemo } from "react";
import { SHINKAI_MOVIES } from './data/shinkaiMovies';
import CornerHud from './components/CornerHud';
import WireframeFloor from './components/WireFrameFloor';
import CurvedCarousel from './components/CurvedCarousel';
import FullIndexView from './components/FullIndexView';
import MovieDetailModal from './components/MovieDetailModal';

export default function App() {
    const [viewMode, setViewMode] = useState('featured');
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [activeAccent, setActiveAccent] = useState(SHINKAI_MOVIES[0].accentColor);

    const featuredMovies = useMemo(
        () => SHINKAI_MOVIES.filter((movie) => movie.featured),
        []
    );

    return (
        <>
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:text-black focus:text-xs focus:font-mono focus:uppercase focus:tracking-widest focus:shadow-lg"
            >
                Skip to content
            </a>
            <main
                id="main-content"
                className={`relative w-screen h-screen overflow-hidden bg-[#08080a] text-white select-none ${
                    viewMode === 'featured' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                }`}
            >
                <WireframeFloor activeAccent={activeAccent} />

                <CornerHud
                    featuredCount={featuredMovies.length}
                    totalCount={SHINKAI_MOVIES.length}
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                />

                {viewMode === 'featured' ? (
                    <CurvedCarousel
                        movies={featuredMovies}
                        onSelectMovie={setSelectedMovie}
                        onHoverMovie={setActiveAccent}
                        isModalOpen={Boolean(selectedMovie)}
                    />
                ) : (
                    <FullIndexView
                        movies={SHINKAI_MOVIES}
                        onSelectMovie={setSelectedMovie}
                        onHoverMovie={setActiveAccent}
                    />
                )}

                <MovieDetailModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            </main>
        </>
    );
}
