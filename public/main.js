const socket = io("https://videochat-production.up.railway.app/"); // Cambia a la URL de tu servidor

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;
let peerConnection;
const roomName = "room1"; // Puedes cambiar esto para diferentes salas

// Solicitar acceso a la cámara y micrófono
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream;
        socket.emit('join', roomName); // Unirse a la sala
    })
    .catch(error => {
        console.error("Error accediendo a la cámara y micrófono:", error);
    });

// Iniciar la llamada
function makeCall() {
    peerConnection = new RTCPeerConnection();

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', {
                room: roomName,
                signal: event.candidate,
            });
        }
    };

    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            socket.emit('signal', {
                room: roomName,
                signal: peerConnection.localDescription,
            });
        });
}

// Manejo de señales entrantes
socket.on('signal', data => {
    if (data.signal && data.sender !== socket.id) {
        if (data.signal.type === 'offer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal))
                .then(() => {
                    return peerConnection.createAnswer();
                })
                .then(answer => {
                    return peerConnection.setLocalDescription(answer);
                })
                .then(() => {
                    socket.emit('signal', {
                        room: roomName,
                        signal: peerConnection.localDescription,
                    });
                });
        } else if (data.signal.type === 'answer') {
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else {
            peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
        }
    }
});
