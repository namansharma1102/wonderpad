import withPWAInit from '@ducanh2912/next-pwa'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // pdfjs-dist has an optional canvas dependency for Node.js environments.
    // We don't use it, so tell webpack to ignore it.
    config.resolve.alias.canvas = false
    return config
  },
}

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default withPWA(nextConfig)
