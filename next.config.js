/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.externals = config.externals.map(external => {
                if (typeof external !== 'function') return external;
                return (ctx, req, cb) => (req.endsWith('.node') ? cb() : external(ctx, req, cb));
            });
        }
        return config;
    },
}

module.exports = nextConfig
