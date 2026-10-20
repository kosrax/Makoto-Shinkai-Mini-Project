import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCarouselPhysics } from '../hooks/useCarouselPhysics';
import BilingualWordSwap from './BilingualWordSwap';

const VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aUv;

uniform mat4 uProjection;
uniform float uOffsetXPx;
uniform float uCardWidthPx;
uniform float uCardHeightPx;
uniform float uViewportWidth;
uniform float uPxToWorld;
uniform float uVelocity;
uniform float uTime;
uniform vec2 uPointer;
uniform float uHoverAmount;

varying vec2 vUv;
varying float vNormX;
varying float vVisibility;
varying float vVelocity;
varying float vHover;

void main() {
    vUv = aUv;
    vHover = uHoverAmount;

    float vel = clamp(uVelocity, -36.0, 36.0);
    vVelocity = vel;

    // Exact continuous world-space X across the entire unbroken film strip
    // Since uCardWidthPx == cardSpacing, the right edge of frame i and left edge of frame i+1
    // share the exact same worldXPx, welding all frames into 1 unified ribbon.
    float halfSpan = uViewportWidth * 0.52;
    float worldXPx = uOffsetXPx + aPosition.x * uCardWidthPx;
    float normX = worldXPx / halfSpan;
    vNormX = normX;

    // Slow ambient breathing phase (independent of scroll velocity so it never wobbles)
    float ambientPhase = uTime * 0.28;

    // 1. Squiggly 3D Serpentine Film-Roll Spine (Y and Z curve through space)
    float spineY = sin(normX * 2.45 + ambientPhase) * 66.0
                 - normX * 20.0;

    // Analytic tangent slope dY/dX so the film strip perpendicular stays true along the S-curve
    float dYdX = (2.45 * 66.0 * cos(normX * 2.45 + ambientPhase) - 20.0) / halfSpan;
    float slopeAngle = atan(dYdX);

    // 2. Winding 3D Depth Curve + Smooth Velocity Flex
    float spineZ = -pow(abs(normX), 1.75) * 300.0
                 + cos(normX * 2.25 + ambientPhase) * 58.0
                 - pow(abs(normX), 1.4) * abs(vel) * 0.85;

    // Local vertical offset perpendicular to the squiggly spine
    float archPinchY = 1.0 - pow(abs(normX), 2.1) * 0.05;
    float localY = aPosition.y * uCardHeightPx * archPinchY;

    // Rotate vertical strip offset by the spine tangent so the ribbon thickness stays uniform
    float curvedXPx = worldXPx - localY * sin(slopeAngle) * 0.35;
    float curvedYPx = spineY + localY * cos(slopeAngle);

    // Gentle pointer hover cushion & twist
    float pointerDist = length(vec2(normX - uPointer.x * 0.95, (curvedYPx / 240.0) - uPointer.y * 0.85));
    float pointerWakeZ = exp(-pointerDist * pointerDist * 4.5) * 14.0;
    float hoverLiftZ = uHoverAmount * 12.0 * (1.0 - min(1.0, abs(normX) * 0.8));

    // Subtle film-ribbon bank/twist along the S-curve
    float ribbonTwistZ = aPosition.y * sin(normX * 2.45 + ambientPhase) * 26.0;

    // Horizontal foreshortening along the 3D curve
    curvedXPx *= (1.0 - pow(abs(normX), 2.2) * 0.04);

    vec3 worldPos = vec3(
        curvedXPx * uPxToWorld,
        curvedYPx * uPxToWorld,
        (spineZ + ribbonTwistZ + pointerWakeZ + hoverLiftZ) * uPxToWorld
    );

    vVisibility = clamp(1.0 - pow(abs(normX) * 0.66, 2.2), 0.12, 1.0);

    gl_Position = uProjection * vec4(worldPos, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;
varying float vNormX;
varying float vVisibility;
varying float vVelocity;
varying float vHover;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uWavePhase;
uniform vec2 uCardSize;

float roundedBoxSDF(vec2 centerPos, vec2 size, float radius) {
    return length(max(abs(centerPos) - size + radius, 0.0)) - radius;
}

void main() {
    // Film roll dimensions in UV / pixel space
    float railHeight = 0.095; // Top and bottom 35mm film sprocket rails
    bool inTopRail = vUv.y < railHeight;
    bool inBottomRail = vUv.y > (1.0 - railHeight);

    // 1. Top & Bottom Film Sprocket Rails (continuous across all panels)
    if (inTopRail || inBottomRail) {
        // Sprocket holes: 10 perforations per frame width
        float sprocketsPerFrame = 10.0;
        float cellX = fract(vUv.x * sprocketsPerFrame) - 0.5;
        float railCenterY = inTopRail ? (railHeight * 0.5) : (1.0 - railHeight * 0.5);
        float cellY = (vUv.y - railCenterY) / railHeight;

        // Sprocket hole SDF
        vec2 holePos = vec2(cellX * (uCardSize.x / sprocketsPerFrame), cellY * (uCardSize.y * railHeight));
        float holeDist = roundedBoxSDF(holePos, vec2(7.5, 4.8), 2.2);

        // Punch transparent/dark perforation inside each sprocket hole
        float holeMask = smoothstep(-0.8, 0.8, holeDist);
        if (holeMask < 0.05) discard;

        // Celluloid film base color + subtle specular sheen
        vec3 filmStock = vec3(0.045, 0.048, 0.06);
        float sheen = exp(-pow((vNormX + (vUv.x - 0.5) * 0.4) * 2.0, 2.0)) * 0.06;
        filmStock += sheen;

        // Outer and inner railguide hairlines
        float outerEdge = inTopRail ? vUv.y : (1.0 - vUv.y);
        float innerEdge = inTopRail ? (railHeight - vUv.y) : (vUv.y - (1.0 - railHeight));
        float lineGlow = (1.0 - smoothstep(0.0, 0.005, outerEdge)) * 0.28
                       + (1.0 - smoothstep(0.0, 0.004, innerEdge)) * 0.18;

        // Subtle rim around sprocket holes
        float holeRim = (1.0 - smoothstep(0.0, 1.4, abs(holeDist))) * 0.22;
        filmStock += vec3(lineGlow + holeRim);

        gl_FragColor = vec4(filmStock * vVisibility, 0.94 * holeMask * vVisibility);
        return;
    }

    // 2. Inner Film Frame Window & Celluloid Frame Divider
    vec2 windowUv = vec2(
        vUv.x,
        (vUv.y - railHeight) / (1.0 - 2.0 * railHeight)
    );

    vec2 windowSizePx = vec2(uCardSize.x - 10.0, uCardSize.y * (1.0 - 2.0 * railHeight) - 4.0);
    vec2 pixelPos = (vec2(vUv.x, windowUv.y) - 0.5) * vec2(uCardSize.x, uCardSize.y * (1.0 - 2.0 * railHeight));
    float frameDist = roundedBoxSDF(pixelPos, windowSizePx * 0.5, 6.0);

    // Dark celluloid pillar between adjacent film frames
    if (frameDist > 0.0) {
        vec3 pillarColor = vec3(0.045, 0.048, 0.06);
        float borderRim = (1.0 - smoothstep(0.0, 1.5, frameDist)) * 0.22;
        pillarColor += borderRim;
        gl_FragColor = vec4(pillarColor * vVisibility, 0.94 * vVisibility);
        return;
    }

    // 3. Movie Image inside the Exposure Window with Fluid Laminar Glide
    float zoom = 1.16 - vHover * 0.035;
    float parallaxX = clamp(vNormX * 0.10, -0.13, 0.13);

    // Smooth water-like UV laminar flow during scroll
    float speed = clamp(abs(vVelocity) / 30.0, 0.0, 1.0);
    float flowX = sin(windowUv.y * 3.14159) * (vVelocity * 0.00075);
    float flowY = sin(windowUv.x * 3.14159 + uWavePhase * 0.45) * (0.003 * speed);

    vec2 baseUv = (windowUv - 0.5) / zoom + 0.5;
    baseUv.x += parallaxX;
    vec2 fluidUv = clamp(baseUv + vec2(flowX, flowY), 0.002, 0.998);

    // Subtle chromatic dispersion at high scroll speeds
    float chroma = vVelocity * 0.0002;
    float r = texture2D(uTexture, clamp(fluidUv + vec2(chroma, 0.0), 0.002, 0.998)).r;
    float g = texture2D(uTexture, fluidUv).g;
    float b = texture2D(uTexture, clamp(fluidUv - vec2(chroma, 0.0), 0.002, 0.998)).b;
    vec3 color = vec3(r, g, b);

    // Subtle bottom vignette so pure film frames stay luminous
    float bottomGrad = smoothstep(0.0, 0.35, windowUv.y);
    color *= mix(0.68, 1.0, bottomGrad);

    // Specular reflection across the curved celluloid surface
    float sheen = exp(-pow((vNormX + (vUv.x - 0.5) * 0.35) * 2.1, 2.0)) * 0.075;
    color += sheen;

    // Inner frame border highlight on hover
    float innerBorder = 1.0 - smoothstep(0.0, 1.5, abs(frameDist + 0.75));
    vec3 borderCol = mix(vec3(1.0) * 0.12, vec3(1.0) * 0.55, vHover);
    color = mix(color, borderCol, innerBorder * 0.65);

    gl_FragColor = vec4(color * vVisibility, vVisibility);
}
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vsSource, fsSource) {
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    // Free individual shader objects immediately after linking
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function createSubdividedPlane(gl, segX = 24, segY = 14) {
    const positions = [];
    const uvs = [];
    const indices = [];

    for (let y = 0; y <= segY; y++) {
        const v = y / segY;
        const py = v - 0.5;
        for (let x = 0; x <= segX; x++) {
            const u = x / segX;
            const px = u - 0.5;
            positions.push(px, py);
            uvs.push(u, 1.0 - v);
        }
    }

    const row = segX + 1;
    for (let y = 0; y < segY; y++) {
        for (let x = 0; x < segX; x++) {
            const i0 = y * row + x;
            const i1 = i0 + 1;
            const i2 = i0 + row;
            const i3 = i2 + 1;
            indices.push(i0, i2, i1, i1, i2, i3);
        }
    }

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return { posBuffer, uvBuffer, indexBuffer, indexCount: indices.length };
}

function makePerspectiveMatrix(fovRad, aspect, near, far, camZ) {
    const f = 1.0 / Math.tan(fovRad / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (far + near) * nf, -1,
        0, 0, (-camZ * (far + near) + 2 * far * near) * nf, camZ,
    ]);
}

function formatTimecode(scrollPx) {
    const totalFrames = Math.abs(Math.floor(scrollPx * 0.35));
    const frames = totalFrames % 24;
    const totalSeconds = Math.floor(totalFrames / 24);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = (Math.floor(totalSeconds / 3600) % 9) + 1;
    const pad = (n) => String(n).padStart(2, '0');
    const feet = (Math.abs(scrollPx) * 0.022).toFixed(1).padStart(5, '0');
    return `TC ${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}  //  ${feet} FT`;
}

export default function CurvedCarousel({
    movies,
    onSelectMovie,
    onHoverMovie,
    isModalOpen,
}) {
    const canvasRef = useRef(null);
    const hitRefs = useRef([]);
    const backdropTitleRef = useRef(null);
    const timecodeRef = useRef(null);
    const velocityBarRef = useRef(null);
    const isModalOpenRef = useRef(isModalOpen);
    isModalOpenRef.current = isModalOpen;

    // Repeat items so the squiggly film roll spans endlessly across any screen width
    const ribbonItems = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        const repeats = Math.max(2, Math.ceil(12 / movies.length));
        const list = [];
        for (let r = 0; r < repeats; r++) {
            movies.forEach((m, i) => {
                list.push({ ...m, ribbonKey: `${m.id}-${r}-${i}`, baseIndex: i });
            });
        }
        return list;
    }, [movies]);

    // Zero gap between adjacent meshes (CARD_WIDTH_PX === CARD_SPACING_PX)
    // so vertices weld together into a single unbroken squiggly film roll!
    const CARD_WIDTH_PX = 384;
    const CARD_HEIGHT_PX = 264;
    const CARD_SPACING_PX = 384;

    const { stepPhysics, isCleanClick } = useCarouselPhysics({
        itemCount: ribbonItems.length,
        cardSpacing: CARD_SPACING_PX,
        isPaused: isModalOpen,
    });

    const [activeMovie, setActiveMovie] = useState(() => ({
        ...movies[0],
        baseIndex: 0,
    }));
    const [titleHover, setTitleHover] = useState(false);
    const hoveredSlotRef = useRef(-1);
    const hoverAmountsRef = useRef([]);
    const activeIdRef = useRef(movies[0]?.id);
    const needsRedrawRef = useRef(true);

    // Extract pure Japanese kanji portion (before parenthetical romaji)
    const kanjiOnly = useMemo(() => {
        if (!activeMovie?.japaneseTitle) return '';
        return activeMovie.japaneseTitle.split('(')[0].trim();
    }, [activeMovie]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || ribbonItems.length === 0) return;

        // Disable hardware depth & stencil buffers (we sort back-to-front in JS) to save VRAM
        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'default',
        });
        if (!gl) return;

        const program = createProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
        if (!program) return;

        // 24x14 mesh gives smooth curvature with 75% fewer vertices than 48x28
        const mesh = createSubdividedPlane(gl, 24, 14);

        const aPosition = gl.getAttribLocation(program, 'aPosition');
        const aUv = gl.getAttribLocation(program, 'aUv');

        const uniforms = {
            uProjection: gl.getUniformLocation(program, 'uProjection'),
            uOffsetXPx: gl.getUniformLocation(program, 'uOffsetXPx'),
            uCardWidthPx: gl.getUniformLocation(program, 'uCardWidthPx'),
            uCardHeightPx: gl.getUniformLocation(program, 'uCardHeightPx'),
            uViewportWidth: gl.getUniformLocation(program, 'uViewportWidth'),
            uPxToWorld: gl.getUniformLocation(program, 'uPxToWorld'),
            uVelocity: gl.getUniformLocation(program, 'uVelocity'),
            uTime: gl.getUniformLocation(program, 'uTime'),
            uWavePhase: gl.getUniformLocation(program, 'uWavePhase'),
            uPointer: gl.getUniformLocation(program, 'uPointer'),
            uHoverAmount: gl.getUniformLocation(program, 'uHoverAmount'),
            uTexture: gl.getUniformLocation(program, 'uTexture'),
            uCardSize: gl.getUniformLocation(program, 'uCardSize'),
        };

        let isDisposed = false;
        const textureMap = new Map();
        movies.forEach((movie) => {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                1,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                new Uint8Array([18, 20, 26, 255])
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.decoding = 'async';
            img.onload = () => {
                if (isDisposed) return;
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    img
                );
                // Release CPU-side image reference once uploaded to GPU texture
                img.onload = null;
                needsRedrawRef.current = true;
            };
            img.src = movie.image;
            textureMap.set(movie.id, tex);
        });

        hoverAmountsRef.current = ribbonItems.map(() => 0);

        let width = window.innerWidth;
        let height = window.innerHeight;
        const fovRad = (38 * Math.PI) / 180;
        const camZ = 9.0;
        let projMatrix = makePerspectiveMatrix(fovRad, width / height, 0.1, 100.0, camZ);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            // Cap DPR at 1.25 to cut high-DPI framebuffer VRAM usage by >60%
            const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            gl.viewport(0, 0, canvas.width, canvas.height);
            projMatrix = makePerspectiveMatrix(fovRad, width / height, 0.1, 100.0, camZ);
            needsRedrawRef.current = true;
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Pre-bind static geometry once outside the frame loop
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.posBuffer);
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvBuffer);
        gl.enableVertexAttribArray(aUv);
        gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.uniform1f(uniforms.uCardWidthPx, CARD_WIDTH_PX);
        gl.uniform1f(uniforms.uCardHeightPx, CARD_HEIGHT_PX);
        gl.uniform2f(uniforms.uCardSize, CARD_WIDTH_PX, CARD_HEIGHT_PX);
        gl.uniform1i(uniforms.uTexture, 0);

        // Pre-allocate drawOrder slots once to eliminate per-frame garbage collection
        const drawOrder = ribbonItems.map((_, i) => ({
            index: i,
            wrappedX: 0,
            absX: 0,
        }));

        const totalWidth = ribbonItems.length * CARD_SPACING_PX;
        let lastTime = performance.now();
        let lastTimecodeStr = '';
        let rafId;

        const render = (now) => {
            rafId = requestAnimationFrame(render);

            // Pause GPU & DOM work when modal is open or browser tab is hidden
            if (isModalOpenRef.current || document.hidden) {
                lastTime = now;
                return;
            }

            const dt = Math.min(0.05, (now - lastTime) / 1000);
            lastTime = now;

            const state = stepPhysics(dt);

            // Check if any card hover animation is still settling
            let hoverAnimating = false;
            for (let i = 0; i < ribbonItems.length; i++) {
                const targetHover = hoveredSlotRef.current === i ? 1.0 : 0.0;
                const diff = targetHover - hoverAmountsRef.current[i];
                if (Math.abs(diff) > 0.005) {
                    hoverAmountsRef.current[i] += diff * 0.14;
                    hoverAnimating = true;
                } else {
                    hoverAmountsRef.current[i] = targetHover;
                }
            }

            // Skip GPU draw & DOM layout writes when completely idle at rest
            if (!state.isMoving && !hoverAnimating && !needsRedrawRef.current) {
                return;
            }
            needsRedrawRef.current = false;

            const halfWorldHeight = Math.tan(fovRad / 2) * camZ;
            const pxToWorld = (2 * halfWorldHeight) / height;

            // Only touch DOM textContent when the formatted timecode string actually changes
            if (timecodeRef.current) {
                const nextTc = formatTimecode(state.current);
                if (nextTc !== lastTimecodeStr) {
                    lastTimecodeStr = nextTc;
                    timecodeRef.current.textContent = nextTc;
                }
            }
            if (backdropTitleRef.current) {
                const driftX = ((state.current * 0.12) % 160) - 80;
                const skew = Math.max(-6, Math.min(6, state.smoothVelocity * -0.18));
                backdropTitleRef.current.style.transform = `translate3d(${-driftX}px, 0px, 0px) skewX(${skew}deg)`;
            }
            if (velocityBarRef.current) {
                const speedRatio = Math.min(1, Math.abs(state.smoothVelocity) / 28);
                velocityBarRef.current.style.transform = `scaleX(${0.12 + speedRatio * 0.88})`;
            }

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.uniformMatrix4fv(uniforms.uProjection, false, projMatrix);
            gl.uniform1f(uniforms.uViewportWidth, width);
            gl.uniform1f(uniforms.uPxToWorld, pxToWorld);
            gl.uniform1f(uniforms.uVelocity, state.smoothVelocity);
            gl.uniform1f(uniforms.uTime, state.time);
            gl.uniform1f(uniforms.uWavePhase, state.wavePhase);
            gl.uniform2f(uniforms.uPointer, state.smoothPointerX, state.smoothPointerY);

            let closestSlot = 0;
            let minAbsX = Infinity;

            for (let i = 0; i < ribbonItems.length; i++) {
                const baseX = i * CARD_SPACING_PX;
                const rawX = baseX - state.current;
                const wrappedX =
                    (((rawX % totalWidth) + totalWidth) % totalWidth) -
                    totalWidth / 2;

                const absX = Math.abs(wrappedX);
                if (absX < minAbsX) {
                    minAbsX = absX;
                    closestSlot = i;
                }

                const slot = drawOrder[i];
                slot.index = i;
                slot.wrappedX = wrappedX;
                slot.absX = absX;
            }

            const focusSlot =
                hoveredSlotRef.current >= 0 ? hoveredSlotRef.current : closestSlot;
            const focusMovie = ribbonItems[focusSlot];
            if (focusMovie && focusMovie.id !== activeIdRef.current) {
                activeIdRef.current = focusMovie.id;
                setActiveMovie(focusMovie);
                onHoverMovie(focusMovie.accentColor);
            }

            drawOrder.sort((a, b) => b.absX - a.absX);

            const halfSpan = width * 0.52;
            const ambientPhase = state.time * 0.28;
            const vel = Math.max(-36, Math.min(36, state.smoothVelocity));

            for (let d = 0; d < drawOrder.length; d++) {
                const { index, wrappedX } = drawOrder[d];
                const item = ribbonItems[index];

                if (Math.abs(wrappedX) < width * 0.98) {
                    const tex = textureMap.get(item.id);
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, tex);

                    gl.uniform1f(uniforms.uOffsetXPx, wrappedX);
                    gl.uniform1f(uniforms.uHoverAmount, hoverAmountsRef.current[index]);

                    gl.drawElements(
                        gl.TRIANGLES,
                        mesh.indexCount,
                        gl.UNSIGNED_SHORT,
                        0
                    );
                }

                // Sync invisible hit-target & micro optical frame leader along the squiggly spine
                const hitEl = hitRefs.current[index];
                if (hitEl) {
                    const normX = wrappedX / halfSpan;
                    const opacity = Math.max(
                        0,
                        1 - Math.pow(Math.abs(normX) * 0.74, 2.2)
                    );

                    if (opacity <= 0.22) {
                        hitEl.style.opacity = 0;
                        hitEl.style.pointerEvents = 'none';
                    } else {
                        const spineY =
                            Math.sin(normX * 2.45 + ambientPhase) * 66.0 -
                            normX * 20.0;
                        const spineZ =
                            -Math.pow(Math.abs(normX), 1.75) * 300.0 +
                            Math.cos(normX * 2.25 + ambientPhase) * 58.0 -
                            Math.pow(Math.abs(normX), 1.4) * Math.abs(vel) * 0.85;

                        const zWorld = spineZ * pxToWorld;
                        const perspectiveScale = camZ / (camZ - zWorld);
                        const screenX =
                            wrappedX *
                            (1.0 - Math.pow(Math.abs(normX), 2.2) * 0.04) *
                            perspectiveScale;
                        const screenY = -spineY * perspectiveScale;

                        hitEl.style.transform = `translate3d(${screenX}px, ${screenY}px, 0px) scale(${perspectiveScale})`;
                        hitEl.style.opacity = 1;
                        hitEl.style.pointerEvents = 'auto';
                    }
                }
            }
        };

        rafId = requestAnimationFrame(render);

        return () => {
            isDisposed = true;
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
            textureMap.forEach((tex) => gl.deleteTexture(tex));
            gl.deleteBuffer(mesh.posBuffer);
            gl.deleteBuffer(mesh.uvBuffer);
            gl.deleteBuffer(mesh.indexBuffer);
            gl.deleteProgram(program);
        };
    }, [ribbonItems, movies]);

    const handleCardClick = (movie) => {
        if (isCleanClick()) {
            onSelectMovie(movie);
        }
    };

    const activeIdx = activeMovie?.baseIndex ?? 0;

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* LAYER 1 (BEHIND THE 3D FILM ROLL): Monumental Hollow Architectural Backdrop Title */}
            {activeMovie && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none">
                    <div
                        ref={backdropTitleRef}
                        className="whitespace-nowrap text-[13vw] font-semibold uppercase tracking-[-0.04em] leading-none transition-colors duration-500"
                        style={{
                            color: 'transparent',
                            WebkitTextStroke: '1px rgba(255, 255, 255, 0.08)',
                        }}
                    >
                        {activeMovie.title} · {kanjiOnly}
                    </div>
                </div>
            )}

            {/* LAYER 2 (LEFT & RIGHT MARGINS): Vertical Japanese Tategaki (縦書き) Kanji & Film Edge Serials */}
            {activeMovie && (
                <>
                    {/* Left Vertical Film-Stock Technical Edge Code (English -> Japanese per word on hover) */}
                    <div className="pointer-events-auto hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-4 text-[10px] font-mono tracking-[0.35em] text-white/60 hover:text-white transition-colors uppercase cursor-pointer">
                        <span className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                        <span style={{ writingMode: 'vertical-rl' }}>
                            <BilingualWordSwap
                                fromWords={['EASTMAN ', '5219 ', '· ', '35MM ', 'ANAMORPHIC']}
                                toWords={['イーストマン ', '5219 ', '· ', '35ミリ ', 'シネマスコープ']}
                                stepMs={110}
                            />
                        </span>
                        <span
                            className="w-1.5 h-1.5 rounded-full transition-colors duration-500"
                            style={{ backgroundColor: activeMovie.accentColor }}
                        />
                        <span className="w-px h-12 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
                    </div>

                    {/* Right Vertical Japanese Tategaki Poetic Column (Japanese -> English per word on hover) */}
                    <div className="pointer-events-auto hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-4">
                        <div
                            key={activeMovie.id}
                            style={{ writingMode: 'vertical-rl' }}
                            className="text-xl md:text-2xl font-light tracking-[0.35em] text-white/85 hover:text-white transition-colors drop-shadow-[0_0_25px_rgba(255,255,255,0.18)] animate-fadeIn"
                        >
                            <BilingualWordSwap
                                primaryText={kanjiOnly}
                                secondaryText={activeMovie.title}
                                movieId={activeMovie.id}
                                reverse={true}
                                stepMs={125}
                            />
                        </div>
                        {/* Traditional Japanese Hanko-inspired Accent Seal */}
                        <div
                            className="w-6 h-6 rounded-sm border flex items-center justify-center text-[10px] font-serif transition-colors duration-500"
                            style={{
                                borderColor: `${activeMovie.accentColor}aa`,
                                color: activeMovie.accentColor,
                                backgroundColor: `${activeMovie.accentColor}1a`,
                            }}
                        >
                            新海
                        </div>
                    </div>
                </>
            )}

            {/* LAYER 3: Continuous WebGL Squiggly Film-Roll Canvas */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
            />

            {/* LAYER 4: Unobstructed Hit-Targets + Micro Optical Reticle on Hover */}
            <div className="relative w-full h-full flex items-center justify-center z-20 pointer-events-none">
                {ribbonItems.map((movie, index) => (
                    <div
                        key={movie.ribbonKey}
                        ref={(el) => (hitRefs.current[index] = el)}
                        onClick={() => handleCardClick(movie)}
                        onMouseEnter={() => {
                            hoveredSlotRef.current = index;
                            needsRedrawRef.current = true;
                            setActiveMovie(movie);
                            onHoverMovie(movie.accentColor);
                        }}
                        onMouseLeave={() => {
                            if (hoveredSlotRef.current === index) {
                                hoveredSlotRef.current = -1;
                                needsRedrawRef.current = true;
                            }
                        }}
                        style={{
                            width: `${CARD_WIDTH_PX}px`,
                            height: `${CARD_HEIGHT_PX}px`,
                        }}
                        className="group absolute cursor-pointer"
                    >
                        {/* Delicate Optical Leader Callout outside the top sprocket rail (only visible on hover) */}
                        <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-1">
                            <div className="px-2.5 py-0.5 rounded-full bg-black/80 border border-white/20 backdrop-blur-md flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white whitespace-nowrap">
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: movie.accentColor }}
                                />
                                <span>REEL 0{movie.baseIndex + 1}</span>
                                <span className="text-white/60">//</span>
                                <span className="text-white/90">INSPECT ↗</span>
                            </div>
                            <div className="w-px h-3 bg-white/35" />
                        </div>
                    </div>
                ))}
            </div>

            {/* LAYER 5: Architectural 35mm Telecine Viewfinder & Editorial Dock (Bottom Center) */}
            {activeMovie && (
                <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 px-6 md:px-14 flex justify-center">
                    <div className="pointer-events-auto w-full max-w-4xl">
                        {/* Top Hairline Telemetry Bar: Live Timecode + Velocity Meter + Sprocket Scrubber */}
                        <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/15 text-[10px] font-mono uppercase tracking-[0.22em] text-white/65">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: activeMovie.accentColor }}
                                />
                                <span ref={timecodeRef} className="text-white/75 tabular-nums">
                                    TC 01:00:00:00  //  000.0 FT
                                </span>
                            </div>

                            {/* Live Scroll Velocity Optical Waveform Bar */}
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-[9px] text-white/60">FLOW</span>
                                <div className="w-20 h-0.5 bg-white/15 overflow-hidden rounded-full">
                                    <div
                                        ref={velocityBarRef}
                                        className="w-full h-full origin-left transition-colors duration-500"
                                        style={{
                                            backgroundColor: activeMovie.accentColor,
                                            transform: 'scaleX(0.12)',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Interactive 6-Frame Reel Scrubber (min 28x28px touch targets) */}
                            <div className="flex items-center gap-0.5">
                                {movies.map((m, idx) => {
                                    const isCurrent = m.id === activeMovie.id;
                                    return (
                                        <button
                                            key={m.id}
                                            type="button"
                                            aria-label={`Select ${m.title}`}
                                            onClick={() => onSelectMovie(m)}
                                            onMouseEnter={() => {
                                                activeIdRef.current = m.id;
                                                setActiveMovie({ ...m, baseIndex: idx });
                                                onHoverMovie(m.accentColor);
                                                needsRedrawRef.current = true;
                                            }}
                                            className="group min-w-[28px] min-h-[28px] px-1.5 py-2 flex items-center justify-center cursor-pointer"
                                            title={m.title}
                                        >
                                            <span
                                                className={`block h-1.5 rounded-full transition-all duration-300 ${
                                                    isCurrent
                                                        ? 'w-7 group-hover:scale-110'
                                                        : 'w-2 bg-white/35 group-hover:bg-white/80 group-hover:scale-125'
                                                }`}
                                                style={
                                                    isCurrent
                                                        ? { backgroundColor: activeMovie.accentColor }
                                                        : undefined
                                                }
                                            />
                                        </button>
                                    );
                                })}
                                <span className="ml-2 text-white/80">
                                    {String(activeIdx + 1).padStart(2, '0')} / {String(movies.length).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Main Editorial Split Readout */}
                        <div
                            key={activeMovie.id}
                            className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-end animate-fadeIn"
                        >
                            {/* Left: Monumental Editorial Title (English -> Japanese per word) & Sub-header (Japanese -> English per word) */}
                            <div
                                className="md:col-span-6 flex items-baseline gap-4 cursor-pointer"
                                onMouseEnter={() => setTitleHover(true)}
                                onMouseLeave={() => setTitleHover(false)}
                            >
                                <span
                                    className="text-xs font-mono tracking-widest uppercase"
                                    style={{ color: activeMovie.accentColor }}
                                >
                                    №{String(activeIdx + 1).padStart(2, '0')}
                                </span>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/65">
                                        <BilingualWordSwap
                                            primaryText={kanjiOnly}
                                            secondaryText={activeMovie.title}
                                            movieId={activeMovie.id}
                                            reverse={true}
                                            externalHover={titleHover}
                                            stepMs={115}
                                            className="text-white/80"
                                        />
                                        <span>·</span>
                                        <span className="text-white/85">{activeMovie.year}</span>
                                        <span>·</span>
                                        <span>{activeMovie.runtime}</span>
                                        <span>·</span>
                                        <span className="text-amber-300">★ {activeMovie.rating}</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white mt-0.5">
                                        <BilingualWordSwap
                                            primaryText={activeMovie.title}
                                            secondaryText={kanjiOnly}
                                            movieId={activeMovie.id}
                                            reverse={false}
                                            externalHover={titleHover}
                                            stepMs={125}
                                        />
                                    </h1>
                                </div>
                            </div>

                            {/* Right: Poetic Quote (full wrap on mobile, no ellipsis cutoff) + Inspect Frame Trigger */}
                            <div className="md:col-span-6 flex items-end justify-between gap-4 border-l border-white/15 pl-4">
                                <p className="text-xs sm:text-sm text-white/80 italic font-serif leading-snug">
                                    {activeMovie.quote}
                                </p>

                                <button
                                    type="button"
                                    onClick={() => onSelectMovie(activeMovie)}
                                    className="shrink-0 min-h-[34px] group flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white text-white hover:text-black border border-white/20 hover:scale-[1.04] transition-all duration-300 text-[10px] font-mono uppercase tracking-[0.2em] cursor-pointer"
                                >
                                    <span>Dossier</span>
                                    <span className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                                        ↗
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
