/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow remote evidence/infobox images from any host (URL-only attachments for MVP).
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
