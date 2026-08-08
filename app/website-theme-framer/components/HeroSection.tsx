'use client';

import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7rem 2.5rem 5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Brand glow orbs */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          left: '-5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(187,0,32,0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '-5%',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(187,0,32,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '780px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55 }}
          style={{
            color: '#BB0020',
            fontWeight: 700,
            fontSize: '0.7rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            marginBottom: '1.25rem',
          }}
        >
          India&apos;s event planning platform
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.65 }}
          style={{
            color: '#f9fafb',
            fontWeight: 800,
            fontSize: 'clamp(2.5rem, 6.5vw, 4.75rem)',
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            marginBottom: '1.5rem',
          }}
        >
          Your celebration,
          <br />
          <span style={{ color: '#BB0020' }}>beautifully organised.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          style={{
            color: '#a8a8a8',
            fontSize: '1.0625rem',
            maxWidth: '540px',
            margin: '0 auto 2.5rem',
            lineHeight: 1.75,
            fontWeight: 400,
          }}
        >
          From guest list to WhatsApp invitations, RSVPs to budget tracking —
          everything your event needs, in one beautifully designed place.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.72, duration: 0.55 }}
          style={{
            display: 'flex',
            gap: '0.875rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <motion.a
            href="/auth"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: '#BB0020',
              color: '#fff',
              padding: '0.875rem 2.125rem',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(187,0,32,0.32)',
            }}
          >
            Start for free
          </motion.a>
          <motion.a
            href="#features"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              border: '1px solid rgba(255,255,255,0.13)',
              color: '#f9fafb',
              padding: '0.875rem 2.125rem',
              borderRadius: '9999px',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            See how it works
          </motion.a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          style={{
            marginTop: '5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.625rem',
            color: '#4a4a4a',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          <span>Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
            style={{
              width: '1px',
              height: '36px',
              background: 'linear-gradient(to bottom, #BB0020, transparent)',
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}
