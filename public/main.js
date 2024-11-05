const socket = io.connect("https://videochat-production.up.railway.app/"); // URL de tu servidor en Railway
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const roomIdInput = document.getElementById('roomId');
const joinButton = document.getElementById('joinButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

let localStream;
let peerConnection;
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: 'turn:relay.metered.ca:80',
            username: 'public',
            credential: 'public'
        }
    ]
};

joinButton.onclick = async () => {
    const roomId = roomIdInput.value || "room1";
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
