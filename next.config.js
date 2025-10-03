/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking is done separately in CI
    ignoreBuildErrors: false,
  },
  eslint: {
    // ESLint is run separately in CI
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig