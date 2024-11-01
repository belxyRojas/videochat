const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado: ' + socket.id);

    socket.on('join', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('new-participant', socket.id);
        socket.emit('joined', roomId);
    });

    socket.on('offer', (data) => {
        socket.to(data.to).emit('offer', { offer: data.offer, from: socket.id });
    });

    socket.on('answer', (data) => {
        socket.to(data.to).emit('answer', { answer: data.answer });
    });

    socket.on('candidate', (data) => {
        socket.to(data.to).emit('candidate', { candidate: data.candidate });
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
