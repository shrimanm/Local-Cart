/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure SWC is used for Next.js
  swcMinify: true,
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configure images
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com'],
  },
  // Ignore mobile files during Next.js build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Ignore mobile-specific files
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  experimental: {
    // Ensure compatibility
    esmExternals: false,
  },
};

module.exports = nextConfig;