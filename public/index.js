const socket = io('http://localhost:3000')
const params = new URLSearchParams(window.location.search)

function getUuid() {
    return localStorage.getItem('uuid')
}

function setUuid(uuid) {
    localStorage.setItem('uuid', uuid)
}

function getGame() {
    return params.get('h')
}

socket.on('handshake0', () => {
    socket.emit('handshake1', getUuid(), getGame())
})

socket.on('uuid', uuid => {
    setUuid(uuid)
})

