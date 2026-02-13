/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  instrumentationHook: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
