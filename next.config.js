/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Add the node-loader configuration
        config.module.rules.push({
            test: /\.node$/,
            use: 'node-loader',
        });

        // Important: return the modified config
        return config;
    },
    // ... other Next.js config options
};

module.exports = nextConfig;

