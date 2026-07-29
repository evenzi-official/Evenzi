'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NavBar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.125rem 2.5rem',
        backdropFilter: 'blur(24px) saturate(180%)',
        background: 'rgba(13,13,13,0.75)',
        borderBottom: '1px solid rgba(187,0,32,0.1)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-poppins), Poppins, sans-serif',
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '-0.05em',
          color: '#BB0020',
        }}
      >
        Evenzi
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/home"
          style={{
            color: '#a8a8a8',
            fontWeight: 500,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/auth"
          style={{
            background: '#BB0020',
            color: '#fff',
            padding: '0.5rem 1.375rem',
            borderRadius: '9999px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
          }}
        >
          Get started
        </Link>
      </div>
    </motion.nav>
  );
}
