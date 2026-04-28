/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  serverExternalPackages: ['sharp'],
  experimental: {
    // Enable streaming for large file uploads
    serverActions: {
      bodySizeLimit: '10mb', // Set to 10MB for server actions
    },
  },
  // For API routes in App Router, we need to handle file size limits differently
  async headers() {
    return [
      {
        source: '/api/admin/upload/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

export default nextConfig
