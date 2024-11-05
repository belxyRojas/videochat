const io = require('socket.io')(server);

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('join', (roomId) => {
        socket.join(roomId);
        socket.to(roomId).emit('new-participant', socket.id);
        socket.emit('joined', roomId);
    });

    socket.on('chat-message', (data) => {
        socket.to(data.roomId).emit('chat-message', { message: data.message });
    });

    // Manejo de las señales de WebRTC (ofertas, respuestas, candidatos, etc.)
});
