/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Force metadata to render (blocking) in <head> for all user agents instead of
  // streaming it into the body via a hidden <Suspense> boundary. Because the app
  // is client-only (page uses dynamic ssr:false), the streamed metadata boundary
  // produced a hidden={true} vs hidden={null} hydration mismatch. Disabling
  // streaming metadata removes that internal boundary entirely.
  htmlLimitedBots: /.*/,
}

export default nextConfig
