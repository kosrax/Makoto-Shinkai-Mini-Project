import { useEffect, useRef } from 'react';

export function useCarouselPhysics({
    itemCount,
    cardSpacing = 390,
    isPaused = false,
}) {
    const physics = useRef({
        current: 0,
        target: 0,
        velocity: 0,
        smoothVelocity: 0,
        wavePhase: 0,
        time: 0,
        ease: 0.055,
        velocityLerp: 0.09,
        isDragging: false,
        startX: 0,
        lastTarget: 0,
        dragDistance: 0,
        pointerX: 0,
        pointerY: 0,
        smoothPointerX: 0,
        smoothPointerY: 0,
        pointerSpeed: 0,
        reducedMotion: false,
        isMoving: true,
    });

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        physics.current.reducedMotion = mq.matches;
        const handleMotionChange = (e) => {
            physics.current.reducedMotion = e.matches;
        };
        mq.addEventListener('change', handleMotionChange);

        const handleWheel = (e) => {
            if (isPaused) return;
            const delta =
                Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            physics.current.target += delta * 0.95;
            physics.current.isMoving = true;
        };

        const handlePointerDown = (e) => {
            if (isPaused) return;
            physics.current.isDragging = true;
            physics.current.startX = e.clientX;
            physics.current.lastTarget = physics.current.target;
            physics.current.dragDistance = 0;
            physics.current.isMoving = true;
        };

        const handlePointerMove = (e) => {
            const state = physics.current;
            const nx = (e.clientX / window.innerWidth) * 2 - 1;
            const ny = -((e.clientY / window.innerHeight) * 2 - 1);
            const dxPointer = nx - state.pointerX;
            const dyPointer = ny - state.pointerY;
            state.pointerSpeed = Math.min(
                1.5,
                state.pointerSpeed + Math.hypot(dxPointer, dyPointer) * 2.2
            );
            state.pointerX = nx;
            state.pointerY = ny;
            state.isMoving = true;

            if (!state.isDragging || isPaused) return;
            const dx = e.clientX - state.startX;
            state.dragDistance = Math.abs(dx);
            state.target = state.lastTarget - dx * 1.85;
        };

        const handlePointerUp = () => {
            physics.current.isDragging = false;
        };

        window.addEventListener('wheel', handleWheel, { passive: true });
        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        return () => {
            mq.removeEventListener('change', handleMotionChange);
            window.removeEventListener('wheel', handleWheel);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [itemCount, cardSpacing, isPaused]);

    const stepPhysics = (dt = 0.016) => {
        const state = physics.current;
        const prev = state.current;
        const dist = state.target - state.current;

        if (state.reducedMotion) {
            state.current += dist * 0.25;
            state.velocity = 0;
            state.smoothVelocity = 0;
            state.pointerSpeed = 0;
            state.isMoving = Math.abs(dist) > 0.05;
            return state;
        }

        // Silky low-friction lerp toward target
        if (Math.abs(dist) > 0.01) {
            state.current += dist * state.ease;
        } else {
            state.current = state.target;
        }

        // Instantaneous delta -> damped fluid velocity
        const rawVel = (state.current - prev) / Math.max(dt * 60, 0.5);
        state.velocity += (rawVel - state.velocity) * 0.14;
        state.smoothVelocity +=
            (state.velocity - state.smoothVelocity) * state.velocityLerp;

        if (Math.abs(state.smoothVelocity) < 0.005) {
            state.smoothVelocity = 0;
            state.velocity = 0;
        }

        // Smooth pointer wake decay
        state.smoothPointerX += (state.pointerX - state.smoothPointerX) * 0.08;
        state.smoothPointerY += (state.pointerY - state.smoothPointerY) * 0.08;
        state.pointerSpeed *= 0.9;
        if (state.pointerSpeed < 0.005) state.pointerSpeed = 0;

        // Only advance wave & time while actively scrolling or moving pointer (saves idle CPU/GPU)
        const active =
            Math.abs(dist) > 0.04 ||
            Math.abs(state.smoothVelocity) > 0.01 ||
            state.pointerSpeed > 0.01 ||
            state.isDragging;

        if (active) {
            state.time += dt;
            state.wavePhase += dt * 1.4 + state.smoothVelocity * 0.018;
        }

        state.isMoving = active;
        return state;
    };

    const isCleanClick = () => physics.current.dragDistance < 6;

    return { physics, stepPhysics, isCleanClick };
}
