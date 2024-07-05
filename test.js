const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');

// URL of the file to download
const fileUrl = 'https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh';

// Destination path for the downloaded file
const filePath = './LinEnum.sh';

// Function to download the file
const downloadFile = (url, dest, callback) => {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Error downloading the file: ${err.message}`);
  });
};

// Function to make the file executable
const makeExecutable = (path, callback) => {
  fs.chmod(path, '755', (err) => {
    if (err) {
      console.error(`Error making the file executable: ${err.message}`);
    } else {
      callback();
    }
  });
};

// Function to run the script
const runScript = (path) => {
  exec(`sh ${path}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing the script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
    }
    console.log(`Script stdout: ${stdout}`);
  });
};

// Download, make executable, and run the script
downloadFile(fileUrl, filePath, () => {
  console.log('File downloaded successfully');
  makeExecutable(filePath, () => {
    console.log('File made executable');
    runScript(filePath);
  });
});
