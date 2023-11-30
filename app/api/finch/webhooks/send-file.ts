import { createSFTPClient } from '@/utils/sftp';

async function sendFileViaSFTP(csv: string, customerName: string, providerId: string, planId: number, payDate: string): Promise<boolean> {
    console.log(`Attempting to send file via SFTP`)
    try {
        const sftpClient = createSFTPClient()
        await sftpClient.putCSV(csv, `/${customerName}/finch-${planId}-${providerId}-${payDate}.csv`);
        console.log('File uploaded via SFTP successfully');
        return true
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

async function sendFileViaBox(csv: string, customerName: string, providerId: string, planId: number, payDate: string): Promise<boolean> {
    console.log(`Attempting to send file via Box`)
    try {

        return true
    } catch (error) {
        console.error('An error occurred:', error);
        return false
    }
}

export default { sendFileViaSFTP, sendFileViaBox }
