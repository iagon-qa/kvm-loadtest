const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const diskUsage = require('diskusage'); // Import diskusage package

// Function to spawn a process that uses a small amount of CPU
function spawnProcess() {
    try {
        exec('node -e "setInterval(() => {}, 1000)"');
    } catch (err) {
        console.error('Error spawning process:', err);
    }
}

// Function to write continuously to disk
function writeToDisk(sizeMB) {
    const uniqueFileName = `testfile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.txt`;
    const filePath = path.join('./', uniqueFileName);
    const stream = fs.createWriteStream(filePath, { flags: 'a' });

    stream.on('error', (err) => {
        if (err.code === 'ENOSPC') {
            console.error('No space left on device, write failed');
        } else {
            console.error('Error writing to disk:', err);
        }
    });

    const bufferSize = sizeMB * 1024 * 1024; // Size in bytes
    const buffer = Buffer.alloc(bufferSize, '0');

    stream.write(buffer, (err) => {
        if (err) {
            console.error('Error writing to disk:', err);
        } else {
            console.log(`${sizeMB} MB written to disk in file ${uniqueFileName}`);
        }
    });
}

// Function to use RAM
function useRam(sizeMB) {
    const data = [];
    const bufferSize = sizeMB * 1024 * 1024; // Size in bytes

    try {
        data.push(Buffer.alloc(bufferSize, '0')); // Allocate memory
        console.log(`${sizeMB} MB RAM used`);
    } catch (err) {
        console.error('Error using RAM:', err);
    }
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
        return usedMemory / (1024 * 1024); // Convert to MB
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
                    resolve((info.total - info.available) / (1024 * 1024)); // Used disk space in MB
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
    const url = 'https://prickly-solstice-13.webhook.cool';

    try {
        const cpuUsage = await getCpuUsage();
        const ramUsage = getRamUsage();
        const diskUsage = await getDiskUsage();

        const data = {
            CPU: `${cpuUsage.toFixed(2)}%`,
            RAM: `${ramUsage.toFixed(2)} MB`,
            Storage: `${diskUsage.toFixed(2)} MB`
        };

        await axios.post(url, data);
        console.log('Data sent successfully', data);
    } catch (error) {
        console.error('Error sending data:', error);
    }
}

// Start all tasks in intervals
function startTasks() {
    let iteration = 1;

    setInterval(() => {
        const sizeMB = 50 * iteration;
        spawnProcess();
        useRam(sizeMB);
        writeToDisk(sizeMB * 10);
        sendConsumptionData();

        iteration += 1;
    }, 1800000); // 30 minutes interval
}

startTasks();
