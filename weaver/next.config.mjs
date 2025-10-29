import { withWorkflow } from 'workflow/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static optimization to allow workflow server
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default withWorkflow(nextConfig);
