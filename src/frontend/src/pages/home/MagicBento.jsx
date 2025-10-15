import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { gsap } from 'gsap';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const MagicBento = ({
    children,
    textAutoHide = false,
    enableStars = true,
    enableSpotlight = true,
    enableBorderGlow = true,
    enableTilt = true,
    enableMagnetism = true,
    clickEffect = true,
    spotlightRadius = 250,
    particleCount = 10,
    glowColor = '132, 0, 255',
    className = '',
}) => {
    const containerRef = useRef(null);
    const rippleRef = useRef(null);
    const hoverOverlayRef = useRef(null);
    const isHoveredRef = useRef(false);
    const memoizedParticles = useRef([]);
    const particlesInitialized = useRef(false);
    const particlesRef = useRef([]);
    const timeoutsRef = useRef([]);

    const stars = useMemo(() => {
        if (!enableStars) return [];
        return Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            top: Math.random() * 100,
            size: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.25,
            delay: Math.random() * 4,
            duration: 4 + Math.random() * 4,
        }));
    }, [enableStars, particleCount]);

    const createParticleElement = useCallback((x, y) => {
        const el = document.createElement('div');
        el.className = 'mb-particle';
        el.style.cssText = `
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(${glowColor}, 1);
      box-shadow: 0 0 6px rgba(${glowColor}, 0.6);
      pointer-events: none;
      z-index: 30;
      left: ${x}px;
      top: ${y}px;
    `;
        return el;
    }, [glowColor]);

    const initializeParticles = useCallback(() => {
        if (particlesInitialized.current || !containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        memoizedParticles.current = Array.from({ length: particleCount }, () =>
            createParticleElement(Math.random() * width, Math.random() * height)
        );
        particlesInitialized.current = true;
    }, [particleCount, createParticleElement]);

    const clearAllParticles = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        particlesRef.current.forEach((particle) => {
            gsap.to(particle, {
                scale: 0,
                opacity: 0,
                duration: 0.3,
                ease: 'back.in(1.7)',
                onComplete: () => {
                    particle.parentNode && particle.parentNode.removeChild(particle);
                },
            });
        });
        particlesRef.current = [];
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleMove = (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const px = x / rect.width;
            const py = y / rect.height;

            if (enableSpotlight) {
                // adapt opacity by distance to center
                const cx = rect.width / 2;
                const cy = rect.height / 2;
                const dist = Math.hypot(x - cx, y - cy);
                const maxDist = Math.hypot(cx, cy);
                const intensity = Math.max(0.1, 1 - dist / maxDist); // 0.1 - 1
                const targetOpacity = Math.min(0.35, 0.15 + intensity * 0.2);

                // Smoothly tween spotlight CSS variables (prevents jitter)
                gsap.to(el, {
                    duration: 0.12,
                    ease: 'power2.out',
                    '--spot-x': `${x}px`,
                    '--spot-y': `${y}px`,
                    '--spot-r': `${spotlightRadius}px`,
                    '--spot-op': targetOpacity,
                });
            }

            if (enableTilt) {
                const tiltX = clamp((py - 0.5) * -10, -10, 10);
                const tiltY = clamp((px - 0.5) * 10, -10, 10);
                el.style.transform = `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }

            if (enableMagnetism) {
                const magnets = el.querySelectorAll('[data-magnet]');
                magnets.forEach((m) => {
                    const mRect = m.getBoundingClientRect();
                    const mx = e.clientX - (mRect.left + mRect.width / 2);
                    const my = e.clientY - (mRect.top + mRect.height / 2);
                    const strength = 0.08;
                    const tx = clamp(mx * strength, -14, 14);
                    const ty = clamp(my * strength, -14, 14);
                    m.style.transform = `translate(${tx}px, ${ty}px)`;
                });
            }
        };

        const handleEnter = () => {
            isHoveredRef.current = true;
            // hover lift + scale + purple shadow
            gsap.to(el, {
                y: -6,
                scale: 1.03,
                boxShadow: `0 18px 50px rgba(${glowColor},0.22), 0 0 24px rgba(${glowColor},0.18)`,
                duration: 0.22,
                ease: 'power2.out',
            });
            if (hoverOverlayRef.current) {
                gsap.to(hoverOverlayRef.current, { opacity: 0.18, duration: 0.18, ease: 'power2.out' });
            }
            if (enableStars) {
                if (!particlesInitialized.current) initializeParticles();
                memoizedParticles.current.forEach((particle, index) => {
                    const timeoutId = setTimeout(() => {
                        if (!isHoveredRef.current || !containerRef.current) return;
                        const clone = particle.cloneNode(true);
                        containerRef.current.appendChild(clone);
                        particlesRef.current.push(clone);
                        gsap.fromTo(
                            clone,
                            { scale: 0, opacity: 0 },
                            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
                        );
                        gsap.to(clone, {
                            x: (Math.random() - 0.5) * 100,
                            y: (Math.random() - 0.5) * 100,
                            rotation: Math.random() * 360,
                            duration: 2 + Math.random() * 2,
                            ease: 'none',
                            repeat: -1,
                            yoyo: true,
                        });
                        gsap.to(clone, {
                            opacity: 0.3,
                            duration: 1.5,
                            ease: 'power2.inOut',
                            repeat: -1,
                            yoyo: true,
                        });
                    }, index * 100);
                    timeoutsRef.current.push(timeoutId);
                });
            }
        };

        const handleLeave = () => {
            isHoveredRef.current = false;
            if (enableTilt) {
                el.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg)';
            }
            if (enableMagnetism) {
                const magnets = el.querySelectorAll('[data-magnet]');
                magnets.forEach((m) => {
                    m.style.transform = 'translate(0px, 0px)';
                });
            }
            gsap.to(el, { y: 0, scale: 1, boxShadow: 'none', duration: 0.22, ease: 'power2.out' });
            if (hoverOverlayRef.current) {
                gsap.to(hoverOverlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.out' });
            }
            if (enableStars) {
                clearAllParticles();
            }
        };

        const handleClick = (e) => {
            if (!clickEffect) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const maxDistance = Math.max(
                Math.hypot(x, y),
                Math.hypot(x - rect.width, y),
                Math.hypot(x, y - rect.height),
                Math.hypot(x - rect.width, y - rect.height)
            );
            const ripple = document.createElement('span');
            ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 40;
        background: radial-gradient(circle, rgba(${glowColor},0.35) 0%, rgba(${glowColor},0.18) 30%, rgba(${glowColor},0) 70%);
        opacity: 0.85;
        transform: scale(0.6);
      `;
            el.appendChild(ripple);
            gsap.to(ripple, {
                scale: 1,
                opacity: 0,
                duration: 0.75,
                ease: 'power2.out',
                onComplete: () => ripple.remove(),
            });
        };

        el.addEventListener('mouseenter', handleEnter);
        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);
        el.addEventListener('click', handleClick);
        return () => {
            isHoveredRef.current = false;
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);
            el.removeEventListener('mouseenter', handleEnter);
            el.removeEventListener('click', handleClick);
            clearAllParticles();
        };
    }, [enableSpotlight, spotlightRadius, enableTilt, enableMagnetism, clickEffect, enableStars, initializeParticles, clearAllParticles]);

    return (
        <div
            ref={containerRef}
            className={`magic-bento-container relative overflow-hidden rounded-2xl ${className}`}
            style={{
                '--glow': `rgba(${glowColor}, 0.5)`,
                '--spot-x': '0px',
                '--spot-y': '0px',
                '--spot-r': `${spotlightRadius}px`,
            }}
        >
            {/* Stars Layer - Z-index lowest */}
            {enableStars && (
                <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-2xl">
                    {stars.map((s) => (
                        <span
                            key={s.id}
                            className="magic-bento-star absolute rounded-full"
                            style={{
                                left: `${s.left}%`,
                                top: `${s.top}%`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                background: `rgba(255,255,255,${s.opacity})`,
                                boxShadow: '0 0 8px rgba(255,255,255,0.6)',
                                animation: `magic-bento-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Spotlight Layer - Above stars */}
            {enableSpotlight && (
                <div
                    className="pointer-events-none absolute inset-0 z-[2] rounded-2xl"
                    style={{
                        background: `radial-gradient(circle var(--spot-r) at var(--spot-x) var(--spot-y), rgba(${glowColor}, var(--spot-op, 0.22)), transparent 70%)`,
                        mixBlendMode: 'screen',
                        transition: 'opacity 0.15s ease-out, background 0.1s ease-out',
                    }}
                />
            )}

            {/* Content Layer */}
            <div
                className={`relative z-[3] ${enableBorderGlow ? 'rounded-2xl card--border-glow' : ''}`}
                style={
                    enableBorderGlow
                        ? {
                            boxShadow:
                                '0 0 0 1px rgba(255,255,255,0.08), 0 0 24px var(--glow), inset 0 0 24px rgba(255,255,255,0.04)',
                        }
                        : undefined
                }
            >
                <div className={textAutoHide ? 'transition-opacity duration-150 hover:opacity-80' : ''}>
                    {children}
                </div>
                {/* purple overlay on hover */}
                <span
                    ref={hoverOverlayRef}
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                        background: `radial-gradient(800px 300px at 70% -80px, rgba(${glowColor}, 0.15), transparent 65%)`,
                        opacity: 0,
                        transition: 'opacity 0.15s ease-out',
                    }}
                />
            </div>

            {/* Ripple Effect Layer - Highest */}
            {/* Note: ripple dibuat dinamis dan dihapus setelah animasi pada handleClick */}

            <style>{`
        @keyframes magic-bento-twinkle {
          0% { 
            transform: scale(1); 
            opacity: 0.4; 
          }
          100% { 
            transform: scale(1.6); 
            opacity: 0.9; 
          }
        }
        .magic-bento-ripple-active {
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(2.2) !important;
          transition: opacity 0.6s ease-out, transform 0.6s ease-out !important;
        }
        .magic-bento-ripple {
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .magic-bento-container {
          transition: transform 0.2s ease-out;
        }
      `}</style>
        </div>
    );
};

export default MagicBento;


