/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // necessary for ssh2-sftp-client
        config.module.rules.push({
            test: /\.node$/,
            use: 'node-loader',
        });

        // Important: return the modified config
        return config;
    },
};

module.exports = nextConfig;

