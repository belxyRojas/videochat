const socket = io.connect("https://videochat-production.up.railway.app/"); // Reemplaza con tu URL de Railway
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomIdInput = document.getElementById('roomId');
const joinButton = document.getElementById('joinButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');
const chatBox = document.getElementById('chatBox');

let localStream;
let peerConnection;
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

joinButton.onclick = async () => {
    const roomId = roomIdInput.value || "room1"; // Usa "room1" si no se proporciona un ID
    await joinRoom(roomId);
};

async function joinRoom(roomId) {
    socket.emit('join', roomId);
}

socket.on('joined', async (roomId) => {
    console.log(`Te has unido a la sala: ${roomId}`);
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    callButton.disabled = false; // Habilita el botón de iniciar llamada
});

socket.on('new-participant', (socketId) => {
    console.log(`Nuevo participante: ${socketId}`);
    callButton.onclick = () => makeCall(socketId);
});

// Función para iniciar una llamada
async function makeCall(socketId) {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { candidate: event.candidate, to: socketId });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer: offer, to: socketId });

    callButton.disabled = true; // Deshabilita el botón de iniciar llamada después de hacer la llamada
    hangupButton.disabled = false; // Habilita el botón de colgar
}

// Manejo de la oferta y respuesta de WebRTC
socket.on('offer', async (data) => {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { candidate: event.candidate, to: data.from });
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer: answer, to: data.from });
});

socket.on('answer', (data) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('candidate', (data) => {
    const candidate = new RTCIceCandidate(data.candidate);
    peerConnection.addIceCandidate(candidate);
});

// Funcionalidad de colgar llamada
hangupButton.onclick = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    callButton.disabled = false; // Habilita el botón de iniciar llamada
    hangupButton.disabled = true; // Deshabilita el botón de colgar
};

// Funcionalidad del chat
sendChatButton.onclick = () => {
    const message = chatInput.value;
    if (message) {
        socket.emit('chat-message', { message: message, roomId: roomIdInput.value });
        chatInput.value = ''; // Limpia el campo de entrada
    }
};

socket.on('chat-message', (data) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = data.message;
    chatBox.appendChild(messageElement);
});
