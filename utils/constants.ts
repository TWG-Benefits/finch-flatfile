// yyyy-mm-dd, including leap years
export const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/

export const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000'
export const finchApiUrl = process.env.FINCH_API_URL ?? 'https://api.tryfinch.com'
export const sandboxApiUrl = process.env.FINCH_SANDBOX_URL ?? 'https://sandbox.tryfinch.com/api'
export const appName = process.env.APP_NAME ?? 'Acme Co.'
export const supportEmail = process.env.SUPPORT_EMAIL ?? 'developers@tryfinch.com'
export const startDateForData = isValidDateFormat(process.env.START_DATA_FOR_DATA?.toString()) ? process.env.START_DATA_FOR_DATA : null

export const finchProducts = process.env.FINCH_PRODUCTS ?? 'company directory individual employment payment pay_statement benefits ssn'
export const finchRedirectUri = process.env.FINCH_REDIRECT_URI ?? baseUrl + '/api/finch/callback'
export const isFinchSandbox = process.env.IS_FINCH_SANDBOX ?? true

// Required
export const finchClientId = process.env.FINCH_CLIENT_ID ?? 'FINCH_CLIENT_ID not entered as app environment variable'
export const finchClientSecret = process.env.FINCH_CLIENT_SECRET ?? 'FINCH_CLIENT_SECRET not entered as app environment variable'
export const finchWebhookSecret = process.env.FINCH_WEBHOOK_SECRET ?? 'FINCH_WEBHOOK_SECRET not entered as app environment variable'

// TODO: check for all required environment variables
// Ensure all required configuration is present
// const requiredConfig = ['SFTP_HOST', 'SFTP_USERNAME'];
// for (const configKey of requiredConfig) {
//     if (!process.env[configKey]) {
//         throw new Error(`Required app configuration ${configKey} is missing.`);
//     }
// }

function isValidDateFormat(dateString: string | undefined): boolean {
    if (!dateString)
        return false

    // yyyy-mm-dd, including leap years
    const dateRegex = /^(?:(?:1[6-9]|[2-9]\d)?\d{2})(?:(?:(\/|-|\.)(?:0?[13578]|1[02])\1(?:31))|(?:(\/|-|\.)(?:0?[13-9]|1[0-2])\2(?:29|30)))$|^(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(\/|-|\.)0?2\3(?:29)$|^(?:(?:1[6-9]|[2-9]\d)?\d{2})(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:0?[1-9]|1\d|2[0-8])$/
    return dateRegex.test(dateString);
}
