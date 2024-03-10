/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        hostname: "profile.intra.42.fr",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
