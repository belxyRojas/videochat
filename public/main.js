const socket = io("https://videochat-production.up.railway.app"); // Cambia a la URL de tu servidor

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
const roomName = "room1"; // Nombre de la sala

// Solicitar acceso a la cámara y micrófono
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localVideo.srcObject = stream;
        localStream = stream; // Guardar el flujo local
        socket.emit('join', roomName); // Unirse a la sala
    })
    .catch(error => {
        console.error("Error accediendo a la cámara y micrófono:", error);
    });

// Iniciar la llamada
function makeCall() {
    if (!localStream) {
        console.error("No hay flujo local disponible.");
        return; // Salir si localStream no está disponible
    }

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

    // Crear oferta
    peerConnection.createOffer()
        .then(offer => {
            return peerConnection.setLocalDescription(offer);
        })
        .then(() => {
            socket.emit('signal', {
                room: roomName,
                signal: peerConnection.localDescription,
            });
        })
        .catch(error => {
            console.error("Error creando la oferta:", error);
        });
}

// Manejo de señales entrantes
socket.on('signal', data => {
    if (data.signal && data.sender !== socket.id) {
        if (data.signal.type === 'offer') {
            // Aceptar la oferta
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
                })
                .catch(error => {
                    console.error("Error en la respuesta:", error);
                });
        } else if (data.signal.type === 'answer') {
            // Establecer la respuesta remota
            peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal))
                .catch(error => {
                    console.error("Error estableciendo la respuesta remota:", error);
                });
        } else {
            // Manejar ICE candidates
            peerConnection.addIceCandidate(new RTCIceCandidate(data.signal))
                .catch(error => {
                    console.error("Error añadiendo ICE candidate:", error);
                });
        }
    }
});
