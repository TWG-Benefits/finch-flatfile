import { NextResponse } from "next/server";
import { createSFTPClient } from '@/utils/sftp';
import moment from "moment";

const sftpPath = process.env.SFTP_PATH
const testSftpKey = process.env.TEST_SFTP_KEY

export async function POST(req: Request) {
    console.log(req.method + " /api/finch/test-sftp");

    const { test_sftp_key } = await req.json()
    const csv = `
    ID,Name,Department
    1,John Doe,Finance
    2,Jane Smith,Marketing
    3,Emily Johnson,Human Resources
    4,Michael Brown,IT
    `

    try {
        if (test_sftp_key == testSftpKey) {
            console.log("Sending CSV file to SFTP")
            const sftpClient = createSFTPClient()
            await sftpClient.putCSV(csv, `${sftpPath}/finch-test-${moment().format('YYYY-MM-DD')}.csv`);
            console.log('File uploaded via SFTP successfully');

            return new NextResponse(
                JSON.stringify({ ok: true })
            )

        }


    } catch (error) {
        console.error('An error occurred:', error);
        return new NextResponse(
            JSON.stringify({ ok: false })
        )

    }





}
