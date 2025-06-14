/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['vistream.net'],
  },
  reactStrictMode: true,
}

module.exports = nextConfig 