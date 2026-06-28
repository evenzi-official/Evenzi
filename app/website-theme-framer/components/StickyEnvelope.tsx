'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';

const FONT = 'var(--font-poppins), Poppins, sans-serif';

type TextPanelProps = {
  heading: string;
  sub: string;
  opacity: MotionValue<number>;
};

function TextPanel({ heading, sub, opacity }: TextPanelProps) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2px',
        opacity,
      }}
    >
      <p
        style={{
          color: '#f9fafb',
          fontSize: 'clamp(1.25rem, 2.8vw, 1.875rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          fontFamily: FONT,
          margin: 0,
        }}
      >
        {heading}
      </p>
      <p
        style={{
          color: '#BB0020',
          fontSize: 'clamp(1.25rem, 2.8vw, 1.875rem)',
          fontWeight: 800,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          fontFamily: FONT,
          margin: 0,
        }}
      >
        {sub}
      </p>
    </motion.div>
  );
}

export default function StickyEnvelope() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Envelope entrance / exit
  const envelopeY = useTransform(scrollYProgress, [0, 0.15], [80, 0]);
  const envelopeOpacity = useTransform(
    scrollYProgress,
    [0, 0.08, 0.86, 0.96],
    [0, 1, 1, 0]
  );
  const envelopeScale = useTransform(scrollYProgress, [0, 0.15], [0.88, 1]);

  // Flap opens (rotateX: 0 → -172, origin = top)
  const flapRotateX = useTransform(scrollYProgress, [0.15, 0.42], [0, -172]);

  // Card slides up out of envelope
  const cardY = useTransform(scrollYProgress, [0.36, 0.65], [50, -150]);
  const cardOpacity = useTransform(scrollYProgress, [0.33, 0.42], [0, 1]);

  // Card spins (full 360 on Y axis — front → back → front)
  const cardRotateY = useTransform(scrollYProgress, [0.62, 0.86], [0, 360]);

  // Text panels — each fades in/out at its own scroll window
  const text0Opacity = useTransform(
    scrollYProgress,
    [0.05, 0.15, 0.30, 0.40],
    [0, 1, 1, 0]
  );
  const text1Opacity = useTransform(
    scrollYProgress,
    [0.33, 0.43, 0.52, 0.62],
    [0, 1, 1, 0]
  );
  const text2Opacity = useTransform(
    scrollYProgress,
    [0.55, 0.65, 0.73, 0.82],
    [0, 1, 1, 0]
  );
  const text3Opacity = useTransform(
    scrollYProgress,
    [0.76, 0.86, 0.94, 1.0],
    [0, 1, 1, 0]
  );

  // Ambient glow intensifies mid-animation
  const bgGlowOpacity = useTransform(scrollYProgress, [0.4, 0.7], [0.08, 0.22]);

  const textPanels: Array<{ heading: string; sub: string; opacity: MotionValue<number> }> = [
    { heading: 'One invitation.', sub: 'A thousand guests.', opacity: text0Opacity },
    { heading: 'Send via WhatsApp', sub: 'in seconds.', opacity: text1Opacity },
    { heading: 'Track every RSVP,', sub: 'live.', opacity: text2Opacity },
    { heading: 'Your day.', sub: 'Your story.', opacity: text3Opacity },
  ];

  const dotOpacities: MotionValue<number>[] = [text0Opacity, text1Opacity, text2Opacity, text3Opacity];

  return (
    <section
      ref={containerRef}
      style={{ height: '300vh', position: 'relative', background: '#0d0d0d' }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Ambient radial glow */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 42%, rgba(187,0,32,0.22) 0%, transparent 62%)',
            opacity: bgGlowOpacity,
            pointerEvents: 'none',
          }}
        />

        {/* ── 3D Envelope ── */}
        <motion.div
          style={{
            y: envelopeY,
            opacity: envelopeOpacity,
            scale: envelopeScale,
            position: 'relative',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          {/* Perspective context for all 3D children */}
          <div
            style={{
              perspective: '1200px',
              perspectiveOrigin: '50% 28%',
              position: 'relative',
              width: '340px',
              height: '240px',
            }}
          >
            {/* Ground shadow */}
            <div
              style={{
                position: 'absolute',
                bottom: '-22px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '220px',
                height: '18px',
                background: 'rgba(187,0,32,0.18)',
                filter: 'blur(16px)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />

            {/* Envelope body */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(152deg, #fefcf7 0%, #fdf6ec 100%)',
                borderRadius: '16px',
                boxShadow:
                  '0 28px 70px rgba(0,0,0,0.48), 0 8px 22px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.72)',
                zIndex: 1,
                overflow: 'hidden',
              }}
            >
              {/* Bottom V-fold */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '58%',
                  clipPath: 'polygon(0 100%, 50% 12%, 100% 100%)',
                  background: 'rgba(187,0,32,0.035)',
                  borderTop: '1px solid rgba(187,0,32,0.09)',
                }}
              />
              {/* Left fold */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: 'polygon(0 0, 50% 52%, 0 100%)',
                  background: 'rgba(0,0,0,0.018)',
                  borderRight: '1px solid rgba(187,0,32,0.055)',
                }}
              />
              {/* Right fold */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: 'polygon(100% 0, 50% 52%, 100% 100%)',
                  background: 'rgba(0,0,0,0.018)',
                  borderLeft: '1px solid rgba(187,0,32,0.055)',
                }}
              />

              {/* Wax seal */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle at 34% 30%, #d4003a 0%, #BB0020 42%, #7a0016 100%)',
                  boxShadow:
                    '0 3px 12px rgba(187,0,32,0.52), 0 1px 4px rgba(0,0,0,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: 'rgba(253,248,240,0.92)',
                    fontSize: '15px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    fontFamily: FONT,
                    lineHeight: 1,
                  }}
                >
                  E
                </span>
              </div>
            </div>

            {/* ── Invitation card (slides up, then spins) ── */}
            <motion.div
              style={{
                position: 'absolute',
                top: '12px',
                left: '20px',
                right: '20px',
                bottom: '12px',
                y: cardY,
                opacity: cardOpacity,
                rotateY: cardRotateY,
                transformStyle: 'preserve-3d',
                zIndex: 5,
                borderRadius: '10px',
              }}
            >
              {/* Card front */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  background: '#fff',
                  boxShadow:
                    '0 12px 48px rgba(0,0,0,0.38), 0 3px 12px rgba(0,0,0,0.2)',
                  backfaceVisibility: 'hidden',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Red header */}
                <div
                  style={{
                    background: 'linear-gradient(128deg, #BB0020 0%, #8a0018 100%)',
                    padding: '18px 16px 13px',
                    textAlign: 'center',
                    flexShrink: 0,
                  }}
                >
                  <p
                    style={{
                      color: 'rgba(253,248,240,0.62)',
                      fontSize: '7px',
                      fontWeight: 700,
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                      marginBottom: '5px',
                      fontFamily: FONT,
                    }}
                  >
                    You&apos;re Invited
                  </p>
                  <p
                    style={{
                      color: '#fdf8f0',
                      fontSize: '18px',
                      fontWeight: 800,
                      letterSpacing: '-0.03em',
                      fontFamily: FONT,
                      lineHeight: 1,
                    }}
                  >
                    Priya &amp; Raj
                  </p>
                </div>

                {/* Card body */}
                <div
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    textAlign: 'center',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                  }}
                >
                  {/* Decorative inset frame */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: '7px',
                      border: '1px solid rgba(187,0,32,0.14)',
                      borderRadius: '5px',
                      pointerEvents: 'none',
                    }}
                  />
                  <p
                    style={{
                      color: '#BB0020',
                      fontSize: '8px',
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      fontFamily: FONT,
                      margin: 0,
                    }}
                  >
                    ✦ Wedding Celebration ✦
                  </p>
                  <p
                    style={{
                      color: '#111827',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: FONT,
                      margin: 0,
                    }}
                  >
                    Saturday, 15 November 2026
                  </p>
                  <p
                    style={{
                      color: '#6b7280',
                      fontSize: '9.5px',
                      fontWeight: 500,
                      fontFamily: FONT,
                      margin: 0,
                    }}
                  >
                    The Grand Palace, Hyderabad
                  </p>
                  <div
                    style={{
                      marginTop: '2px',
                      background: 'rgba(187,0,32,0.07)',
                      border: '1px solid rgba(187,0,32,0.16)',
                      borderRadius: '9999px',
                      padding: '3px 11px',
                      fontSize: '7.5px',
                      fontWeight: 700,
                      color: '#BB0020',
                      letterSpacing: '0.12em',
                      fontFamily: FONT,
                    }}
                  >
                    RSVP by 1 Nov
                  </div>
                </div>
              </div>

              {/* Card back */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '10px',
                  background: 'linear-gradient(148deg, #fefcf7 0%, #fdf6ec 100%)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.32)',
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    color: '#BB0020',
                    fontSize: '24px',
                    fontWeight: 800,
                    letterSpacing: '-0.055em',
                    opacity: 0.22,
                    fontFamily: FONT,
                    lineHeight: 1,
                  }}
                >
                  Evenzi
                </span>
                <span
                  style={{
                    color: '#BB0020',
                    fontSize: '6.5px',
                    fontWeight: 700,
                    letterSpacing: '0.28em',
                    textTransform: 'uppercase',
                    opacity: 0.14,
                    fontFamily: FONT,
                  }}
                >
                  Beautifully Organised
                </span>
              </div>
            </motion.div>

            {/* ── Envelope flap (lifts open) ── */}
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '56%',
                rotateX: flapRotateX,
                transformOrigin: 'top center',
                zIndex: 6,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(170deg, #fefef9 0%, #fdf9f1 100%)',
                  clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
                  borderRadius: '16px 16px 0 0',
                }}
              />
              {/* Crease line at fold */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'rgba(187,0,32,0.1)',
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Text panels (below envelope) ── */}
        <div
          style={{
            position: 'relative',
            height: '96px',
            width: '100%',
            maxWidth: '520px',
            textAlign: 'center',
            zIndex: 2,
            flexShrink: 0,
          }}
        >
          {textPanels.map(({ heading, sub, opacity }) => (
            <TextPanel key={heading} heading={heading} sub={sub} opacity={opacity} />
          ))}
        </div>

        {/* ── Side progress dots ── */}
        <div
          style={{
            position: 'absolute',
            right: '1.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10,
          }}
        >
          {dotOpacities.map((op, i) => (
            <motion.div
              key={i}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#BB0020',
                opacity: op,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
