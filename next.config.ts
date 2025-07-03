import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias['@lib'] = path.resolve(__dirname, 'lib');
    return config;
  },
};

export default nextConfig;