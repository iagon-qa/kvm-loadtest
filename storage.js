const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const diskUsage = require('diskusage'); // Import diskusage package

// Function to spawn random processes
function spawnProcesses() {
    for (let i = 0; i < 1; i++) {
        try {
            exec('node -e "setInterval(() => {}, 1000)"');
        } catch (err) {
            console.error('Error spawning process:', err);
        }
    }
}

// Function to write continuously to disk
function writeToDisk() {
    const filePath = path.join( './testfile');
    const stream = fs.createWriteStream(filePath, { flags: 'a' });

    stream.on('error', (err) => {
        if (err.code === 'ENOSPC') {
            console.error('No space left on device, write failed');
        } else {
            console.error('Error writing to disk:', err);
        }
    });

    setInterval(() => {
        try {
            stream.write(Buffer.alloc(1024*1024*500, '0')); // Write 0.5 GB of data
        } catch (err) {
            console.error('Error writing to disk:', err);
        }
    }, 1000);
}

// Function to use RAM continuously
function useRam() {
    const data = [];
    setInterval(() => {
        try {
            data.push(Buffer.alloc(1024, '0')); // Allocate 1 KB of RAM
        } catch (err) {
            console.error('Error using RAM:', err);
        }
    }, 1000);
}

// Function to get CPU usage
function getCpuUsage() {
    return new Promise((resolve) => {
        try {
            exec("top -bn1 | grep 'Cpu(s)'", (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    resolve(0); // Default to 0 if there's an error
                } else {
                    const usage = stdout.match(/\d+\.\d+/g);
                    const cpuUsage = usage ? parseFloat(usage[0]) : 0;
                    resolve(cpuUsage);
                }
            });
        } catch (err) {
            console.error('Error getting CPU usage:', err);
            resolve(0); // Default to 0 if there's an error
        }
    });
}

// Function to get RAM usage
function getRamUsage() {
    try {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return usedMemory / 1024; // Convert to MB
    } catch (err) {
        console.error('Error getting RAM usage:', err);
        return 0; // Default to 0 if there's an error
    }
}

// Function to get Disk usage
function getDiskUsage() {
    return new Promise((resolve) => {
        try {
            diskUsage.check('/', (err, info) => {
                if (err) {
                    console.error('Error getting disk usage:', err);
                    resolve(0); // Default to 0 if there's an error
                } else {
                    resolve(info.total - info.available); // Used disk space in bytes
                }
            });
        } catch (err) {
            console.error('Error getting disk usage:', err);
            resolve(0); // Default to 0 if there's an error
        }
    });
}

// Function to send consumption data to webhook
async function sendConsumptionData() {
    const url = 'https://webhook.site/939b3659-be38-48c7-bd45-e83ddeaa0521';

    setInterval(async () => {
        try {
            const cpuUsage = await getCpuUsage();
            const ramUsage = getRamUsage();
            const diskUsage = await getDiskUsage();

            const data = {
                CPU: `${cpuUsage.toFixed(2)}%`,
                RAM: `${ramUsage.toFixed(2)} MB`,
                Storage: `${(diskUsage / 1024).toFixed(2)} MB` // Convert to MB
            };

            await axios.post(url, data);
            console.log('Data sent successfully', data);
        } catch (error) {
            console.error('Error sending data:', error);
        }
    }, 30000);
}

// Start all tasks
sendConsumptionData();
//spawnProcesses();
writeToDisk();
//useRam();
