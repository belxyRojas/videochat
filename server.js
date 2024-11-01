const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Asegúrate de que tu carpeta está correctamente configurada

io.on('connection', (socket) => {
    console.log('Nuevo usuario conectado:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`${socket.id} se unió a la sala ${room}`);
    });

    socket.on('signal', (data) => {
        socket.to(data.room).emit('signal', {
            signal: data.signal,
            sender: socket.id,
        });
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
