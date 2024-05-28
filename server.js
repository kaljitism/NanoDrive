const net = require('node:net');
const fs = require('node:fs/promises');

const PORT = 5000;
const HOST = '::1';

const server = net.createServer();

server.listen(PORT, HOST, () => {
  console.log(`Server listening on`, server.address());
});

server.on('connection', socket => {
  console.log('New Connection!!');
  let fileHandle, fileWriteStream;
  
  socket.on('data', async (data) => {
    if (!fileHandle) {
      socket.pause();
      
      const dividerIndex = data.indexOf('-------');
      const fileName = data.subarray(10, dividerIndex).toString('utf8');
      
      console.log('File name:', fileName);
      
      fileHandle = await fs.open(`./serverStorage/${fileName}`, 'w');
      fileWriteStream = fileHandle.createWriteStream();
      
      fileWriteStream.write(data.subarray(dividerIndex + 7));
      
      socket.resume();
      fileWriteStream.on('drain', () => {
        socket.resume();
      });
      
    } else {
      if (!fileWriteStream.write(data)) socket.pause();
    }
  });
  
  socket.on('error', error => {
    console.error('Error:', error);
    socket.end();
  });
  
  socket.on('end', () => {
    console.log('Connection ended!');
    if (fileHandle) fileHandle.close();
    fileHandle = undefined;
    fileWriteStream = undefined;
  });
});
