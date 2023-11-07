let SFTPClient = require('ssh2-sftp-client');
import { Readable } from 'stream';


export function createSFTPClient() {
    const sftp = new SFTPClient();

    // Ensure all required configuration is present
    const requiredConfig = ['SFTP_HOST', 'SFTP_USERNAME'];
    for (const configKey of requiredConfig) {
        if (!process.env[configKey]) {
            throw new Error(`Required SFTP configuration ${configKey} is missing.`);
        }
    }

    const config = {
        host: process.env.SFTP_HOST,
        port: process.env.SFTP_PORT,
        username: process.env.SFTP_USERNAME,
        password: process.env.SFTP_PASSWORD,
        privateKey: process.env.SFTP_PRIVATE_KEY,
    };

    const connect = async () => {
        try {
            await sftp.connect(config);
        } catch (err) {
            // Since TypeScript 4.0, errors are of type 'unknown'. Therefore, you need to do a type check.
            if (err instanceof Error) {
                // Now you can access the Error properties like 'message' and 'name'
                if (err.message.includes('getaddrinfo ENOTFOUND')) {
                    throw new Error(`SFTP host ${config.host} could not be found.`);
                }
                if (err.message.includes('ECONNREFUSED')) {
                    throw new Error(`Connection to SFTP server ${config.host} was refused.`);
                }
                throw new Error(`Error connecting to SFTP server: ${err.message}`);
            } else {
                // If it's not an Error instance, you might not know what to do with it
                // and you might want to log it or throw a different error
                throw new Error('An unknown error occurred while connecting to the SFTP server.');
            }
        }
    };

    const putCSV = async (csvContent: string, remotePath: string) => {
        // Convert the CSV string to a readable stream
        const csvStream = new Readable();
        csvStream.push(csvContent); // the string you want to send
        csvStream.push(null); // indicates end-of-file basically - the end of the stream

        await connect(); // Ensure we connect before putting a file
        await sftp.put(csvStream, remotePath); // Use the stream in put method
        await sftp.end();
    };

    const put = async (localPath: string, remotePath: string) => {
        await connect(); // Ensure we connect before putting a file
        await sftp.put(localPath, remotePath);
        await sftp.end();
    };

    return { put, putCSV };
}

export default createSFTPClient
