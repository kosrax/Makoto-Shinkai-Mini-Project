import React from "react";

export default function WireframeFloor({ activeAccent = '#38bdf8'}) {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Lightweight radial-gradient ambient glow (avoids expensive GPU Gaussian blur buffer) */}
            <div
                className="absolute inset-0 opacity-20 transition-all duration-700"
                style={{
                    background: `radial-gradient(ellipse 45% 32% at 50% 50%, ${activeAccent}, transparent 75%)`,
                }}
            />
            <div
            className="absolute inset-x-[-50%] bottom-[-38%] h-[88vh]"
            style={{
                backgroundImage: `
                linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)
                `,
                backgroundSize: '64px 64px',
                transform: 'perspective(850px) rotateX(75deg)',
                maskImage: 'radial-gradient(ellipse at 50% 65%, black 15%, transparent 68%)',
                WebkitMaskImage: 'radial-gradient(ellipse at 50% 65%, black 15%, transparent 68%)',
            }}
            />
        </div>
    );
}