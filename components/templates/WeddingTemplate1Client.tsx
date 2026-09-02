'use client';

import React, { useEffect, useRef, useState } from 'react';

interface EventData {
  name: string | null;
  primary_date: string | null;
  primary_venue: string | null;
  event_details: Record<string, string> | null;
}

type ContentBlock = {
  id: string;
  block_type: 'heading' | 'text' | 'photo';
  heading: string | null;
  body: string | null;
  photo_key: string | null;
  twocol: boolean;
  display_order: number;
};

type WebsitePage = {
  name: string;
  slug: string;
  tier: string;
  content: ContentBlock[];
  page_id: string;
  display_order: number;
};

interface Props {
  event: EventData | null;
  eventId: string | null;
  pages?: WebsitePage[];
  isIdentified?: boolean;
  guestName?: string | null;
  slug?: string | null;
}

function formatLongDate(iso: string | null): string {
  if (!iso) return 'Date to be announced';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function rsvpDeadline(iso: string | null): string {
  if (!iso) return 'soon';
  const d = new Date(iso);
  d.setDate(d.getDate() - 14);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function buildBeats(event: EventData | null, pages: WebsitePage[] = []) {
  const meta = event?.event_details ?? {};
  const partner1 = meta.partner1_name ?? meta.bride_name ?? null;
  const partner2 = meta.partner2_name ?? meta.groom_name ?? null;
  const coupleHeading =
    partner1 && partner2 && partner1 !== partner2
      ? `${partner1} & ${partner2}`
      : event?.name ?? 'Our Wedding';

  const coreBeats = [
    {
      label: 'Together Forever',
      heading: coupleHeading,
      sub: 'joyfully invite you to celebrate their wedding',
      isRsvp: false,
    },
    {
      label: 'Date',
      heading: formatLongDate(event?.primary_date ?? null),
      sub: '',
      isRsvp: false,
    },
    {
      label: 'Venue',
      heading: event?.primary_venue ?? 'Venue to be announced',
      sub: '',
      isRsvp: false,
    },
    {
      label: 'RSVP',
      heading: `Kindly respond by ${rsvpDeadline(event?.primary_date ?? null)}`,
      sub: 'We look forward to celebrating with you',
      isRsvp: true,
    },
  ];

  const pageBeats = pages
    .filter(p => p.slug !== 'home')
    .map(page => {
      const blocks = page.content.slice().sort((a, b) => a.display_order - b.display_order);
      const headingBlock = blocks.find(b => b.heading);
      const bodyBlock = blocks.find(b => b.body);
      return {
        label: page.name,
        heading: headingBlock?.heading ?? page.name,
        sub: bodyBlock?.body ?? (blocks.length === 0 ? 'Content coming soon.' : ''),
        isRsvp: false,
      };
    });

  return [...coreBeats, ...pageBeats];
}

const BEAT_VH = 75;
type Phase = 'idle' | 'playing' | 'done' | 'scrubbing';
type Attendance = 'yes' | 'no' | 'maybe';
type ModalState = 'idle' | 'submitting' | 'success' | 'error';

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const modalStyle: React.CSSProperties = {
  background: '#fdf7f0',
  borderRadius: '4px',
  padding: '48px 40px 40px',
  width: '100%',
  maxWidth: '420px',
  position: 'relative',
  fontFamily: 'Georgia, serif',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid #c9b89a',
  borderRadius: '2px',
  fontFamily: 'Georgia, serif',
  fontSize: '14px',
  color: '#3D2B1F',
  background: '#fffcf8',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function WeddingTemplate1Client({ event, eventId, pages, isIdentified, guestName: identifiedGuestName, slug }: Props) {
  const contentPages = (pages ?? []).filter(p => p.slug !== 'home');
  const BEATS = buildBeats(event, contentPages);
  const DETAILS_VH = BEATS.length * BEAT_VH;

  const videoRef = useRef<HTMLVideoElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const detailsContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledIntoDetails = useRef(false);
  const phaseRef = useRef<Phase>('idle');
  const shouldScrollToDetails = useRef(false);

  const [phase, setPhase] = useState<Phase>('idle');
  const [scrollFrac, setScrollFrac] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [modalState, setModalState] = useState<ModalState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; attendance?: string }>({});

  const setPhaseSync = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const handleClick = () => {
    if (phase !== 'idle') return;
    const video = videoRef.current;
    if (!video) return;
    setPhaseSync('playing');
    video.play();
  };

  const handleVideoEnd = () => {
    hasScrolledIntoDetails.current = false;
    shouldScrollToDetails.current = true;
    setPhaseSync('done');
  };

  useEffect(() => {
    if (phase !== 'done' || !shouldScrollToDetails.current) return;
    shouldScrollToDetails.current = false;
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [phase]);

  useEffect(() => {
    const onScroll = () => {
      const p = phaseRef.current;
      const scrollY = window.scrollY;

      if (p === 'done') {
        const container = detailsContainerRef.current;
        if (container) {
          const scrollable = container.offsetHeight - window.innerHeight;
          const frac = Math.min(Math.max(-container.getBoundingClientRect().top / scrollable, 0), 1);
          setScrollFrac(frac);
          if (frac > 0.05) hasScrolledIntoDetails.current = true;
        }
        if (scrollY < window.innerHeight && hasScrolledIntoDetails.current) {
          hasScrolledIntoDetails.current = false;
          setPhaseSync('scrubbing');
          const video = videoRef.current;
          if (video && video.duration) {
            video.currentTime = video.duration * (scrollY / window.innerHeight);
          }
        }
      }

      if (p === 'scrubbing') {
        const video = videoRef.current;
        if (video && video.duration) {
          video.currentTime = video.duration * Math.min(Math.max(scrollY / window.innerHeight, 0), 1);
        }
        if (scrollY >= window.innerHeight) setPhaseSync('done');
        else if (scrollY <= 0) setPhaseSync('idle');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const beatOpacities = BEATS.map((_, i) => {
    const start = i / BEATS.length;
    const end = (i + 1) / BEATS.length;
    const fadeInEnd = start + (end - start) * 0.3;
    const fadeOutStart = end - (end - start) * 0.25;
    if (i === 0) {
      if (scrollFrac < fadeOutStart) return 1;
      if (scrollFrac < end) return 1 - (scrollFrac - fadeOutStart) / (end - fadeOutStart);
      return 0;
    }
    if (scrollFrac < start) return 0;
    if (scrollFrac < fadeInEnd) return (scrollFrac - start) / (fadeInEnd - start);
    if (i === BEATS.length - 1) return 1;
    if (scrollFrac < fadeOutStart) return 1;
    if (scrollFrac < end) return 1 - (scrollFrac - fadeOutStart) / (end - fadeOutStart);
    return 0;
  });

  const beatTranslates = BEATS.map((_, i) => {
    if (i === 0) return 0;
    const start = i / BEATS.length;
    const fadeInEnd = start + (1 / BEATS.length) * 0.3;
    if (scrollFrac < start) return 24;
    if (scrollFrac < fadeInEnd) return 24 * (1 - (scrollFrac - start) / (fadeInEnd - start));
    return 0;
  });

  async function handleRsvpSubmit() {
    const errors: { name?: string; phone?: string; attendance?: string } = {};
    if (!guestName.trim()) errors.name = 'Please enter your name';
    if (!/^\d{10}$/.test(guestPhone.trim())) errors.phone = 'Enter a valid 10-digit mobile number';
    if (!attendance) errors.attendance = 'Please select your attendance';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!eventId) {
      setErrorMsg('No event linked. Cannot save RSVP.');
      setModalState('error');
      return;
    }

    setFieldErrors({});
    setModalState('submitting');

    // Legacy /api/events/[id]/rsvp was retired (open service-role insert). Design-test
    // page only — real RSVP is on /e/[slug] after guest lookup.
    setErrorMsg('RSVP on this design-test page is disabled. Use the live guest website.')
    setModalState('error')
  }

  function closeModal() {
    setModalOpen(false);
    setGuestName('');
    setGuestPhone('');
    setAttendance(null);
    setModalState('idle');
    setErrorMsg('');
    setFieldErrors({});
  }

  const attendanceOptions: Array<{ value: Attendance; label: string }> = [
    { value: 'yes', label: 'Joyfully accept' },
    { value: 'no', label: 'Regretfully decline' },
    { value: 'maybe', label: 'Will try to make it' },
  ];

  const successMessage = attendance === 'yes'
    ? { eyebrow: 'See you there', heading: 'Thank you for accepting!', body: "We can't wait to celebrate with you." }
    : attendance === 'no'
    ? { eyebrow: 'We understand', heading: 'Thank you for letting us know.', body: 'You will be missed. We hope to see you soon.' }
    : { eyebrow: 'We hope to see you', heading: 'Thank you!', body: "We'll keep our fingers crossed!" };

  return (
    <React.Fragment>
      {/* RSVP Modal */}
      {modalOpen && (
        <div
          style={overlayStyle}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div style={modalStyle}>
            {/* Close button */}
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#8B6914', fontSize: '20px', lineHeight: 1, fontFamily: 'Georgia, serif' }}
            >
              &times;
            </button>

            {modalState === 'success' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, transparent, #8B6914)', margin: '0 auto 24px' }} />
                <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8B6914', margin: '0 0 16px' }}>
                  {successMessage.eyebrow}
                </p>
                <h2 style={{ fontSize: '26px', fontWeight: 400, color: '#3D2B1F', margin: '0 0 12px', lineHeight: 1.2 }}>
                  {successMessage.heading}
                </h2>
                <p style={{ fontSize: '14px', color: '#5C3D2E', margin: '0 0 32px', fontStyle: 'italic', opacity: 0.75 }}>
                  {successMessage.body}
                </p>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '12px 36px', background: 'transparent', border: '1px solid #8B6914', color: '#3D2B1F', fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Close
                </button>
                <div style={{ width: '1px', height: '40px', background: 'linear-gradient(to bottom, #8B6914, transparent)', margin: '24px auto 0' }} />
              </div>
            ) : (
              <div>
                <div style={{ width: '1px', height: '36px', background: 'linear-gradient(to bottom, transparent, #8B6914)', margin: '0 auto 20px' }} />
                <p style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8B6914', textAlign: 'center', margin: '0 0 8px' }}>
                  RSVP
                </p>
                <h2 style={{ fontSize: '24px', fontWeight: 400, color: '#3D2B1F', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.3 }}>
                  Will you be joining us?
                </h2>

                {/* Name */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6914', marginBottom: '8px' }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); setFieldErrors((p) => ({ ...p, name: undefined })); }}
                    placeholder="Your full name"
                    style={{ ...inputStyle, borderColor: fieldErrors.name ? '#c0392b' : '#c9b89a' }}
                  />
                  {fieldErrors.name && (
                    <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0', fontFamily: 'Georgia, serif' }}>
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6914', marginBottom: '8px' }}>
                    Mobile number
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={guestPhone}
                    onChange={(e) => { setGuestPhone(e.target.value.replace(/\D/g, '')); setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                    placeholder="10-digit mobile number"
                    style={{ ...inputStyle, borderColor: fieldErrors.phone ? '#c0392b' : '#c9b89a' }}
                  />
                  {fieldErrors.phone && (
                    <p style={{ color: '#c0392b', fontSize: '12px', margin: '4px 0 0', fontFamily: 'Georgia, serif' }}>
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Attendance */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B6914', marginBottom: '12px' }}>
                    Attendance
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {attendanceOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setAttendance(opt.value); setFieldErrors((p) => ({ ...p, attendance: undefined })); }}
                        style={{
                          padding: '12px 16px',
                          border: `1px solid ${attendance === opt.value ? '#8B6914' : '#c9b89a'}`,
                          background: attendance === opt.value ? '#8B6914' : 'transparent',
                          color: attendance === opt.value ? '#fdf7f0' : '#3D2B1F',
                          fontFamily: 'Georgia, serif',
                          fontSize: '13px',
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          borderRadius: '2px',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.attendance && (
                    <p style={{ color: '#c0392b', fontSize: '12px', margin: '6px 0 0', fontFamily: 'Georgia, serif' }}>
                      {fieldErrors.attendance}
                    </p>
                  )}
                </div>

                {/* Error */}
                {modalState === 'error' && (
                  <p style={{ color: '#c0392b', fontSize: '13px', marginBottom: '16px', fontFamily: 'Georgia, serif', textAlign: 'center' }}>
                    {errorMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="button"
                  onClick={() => { void handleRsvpSubmit(); }}
                  disabled={modalState === 'submitting'}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: modalState === 'submitting' ? '#c9b89a' : '#3D2B1F',
                    border: 'none',
                    color: '#fdf7f0',
                    fontFamily: 'Georgia, serif',
                    fontSize: '11px',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    cursor: modalState === 'submitting' ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  {modalState === 'submitting' ? 'Sending...' : 'Send my RSVP'}
                </button>

                <div style={{ width: '1px', height: '32px', background: 'linear-gradient(to bottom, #8B6914, transparent)', margin: '24px auto 0' }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Video */}
      <section
        style={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden', background: '#0a0a0a', cursor: phase === 'idle' ? 'pointer' : 'default' }}
        onClick={handleClick}
      >
        <video
          ref={videoRef}
          src="/wedding-temp-1.mp4"
          poster="/wedding-frames/ezgif-frame-001.jpg"
          playsInline
          preload="auto"
          onEnded={handleVideoEnd}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {phase === 'idle' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 50%)', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', background: 'rgba(255,255,255,0.08)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <polygon points="7,4 21,12 7,20" fill="white" />
                </svg>
              </div>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '12px', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                Click to open
              </p>
            </div>
          </div>
        )}
      </section>

      <div ref={detailsRef} />

      {/* Section 2: Scroll-driven details */}
      <div
        ref={detailsContainerRef}
        style={{ height: phase === 'done' || phase === 'scrubbing' ? `${DETAILS_VH}vh` : 0, overflow: phase === 'done' || phase === 'scrubbing' ? 'visible' : 'hidden', position: 'relative' }}
      >
        <div
          style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', backgroundImage: 'url(/wedding-bg-new.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {BEATS.map((beat, i) => (
            <div
              key={i}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: (phase === 'done' || phase === 'scrubbing') ? beatOpacities[i] : 0, transform: `translateY(${beatTranslates[i]}px)`, zIndex: 1, padding: '0 24px', textAlign: 'center' }}
            >
              <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, transparent, #8B6914)', marginBottom: '24px' }} />
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#8B6914', margin: '0 0 16px' }}>
                {beat.label}
              </p>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 400, color: '#3D2B1F', margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {beat.heading}
              </h2>
              {beat.sub !== '' && (
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(14px, 2vw, 20px)', color: '#5C3D2E', margin: 0, fontStyle: 'italic', opacity: 0.75, letterSpacing: '0.02em' }}>
                  {beat.sub}
                </p>
              )}
              {beat.isRsvp && (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  style={{ marginTop: '36px', padding: '14px 40px', background: 'transparent', border: '1px solid #8B6914', color: '#3D2B1F', fontFamily: 'Georgia, serif', fontSize: '12px', letterSpacing: '0.3em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#3D2B1F'; (e.currentTarget as HTMLButtonElement).style.color = '#CBB8A5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#3D2B1F'; }}
                >
                  RSVP Now
                </button>
              )}
              <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom, #8B6914, transparent)', marginTop: '24px' }} />
            </div>
          ))}

          {(phase === 'done' || phase === 'scrubbing') && (
            <img src="/flw-1.gif" alt="" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '85%', opacity: 0.7, pointerEvents: 'none' }} />
          )}

          {phase === 'done' && scrollFrac < 0.02 && (
            <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 1 - scrollFrac * 50, pointerEvents: 'none' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '11px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#3D2B1F', margin: 0, opacity: 0.55 }}>Scroll</p>
              <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                <line x1="7" y1="0" x2="7" y2="16" stroke="#3D2B1F" strokeWidth="1" strokeOpacity="0.45" />
                <polyline points="3,12 7,16 11,12" stroke="#3D2B1F" strokeWidth="1" strokeOpacity="0.45" strokeLinejoin="round" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          )}
        </div>
      </div>

    </React.Fragment>
  );
}
