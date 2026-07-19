'use client';

import { useEffect, useRef, useState } from 'react';

const BEATS = [
  {
    label: 'Together Forever',
    heading: 'Priya & Rahul',
    sub: 'joyfully invite you to celebrate their wedding',
  },
  {
    label: 'Date & Time',
    heading: 'Saturday, 15 November 2026',
    sub: '7:00 PM onwards',
  },
  {
    label: 'Venue',
    heading: 'The Grand Palace',
    sub: 'Jubilee Hills, Hyderabad',
  },
  {
    label: 'RSVP',
    heading: 'Kindly respond by 1 November 2026',
    sub: 'We look forward to celebrating with you',
    isRsvp: true,
  },
];

const BEAT_VH = 75;
const DETAILS_VH = BEATS.length * BEAT_VH; // 300

type Phase = 'idle' | 'playing' | 'done' | 'reversing';

export default function WeddingInvitationTemp1() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const reverseRafRef = useRef<number | null>(null);
  const lastRafTs = useRef<number | null>(null);
  // True only after the user has scrolled into the details section (guards against
  // the smooth-scroll-to-details triggering reverse immediately after video ends)
  const hasScrolledIntoDetails = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [scrollFrac, setScrollFrac] = useState(0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleClick = () => {
    if (phase !== 'idle') return;
    const video = videoRef.current;
    if (!video) return;
    setPhase('playing');
    video.play();
  };

  const handleVideoEnd = () => {
    hasScrolledIntoDetails.current = false;
    setPhase('done');
    // scrollIntoView fires in useEffect after the section height expands
  };

  // Scroll to details after the DOM has expanded from height:0 → DETAILS_VH
  useEffect(() => {
    if (phase !== 'done') return;
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [phase]);

  // ── Scroll listener (done + reversing) ────────────────────────────────────

  useEffect(() => {
    if (phase !== 'done' && phase !== 'reversing') return;

    const onScroll = () => {
      const scrollY = window.scrollY;

      if (phase === 'done') {
        // Track details scroll fraction
        const container = detailsContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const scrollable = container.offsetHeight - window.innerHeight;
          const frac = Math.min(Math.max(-rect.top / scrollable, 0), 1);
          setScrollFrac(frac);
          // Mark as "in details" once the user has scrolled past the first beat
          if (frac > 0.05) hasScrolledIntoDetails.current = true;
        }
        // Trigger reverse only after user has scrolled into details, then back up
        if (scrollY < window.innerHeight && hasScrolledIntoDetails.current) {
          hasScrolledIntoDetails.current = false;
          setPhase('reversing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }

      if (phase === 'reversing') {
        // User scrolled back down → cancel reverse, return to done
        if (scrollY > window.innerHeight * 0.3) {
          hasScrolledIntoDetails.current = false;
          setPhase('done');
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [phase]);

  // ── Reverse rAF loop ───────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'reversing') {
      if (reverseRafRef.current !== null) {
        cancelAnimationFrame(reverseRafRef.current);
        reverseRafRef.current = null;
      }
      lastRafTs.current = null;
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    const SPEED = 1.5; // 1.5× faster than real-time for snappiness

    const tick = (timestamp: number) => {
      if (lastRafTs.current === null) lastRafTs.current = timestamp;
      const dt = (timestamp - lastRafTs.current) / 1000;
      lastRafTs.current = timestamp;

      const next = Math.max(video.currentTime - dt * SPEED, 0);
      video.currentTime = next;

      if (next <= 0) {
        setPhase('idle');
        return;
      }

      reverseRafRef.current = requestAnimationFrame(tick);
    };

    reverseRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (reverseRafRef.current !== null) {
        cancelAnimationFrame(reverseRafRef.current);
        reverseRafRef.current = null;
      }
      lastRafTs.current = null;
    };
  }, [phase]);

  // ── Beat opacity / translate ───────────────────────────────────────────────

  const beatOpacities = BEATS.map((_, i) => {
    const start = i / BEATS.length;
    const end = (i + 1) / BEATS.length;
    const fadeInEnd = start + (end - start) * 0.3;
    const fadeOutStart = end - (end - start) * 0.25;

    if (scrollFrac < start) return 0;
    if (scrollFrac < fadeInEnd) return (scrollFrac - start) / (fadeInEnd - start);
    if (i === BEATS.length - 1) return 1;
    if (scrollFrac < fadeOutStart) return 1;
    if (scrollFrac < end) return 1 - (scrollFrac - fadeOutStart) / (end - fadeOutStart);
    return 0;
  });

  const beatTranslates = BEATS.map((_, i) => {
    const start = i / BEATS.length;
    const fadeInEnd = start + (1 / BEATS.length) * 0.3;
    if (scrollFrac < start) return 24;
    if (scrollFrac < fadeInEnd) return 24 * (1 - (scrollFrac - start) / (fadeInEnd - start));
    return 0;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Section 1: Video ── */}
      <section
        style={{
          position: 'relative',
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          background: '#0a0a0a',
          cursor: phase === 'idle' ? 'pointer' : 'default',
        }}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src="/wedding-temp-1.mp4"
          poster="/wedding-frames/ezgif-frame-001.jpg"
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Click-to-open overlay — idle only */}
        {phase === 'idle' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  background: 'rgba(255,255,255,0.08)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <polygon points="7,4 21,12 7,20" fill="white" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '12px',
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.85)',
                  margin: 0,
                  textShadow: '0 1px 8px rgba(0,0,0,0.5)',
                }}
              >
                Click to open
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Scroll anchor */}
      <div ref={detailsRef} />

      {/* ── Section 2: Scroll-driven details ── */}
      <div
        ref={detailsContainerRef}
        style={{
          height: phase === 'done' || phase === 'reversing' ? `${DETAILS_VH}vh` : 0,
          overflow: phase === 'done' || phase === 'reversing' ? 'visible' : 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            backgroundImage: 'url(/wedding-bg-new.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {BEATS.map((beat, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: phase === 'done' ? beatOpacities[i] : 0,
                transform: `translateY(${beatTranslates[i]}px)`,
                padding: '0 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '1px',
                  height: '48px',
                  background: 'linear-gradient(to bottom, transparent, #8B6914)',
                  marginBottom: '24px',
                }}
              />
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '11px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: '#8B6914',
                  margin: '0 0 16px',
                }}
              >
                {beat.label}
              </p>
              <h2
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(28px, 5vw, 56px)',
                  fontWeight: 400,
                  color: '#3D2B1F',
                  margin: '0 0 14px',
                  lineHeight: 1.2,
                  letterSpacing: '-0.01em',
                }}
              >
                {beat.heading}
              </h2>
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(14px, 2vw, 20px)',
                  color: '#5C3D2E',
                  margin: 0,
                  fontStyle: 'italic',
                  opacity: 0.75,
                  letterSpacing: '0.02em',
                }}
              >
                {beat.sub}
              </p>
              {beat.isRsvp && (
                <button
                  style={{
                    marginTop: '36px',
                    padding: '14px 40px',
                    background: 'transparent',
                    border: '1px solid #8B6914',
                    color: '#3D2B1F',
                    fontFamily: 'Georgia, serif',
                    fontSize: '12px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#3D2B1F';
                    (e.currentTarget as HTMLButtonElement).style.color = '#CBB8A5';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = '#3D2B1F';
                  }}
                >
                  RSVP Now
                </button>
              )}
              <div
                style={{
                  width: '1px',
                  height: '48px',
                  background: 'linear-gradient(to bottom, #8B6914, transparent)',
                  marginTop: '24px',
                }}
              />
            </div>
          ))}

          {/* Scroll nudge */}
          {phase === 'done' && scrollFrac < 0.02 && (
            <div
              style={{
                position: 'absolute',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                opacity: 1 - scrollFrac * 50,
                pointerEvents: 'none',
              }}
            >
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '11px',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  color: '#3D2B1F',
                  margin: 0,
                  opacity: 0.55,
                }}
              >
                Scroll
              </p>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <line x1="7" y1="0" x2="7" y2="16" stroke="#3D2B1F" strokeWidth="1" strokeOpacity="0.45" />
                <polyline points="3,12 7,16 11,12" stroke="#3D2B1F" strokeWidth="1" strokeOpacity="0.45" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
