/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  reactStrictMode: false,
  images: {
    domains: ["localhost"],
    remotePatterns: [
      {
        hostname: "profile.intra.42.fr",
        protocol: "https",
      },
      {
        hostname: "cdn.intra.42.fr",
        protocol: "https",
      },
      {
        hostname: "www.gravatar.com",
        protocol: "https",
      },
      {
        hostname: "avatar.iran.liara.run",
        protocol: "https",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/image/**", // to update
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://127.0.0.1/api/:path*", // Proxy to Backend
      },
    ];
  },
  // output: 'export',
};

export default nextConfig;
