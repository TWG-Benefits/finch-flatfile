export const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
export const finchApiUrl = process.env.FINCH_API_URL ?? 'https://api.tryfinch.com'
export const sandboxApiUrl = process.env.FINCH_SANDBOX_URL ?? 'https://sandbox.tryfinch.com/api'
export const appName = process.env.APP_NAME ?? 'Acme Co.'
export const supportEmail = process.env.SUPPORT_EMAIL ?? 'developers@tryfinch.com'

export const finchProducts = process.env.FINCH_PRODUCTS ?? 'company directory individual employment payment pay_statement benefits'
export const finchRedirectUri = process.env.FINCH_REDIRECT_URI ?? baseUrl + '/api/finch/callback'
export const isFinchSandbox = process.env.IS_FINCH_SANDBOX ?? true

// Required
export const finchClientId = process.env.FINCH_CLIENT_ID ?? 'FINCH_CLIENT_ID not entered as app environment variable'
export const finchClientSecret = process.env.FINCH_CLIENT_SECRET ?? 'FINCH_CLIENT_SECRET not entered as app environment variable'
export const finchWebhookSecret = process.env.FINCH_WEBHOOK_SECRET ?? 'FINCH_WEBHOOK_SECRET not entered as app environment variable'

// Ensure all required configuration is present
// const requiredConfig = ['SFTP_HOST', 'SFTP_USERNAME'];
// for (const configKey of requiredConfig) {
//     if (!process.env[configKey]) {
//         throw new Error(`Required app configuration ${configKey} is missing.`);
//     }
// }
