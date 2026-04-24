import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable strict mode — XMTP's WASM SDK creates persistent DB handles
  // that break when React re-runs effects in dev mode
  reactStrictMode: false,
  // Webpack config for @xmtp/browser-sdk WASM support & fixing RainbowKit/Wagmi React Native issues
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // Exclude react-native modules from build
    config.externals.push({
      'pino-pretty': 'commonjs pino-pretty',
      'lokijs': 'commonjs lokijs',
      'encoding': 'commonjs encoding',
      '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
    });
    return config;
  },
};

export default nextConfig;
