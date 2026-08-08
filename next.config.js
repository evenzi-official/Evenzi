/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        source: '/help/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
