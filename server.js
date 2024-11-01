const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // Sirve archivos estáticos desde la carpeta 'public'

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    // Escucha y reenvía la oferta de conexión
    socket.on('offer', (offer) => {
        socket.broadcast.emit('offer', offer);
    });

    // Escucha y reenvía la respuesta a la oferta
    socket.on('answer', (answer) => {
        socket.broadcast.emit('answer', answer);
    });

    // Escucha y reenvía los candidatos ICE
    socket.on('candidate', (candidate) => {
        socket.broadcast.emit('candidate', candidate);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

const port = process.env.PORT || 8080; // O 3000, dependiendo de lo que hayas configurado
server.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
