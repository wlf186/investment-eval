/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // 如果修改了后端端口，请同步更新下面的 destination 端口号
        destination: 'http://localhost:30306/api/:path*',
      },
      {
        source: '/health',
        // 如果修改了后端端口，请同步更新下面的 destination 端口号
        destination: 'http://localhost:30306/health',
      },
    ];
  },
  trailingSlash: false,
};

export default nextConfig;
