/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:30306/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:30306/health',
      },
    ];
  },
  trailingSlash: false,
};

export default nextConfig;
