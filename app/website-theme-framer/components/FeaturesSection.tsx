'use client';

import { motion } from 'framer-motion';

const FONT = 'var(--font-poppins), Poppins, sans-serif';

const FEATURES = [
  {
    icon: '👥',
    title: 'Guest Management',
    desc: 'Add hundreds of guests, organise by family group, and watch RSVPs roll in — all from one screen.',
  },
  {
    icon: '💌',
    title: 'Digital Invitations',
    desc: 'Design a personalised invitation card and broadcast it via WhatsApp in seconds — no manual forwarding.',
  },
  {
    icon: '₹',
    title: 'Budget Tracker',
    desc: 'Set per-category budgets, log vendor payments, and never overspend on your most important day.',
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{
        background: 'linear-gradient(to bottom, #0d0d0d 0%, #111111 100%)',
        padding: '7rem 2.5rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Section head */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '3.75rem' }}
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
            Everything you need
          </p>
          <h2
            style={{
              color: '#f9fafb',
              fontSize: 'clamp(1.625rem, 3vw, 2.375rem)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              fontFamily: FONT,
            }}
          >
            One platform. Every detail.
          </h2>
        </motion.div>

        {/* Cards grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))',
            gap: '1.375rem',
          }}
        >
          {FEATURES.map(({ icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 44 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: i * 0.14 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              style={{
                background: 'rgba(255,255,255,0.035)',
                backdropFilter: 'blur(32px) saturate(180%)',
                border: '1px solid rgba(187,0,32,0.13)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow:
                  '0 4px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.055)',
                cursor: 'default',
              }}
            >
              {/* Icon chip */}
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: 'rgba(187,0,32,0.1)',
                  border: '1px solid rgba(187,0,32,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.25rem',
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              <h3
                style={{
                  color: '#f9fafb',
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
                  color: '#a8a8a8',
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
