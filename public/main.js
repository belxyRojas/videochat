const socket = io.connect("https://videochat-production.up.railway.app/"); // URL de tu servidor en Railway
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const joinButton = document.getElementById('joinButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const chatInput = document.getElementById('chatInput');
const sendChatButton = document.getElementById('sendChatButton');
const chatMessages = document.getElementById('chatMessages');

let localStream;
let peerConnection;
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: "turn:global.turn.twilio.com:3478?transport=tcp",
            username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269" ,
            credential:  "tE2DajzSJwnsSbc123"
        }
    ]
};

// Unirse a la sala
joinButton.onclick = async () => {
    const roomId = "room1";  // Usamos room1 como ID predeterminado
    await joinRoom(roomId);
};

async function joinRoom(roomId) {
    socket.emit('join', roomId);
}

// Configuración de WebRTC y eventos de sala
socket.on('joined', async (roomId) => {
    console.log(`Te has unido a la sala: ${roomId}`);
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    callButton.disabled = false;
});

socket.on('new-participant', (socketId) => {
    console.log(`Nuevo participante: ${socketId}`);
    callButton.onclick = () => makeCall(socketId);
});

async function makeCall(socketId) {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { candidate: event.candidate, to: socketId });
        }
    };

    peerConnection.onaddstream = (event) => {
        remoteVideo.srcObject = event.stream;
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { offer: offer, to: socketId });

    callButton.disabled = true;
    hangupButton.disabled = false;
}

socket.on('offer', async (data) => {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.addStream(localStream);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', { candidate: event.candidate, to: data.from });
        }
    };

    peerConnection.onaddstream = (event) => {
        remoteVideo.srcObject = event.stream;
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
    callButton.disabled = false;
    hangupButton.disabled = true;
};

// Chat de texto
sendChatButton.onclick = () => {
    const message = chatInput.value;
    if (message.trim()) {
        socket.emit('message', message); // Envía el mensaje al servidor
        chatInput.value = '';
        addMessageToChat("Yo: " + message); // Muestra el mensaje en tu propio chat
    }
};

socket.on('message', (data) => {
    addMessageToChat(data); // Muestra el mensaje recibido
});

function addMessageToChat(message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
}
