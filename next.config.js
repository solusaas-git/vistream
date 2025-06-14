/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Fix cross-origin warning for development
  allowedDevOrigins: [
    '192.168.11.101',
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
  ],
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['vistream.net'],
  },
  reactStrictMode: true,
  // Webpack optimization to prevent cache issues
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Prevent webpack cache corruption in development
      config.cache = {
        type: 'memory'
      }
    }
    return config
  },
}

module.exports = nextConfig 