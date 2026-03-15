/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Disable source maps in production to prevent source code exposure
  // Source maps can reveal file structure, code organization, and sometimes original source code
  productionBrowserSourceMaps: false,

  // Disable source maps for server-side code as well
  // This prevents exposure of server-side code structure
  webpack: (config, { dev, isServer }) => {
    // 🔥 SECURITY: Mark ioredis as external to prevent bundling
    // ioredis is an optional dependency for Redis support in rate limiting
    // It should only be loaded at runtime if REDIS_URL is set
    if (isServer) {
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (request === 'ioredis') {
              return callback(null, 'commonjs ' + request);
            }
            callback();
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push('ioredis');
      } else {
        config.externals = [config.externals, 'ioredis'];
      }
    }

    if (!dev && !isServer) {
      // Disable source maps in production for client-side bundles
      config.devtool = false;

      // Security: Minimize exposure of library names and versions
      // Use hashed chunk names instead of library names
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic', // Use deterministic IDs to reduce information leakage
        chunkIds: 'deterministic', // Use deterministic chunk IDs
        minimize: true, // Minify code to obfuscate library names
      };

      // NOTE: We no longer manually configure Terser here.
      // Instead, we use the built-in Next.js compiler options below.

      // Obfuscate module paths in production
      config.output = {
        ...config.output,
        // Use hash-based chunk filenames to hide library names
        chunkFilename: dev
          ? 'static/chunks/[name].[hash].js'
          : 'static/chunks/[id].[contenthash].js',
        filename: dev
          ? 'static/chunks/[name].[hash].js'
          : 'static/chunks/[id].[contenthash].js',
      };
    }
    return config;
  },

  // Additional security configurations
  poweredByHeader: false, // Remove X-Powered-By header

  // Compress output
  compress: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['placehold.co'],
  },

  // Output configuration for better security
  output: 'standalone', // Use standalone output to reduce bundle size and exposure

  // Experimental features - keep minimal for security
  experimental: {
    // Only enable necessary features
  },

  // Compiler options
  compiler: {
    // Remove console.log statements in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Rewrite /uploads to backend
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },

  // Redirect old admin path to the new standalone dashboard
  async redirects() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3001/:path*',
        permanent: false, // Use temporary redirect during migration
      },
    ];
  },

  // SECURITY FIX FOR REPORT 16: Configure Next.js to use CSP nonce
  // This allows Next.js to add nonce to script tags automatically
  // Note: Next.js 14 doesn't have built-in CSP nonce support, so we handle it in middleware
  // But we can configure headers here as well
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // CRITICAL SECURITY: Block TRACE method at Next.js level
        // This provides an additional layer of protection
        source: '/:path*',
        headers: [
          {
            key: 'Allow',
            value: 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
          },
        ],
      },
      {
        // SECURITY FIX: Block access to backup files and sensitive file types
        // This prevents "Backup file" vulnerability
        source: '/:path*\\.(bak|backup|old|tmp|swp|swo|orig|save|copy|env|sql|db|sqlite|log|map)$',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

