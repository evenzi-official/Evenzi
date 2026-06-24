'use client'
import { useEffect } from 'react'

export function ThemeToggle({ className = 'fn-icon-btn' }: { className?: string }) {
  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }

  return (
    <button
      id="theme-toggle"
      aria-label="Toggle dark mode"
      type="button"
      className={className}
      onClick={toggle}
    >
      <span aria-hidden="true" className="material-symbols-outlined theme-icon-light">dark_mode</span>
      <span aria-hidden="true" className="material-symbols-outlined theme-icon-dark">light_mode</span>
    </button>
  )
}
