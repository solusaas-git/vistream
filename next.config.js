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
    // Note: ngrok domains need to be added manually as strings when testing
    // Example: 'abc123.ngrok.io', 'def456.ngrok-free.app'
  ],
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['vistream.net'],
  },
  reactStrictMode: true,
  // Headers for Mollie.js support and IP forwarding
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.mollie.com js.stripe.com; style-src 'self' 'unsafe-inline'; connect-src 'self' api.mollie.com js.mollie.com api.stripe.com; frame-src 'self' js.mollie.com js.stripe.com;"
          }
        ]
      }
    ]
  },
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
  // Trust proxy for IP forwarding (important for production)
  async rewrites() {
    return []
  },
  // Environment-specific configurations
  env: {
    TRUST_PROXY: process.env.TRUST_PROXY || 'false',
  }
}

module.exports = nextConfig 