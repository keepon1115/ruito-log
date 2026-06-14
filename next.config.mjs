/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: ffmpeg.wasm (Phase 3) needs COOP/COEP for SharedArrayBuffer. Those headers
  // are deferred to Phase 3 (scoped to the post flow + self-hosted fonts) because
  // applied globally with require-corp they block the cross-origin Google Fonts.
};

export default nextConfig;
