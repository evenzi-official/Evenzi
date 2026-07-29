'use client';

import { motion } from 'framer-motion';

const FONT = 'var(--font-poppins), Poppins, sans-serif';

export default function CTASection() {
  return (
    <section
      style={{
        background: '#0d0d0d',
        padding: '8rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Large centred glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(187,0,32,0.15) 0%, transparent 58%)',
          pointerEvents: 'none',
        }}
      />

      {/* Decorative ring */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1px solid rgba(187,0,32,0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          border: '1px solid rgba(187,0,32,0.04)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <p
            style={{
              color: '#BB0020',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              marginBottom: '1.125rem',
              fontFamily: FONT,
            }}
          >
            Free to start
          </p>

          <h2
            style={{
              color: '#f9fafb',
              fontSize: 'clamp(1.875rem, 4.5vw, 3.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.08,
              marginBottom: '1.375rem',
              fontFamily: FONT,
            }}
          >
            Start planning your
            <br />
            celebration today.
          </h2>

          <p
            style={{
              color: '#a8a8a8',
              fontSize: '1rem',
              lineHeight: 1.75,
              marginBottom: '2.75rem',
              fontFamily: FONT,
              fontWeight: 400,
            }}
          >
            Join thousands of hosts across India who trust Evenzi to make their
            most important moments unforgettable.
          </p>

          <motion.a
            href="/auth"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'inline-block',
              background: '#BB0020',
              color: '#fff',
              padding: '1rem 2.75rem',
              borderRadius: '9999px',
              fontSize: '1rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 6px 28px rgba(187,0,32,0.38)',
              fontFamily: FONT,
              letterSpacing: '-0.01em',
            }}
          >
            Get started for free →
          </motion.a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '1.75rem',
            color: '#3a3a3a',
            fontSize: '0.8rem',
            fontWeight: 500,
            fontFamily: FONT,
          }}
        >
          No credit card required · Free tier includes one complete event
        </motion.p>

        {/* Evenzi wordmark footer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
          style={{
            marginTop: '5rem',
            color: '#BB0020',
            fontSize: '1.375rem',
            fontWeight: 800,
            letterSpacing: '-0.05em',
            fontFamily: FONT,
            opacity: 0.35,
          }}
        >
          Evenzi
        </motion.p>
      </div>
    </section>
  );
}
