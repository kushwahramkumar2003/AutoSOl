/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "raw.githubusercontent.com",
      "cdn.jsdelivr.net",
      "arweave.net",
      "cryptologos.cc",
    ],
  },
};

export default nextConfig;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
