import React, { useState } from "react";
import BilingualWordSwap from "./BilingualWordSwap";

export default function CornerHud({
    featuredCount,
    totalCount,
    viewMode,
    onChangeViewMode,
}) {
    const [topLeftHover, setTopLeftHover] = useState(false);
    const [bottomLeftHover, setBottomLeftHover] = useState(false);

    return (
        <header className="pointer-events-none fixed inset-0 z-30 p-6 md:p-10 flex flex-col justify-between text-xs uppercase tracking-[0.2em] text-white/75">
            {/* Top Corners */}
            <div className="flex items-start justify-between">
                <div
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setTopLeftHover(true)}
                    onMouseLeave={() => setTopLeftHover(false)}
                >
                    <p className="text-white font-medium">
                        <BilingualWordSwap
                            fromWords={['Makoto ', 'Shinkai ', '- ', 'Archive']}
                            toWords={['新海 ', '誠 ', '— ', 'アーカイブ']}
                            externalHover={topLeftHover}
                            stepMs={110}
                        />
                    </p>
                    <p className="text-[11px] text-white/65 mt-1">
                        <BilingualWordSwap
                            fromWords={['Distance, ', 'Twilight ', '& ', 'Sky']}
                            toWords={['距離、 ', '黄昏、 ', 'そして ', '空']}
                            externalHover={topLeftHover}
                            stepMs={125}
                        />
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-white/90">
                        {viewMode === 'featured'
                            ? `Featured Works (${featuredCount})`
                            : `Full Filmography (${totalCount})`}
                    </p>
                    <p className="text-[11px] text-white/65 mt-1">1999 – 2022</p>
                </div>
            </div>

            {/* Bottom Bar: Left Instructions, Center View Switcher, Right Label */}
            <div className="flex items-end justify-between">
                <div
                    className="pointer-events-auto hidden sm:block cursor-pointer"
                    onMouseEnter={() => setBottomLeftHover(true)}
                    onMouseLeave={() => setBottomLeftHover(false)}
                >
                    <p className="text-white/65">
                        <BilingualWordSwap
                            fromWords={['Inter', 'action']}
                            toWords={['操作', '方法']}
                            externalHover={bottomLeftHover}
                            stepMs={110}
                        />
                    </p>
                    <p className="text-white/90 mt-0.5">
                        {viewMode === 'featured' ? (
                            <BilingualWordSwap
                                key="featured-hint"
                                fromWords={['Scroll ', '/ ', 'Drag ', 'to ', 'Orbit ', '· ', 'Click ', 'Card']}
                                toWords={['スクロール ', '/ ', 'ドラッグ', 'で', '回転 ', '· ', 'クリックで', '詳細']}
                                externalHover={bottomLeftHover}
                                stepMs={95}
                            />
                        ) : (
                            <BilingualWordSwap
                                key="index-hint"
                                fromWords={['Hover ', 'Row ', 'to ', 'Preview ', '· ', 'Click ', 'for ', 'Details']}
                                toWords={['行を', 'ホバー', 'で', 'プレビュー ', '· ', 'クリック', 'で', '詳細表示']}
                                externalHover={bottomLeftHover}
                                stepMs={95}
                            />
                        )}
                    </p>
                </div>

                {/* Jesper Landberg-style "Featured / Full" Switcher with tactile hover feedback & >=32px tap height */}
                <div className="pointer-events-auto mx-auto sm:mx-0 flex items-center gap-1.5 p-1 rounded-full bg-white/[0.07] border border-white/20 backdrop-blur-xl">
                    <button
                        type="button"
                        onClick={() => onChangeViewMode('featured')}
                        className={`min-h-[32px] px-4 py-1.5 rounded-full text-[11px] tracking-widest transition-all duration-200 cursor-pointer ${
                            viewMode === 'featured'
                                ? 'bg-white text-black font-semibold hover:bg-sky-100 hover:scale-[1.04] hover:shadow-[0_0_18px_rgba(189,224,254,0.45)]'
                                : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-[1.04]'
                        }`}
                    >
                        Featured ({featuredCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeViewMode('index')}
                        className={`min-h-[32px] px-4 py-1.5 rounded-full text-[11px] tracking-widest transition-all duration-200 cursor-pointer ${
                            viewMode === 'index'
                                ? 'bg-white text-black font-semibold hover:bg-sky-100 hover:scale-[1.04] hover:shadow-[0_0_18px_rgba(189,224,254,0.45)]'
                                : 'text-white/80 hover:text-white hover:bg-white/15 hover:scale-[1.04]'
                        }`}
                    >
                        Full Index ({totalCount})
                    </button>
                </div>

                <div className="hidden sm:block text-right">
                    <p className="text-white/65">Presentation</p>
                    <p className="text-white/90 mt-0.5">
                        {viewMode === 'featured' ? '3D Curved Band' : 'Chronological Index'}
                    </p>
                </div>
            </div>
        </header>
    );
}
