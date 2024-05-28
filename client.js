const net = require('node:net');
const fs = require('node:fs/promises');
const path = require('node:path');

const PORT = 5000;
const HOST = '::1';

let fileHandle, fileReadStream;

socket = net.createConnection(PORT, HOST, async () => {
  const filePath = process.argv[2];
  const fileName = path.basename(filePath);
  
  fileHandle = await fs.open(filePath, 'r');
  fileReadStream = fileHandle.createReadStream();
  
  const fileSize = (await fileHandle.stat()).size;
  let bytesUploaded = 0;
  let uploadedPercentage = 0;
  
  socket.write(`fileName: ${fileName}-------`);
  await moveCursor(0, 1);

  fileReadStream.on('data', async (data) => {
    if (!socket.write(data)) {
      fileReadStream.pause();
    }
    
    bytesUploaded += data.length;
    let newPercentage = getUploadedPercentage(bytesUploaded, fileSize);
    
    if (newPercentage % 5 === 0 && newPercentage !== uploadedPercentage) {
      uploadedPercentage = newPercentage;
      await moveCursor(0, -1);
      await clearLine(0);
      console.log(progressBar(uploadedPercentage, newPercentage));
    }
    
  });
  
  socket.on('drain', () => {
    fileReadStream.resume();
  });
  
  fileReadStream.on('end', () => {
    console.log(`File ${filePath} uploaded successfully!`);
    fileHandle.close();
    fileHandle = null;
    fileReadStream = null;
    socket.end();
  });
});

function getUploadedPercentage(bytesUploaded, fileSize) {
  return Math.floor((bytesUploaded / fileSize) * 100);
}

const clearLine = (direction) => {
  // Process.stdout is a WriteStream.
  // dir = 1; clears everything to the right from cursor
  // dir = -1; clears everything to the left from cursor
  // dir = 0; clears the entire line
  
  return new Promise((resolve) => {
    process.stdout.clearLine(direction, () => {
      resolve();
    });
  });
};

const moveCursor = (dx, dy) => {
  return new Promise((resolve) => {
    process.stdout.moveCursor(dx, dy, () => {
      resolve();
    });
  });
};

function progressBar(uploadedPercentage, newPercentage) {
  let progress = '::'.repeat((uploadedPercentage / 5));
  let progressLeft = '  '.repeat(20 - (uploadedPercentage / 5));
  return `Uploaded [${progress}${progressLeft}] ${newPercentage}%`;
}
