const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos
app.use(express.static('public'));

// Manejo de conexiones de socket.io
io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado');

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`Usuario se unió a la sala: ${room}`);
    });

    socket.on('signal', (data) => {
        socket.to(data.room).emit('signal', {
            signal: data.signal,
            sender: socket.id,
        });
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Iniciar el servidor
const port = process.env.PORT || 8080;
server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
