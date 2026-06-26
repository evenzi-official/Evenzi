"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (prefersReduced || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => el.classList.add("in"))
      return
    }

    const vh = window.innerHeight || document.documentElement.clientHeight

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in")
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08 }
    )

    function scanEl(el: HTMLElement): void {
      if (el.classList.contains("in")) return
      const rect = el.getBoundingClientRect()
      if (rect.top < vh && rect.bottom > 0) {
        el.classList.add("in")
      } else {
        io.observe(el)
      }
    }

    // Scan elements already in the DOM (covers client-side nav)
    document.querySelectorAll<HTMLElement>(".reveal").forEach(scanEl)

    // Pick up .reveal elements that stream in after the loading skeleton is replaced
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue
          if (node.classList.contains("reveal")) scanEl(node)
          node.querySelectorAll<HTMLElement>(".reveal").forEach(scanEl)
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [pathname])

  return null
}
