const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de conexiones de socket
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`${socket.id} se unió a la sala ${room}`);
    });

    socket.on('signal', (data) => {
        // Reenviar señales a los demás clientes en la sala
        socket.to(data.room).emit('signal', {
            signal: data.signal,
            sender: socket.id,
        });
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
