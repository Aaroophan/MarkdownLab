/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/MarkdownLab',
  assetPrefix: '/MarkdownLab/',
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
