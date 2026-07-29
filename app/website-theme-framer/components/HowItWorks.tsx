'use client';

import { motion } from 'framer-motion';

const FONT = 'var(--font-poppins), Poppins, sans-serif';

const STEPS = [
  {
    num: '01',
    title: 'Create your event',
    desc: 'Set up in minutes with our guided wizard — name, date, venue, and event type.',
  },
  {
    num: '02',
    title: 'Invite your guests',
    desc: 'Design a personalised digital invitation card and send it via WhatsApp in one click.',
  },
  {
    num: '03',
    title: 'Celebrate together',
    desc: 'Track RSVPs live, manage your budget, share memories, and enjoy every moment.',
  },
];

export default function HowItWorks() {
  return (
    <section
      style={{
        background: '#f9fafb',
        padding: '7rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle dot texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(187,0,32,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Section head */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <p
            style={{
              color: '#BB0020',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
              fontFamily: FONT,
            }}
          >
            Simple to start
          </p>
          <h2
            style={{
              color: '#111827',
              fontSize: 'clamp(1.625rem, 3vw, 2.375rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              fontFamily: FONT,
            }}
          >
            Three steps to your perfect event
          </h2>
        </motion.div>

        {/* Steps */}
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          {/* Animated connector line (desktop only) */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.1, ease: 'easeInOut', delay: 0.25 }}
            style={{
              position: 'absolute',
              top: '31px',
              left: 'calc(16.6% + 2rem)',
              right: 'calc(16.6% + 2rem)',
              height: '2px',
              background: 'linear-gradient(to right, #BB0020 0%, rgba(187,0,32,0.2) 100%)',
              transformOrigin: 'left center',
              pointerEvents: 'none',
            }}
          />

          {STEPS.map(({ num, title, desc }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.18 }}
              style={{
                flex: '1',
                minWidth: '220px',
                textAlign: 'center',
                padding: '0 1rem',
              }}
            >
              {/* Step circle */}
              <div
                style={{
                  width: '62px',
                  height: '62px',
                  borderRadius: '50%',
                  background: '#BB0020',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                  boxShadow: '0 4px 18px rgba(187,0,32,0.32)',
                  fontFamily: FONT,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {num}
              </div>

              <h3
                style={{
                  color: '#111827',
                  fontSize: '1.0625rem',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                  marginBottom: '0.5rem',
                  fontFamily: FONT,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  fontFamily: FONT,
                  fontWeight: 400,
                }}
              >
                {desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
