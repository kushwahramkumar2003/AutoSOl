/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "raw.githubusercontent.com",
      "cdn.jsdelivr.net",
      "arweave.net",
      "cryptologos.cc",
      "quei6zhlcfsxdn7bhjrpb6xafcivmntfzkthwcnycx25wzdwj5qa.arweave.net",
      "s2.coinmarketcap.com",
      "static.jup.ag",
      "backpack.app",
      "bafkreibk3covs5ltyqxa272uodhculbgn2zm52cx7i6laqnhxhutifssfy.ipfs.nftstorage.link",
    ],
  },
};

export default nextConfig;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
