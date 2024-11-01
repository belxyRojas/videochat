const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

const socket = io(); // Conexión a socket.io
let localStream;
let remoteStream;
let peerConnection;
const configuration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // Servidor STUN de Google
    ],
};

// Función para iniciar la transmisión de medios locales
async function startMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    createPeerConnection();
}

// Función para configurar la conexión RTCPeerConnection
function createPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Agregar el stream local al peerConnection
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });

    // Maneja los eventos cuando se recibe una pista remota
    peerConnection.ontrack = (event) => {
        [remoteStream] = event.streams;
        remoteVideo.srcObject = remoteStream;
    };

    // Envía los candidatos ICE al otro usuario
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    };
}

// Función para iniciar una llamada (envía una oferta)
async function makeCall() {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);
}

// Función para recibir una oferta y responder
async function handleOffer(offer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', answer);
}

// Función para manejar la respuesta
async function handleAnswer(answer) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}

// Función para agregar candidatos ICE recibidos
function handleCandidate(candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

// Event Listeners de señalización
socket.on('offer', handleOffer);
socket.on('answer', handleAnswer);
socket.on('candidate', handleCandidate);

// Llama a startMedia al cargar la página para configurar la transmisión
startMedia();
