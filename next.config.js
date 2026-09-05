/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/help/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Must stay in sync with the admin CSP in middleware.ts (applySurfaceHeaders).
            // 'unsafe-inline' scripts are required so Next.js App Router's inline
            // hydration bootstrap (and the root layout's theme-guard <script>) can run —
            // a strict default-src 'self' blocks them and white-screens the page.
            // /help markdown is already server-sanitised (see the help renderer), so this
            // CSP is defence-in-depth, not the primary XSS guard. Google Fonts is allowed
            // for the Material Symbols icon font pulled in by the root layout.
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
