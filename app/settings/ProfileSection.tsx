'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPhone } from '@/lib/utils'
import { useBusy } from '@/components/ui/BusyProvider'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  userId: string
  displayName: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
}

export function ProfileSection({ displayName, email, phone, avatarUrl }: Props): React.ReactElement {
  const router = useRouter()
  const { runBusy } = useBusy()
  const [name, setName] = useState(displayName ?? '')
  const [avatar, setAvatar] = useState(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      await runBusy(async () => {
        const res = await fetch('/api/settings/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ display_name: name.trim() }),
        })
        if (!res.ok) {
          flashToast('Could not save changes.', 'error')
          return
        }
        flashToast('Changes saved', 'success')
        router.refresh()
      }, 'Saving…')
    } catch {
      flashToast('Could not save changes.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: formData })
      const data: { url?: string; error?: string } = await res.json()
      if (!res.ok || !data.url) {
        setAvatarError(data.error ?? 'Upload failed')
        return
      }
      setAvatar(data.url)
      flashToast('Avatar updated', 'success')
      router.refresh()
    } catch {
      setAvatarError('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <section id="profile" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Profile information
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-profile">
          <div className="settings-profile-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone number</label>
              {formatPhone(phone) ? (
                <div className="form-input form-input-group">
                  <span className="form-input-prefix" aria-hidden="true">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    className="form-input-field"
                    value={formatPhone(phone)}
                    readOnly
                    autoComplete="tel"
                    inputMode="numeric"
                  />
                </div>
              ) : (
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  value=""
                  readOnly
                  autoComplete="tel"
                  inputMode="numeric"
                />
              )}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email ?? ''}
                readOnly
                autoComplete="email"
              />
            </div>
          </div>

          <div className="settings-profile-avatar">
            <div className="avatar-edit">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="avatar-edit-img" />
              ) : (
                <span className="avatar-edit-img" aria-hidden="true">{(name || 'U')[0]?.toUpperCase()}</span>
              )}
              <input
                type="file"
                id="avatar-upload"
                className="avatar-edit-input"
                accept="image/*"
                onChange={(e) => { void handleAvatarChange(e) }}
                disabled={uploading}
              />
              <label htmlFor="avatar-upload" className="avatar-edit-btn" aria-label="Change avatar">
                <span aria-hidden="true" className="material-symbols-outlined">photo_camera</span>
              </label>
            </div>
            <p className="form-error" id="avatar-error" role="alert" hidden={!avatarError}>{avatarError}</p>
          </div>
        </div>

        <div className="mt-4">
          <button type="button" className="btn-pill btn-pill-primary" onClick={() => { void handleSave() }} disabled={saving}>
            <span aria-hidden="true" className="material-symbols-outlined">save</span>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {toast && <span className={`ml-3 text-sm ${toast.tone === 'success' ? 'text-success' : 'text-error'}`}>{toast.message}</span>}
        </div>
      </div>
    </section>
  )
}
