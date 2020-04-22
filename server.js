var PORT = process.env.PORT || 3000
var express = require('express')
var path = require('path')
const uuidv4 = require('uuid')

var app = express()
var server = app.listen(PORT)

app.use(express.static('public'))

var socket = require('socket.io')
var io = socket(server)

const games = {}
const players = {}
function createPlayer(uuid, socket) {
    players[uuid] = {
        uuid,
        socket,
        isConnected: true,
    }
    return players[uuid]
}
function getPlayer(uuid) {
    return players[uuid]
}

function getGame(game) {
    return games[game]
}

io.sockets.on('connection', (socket) => {
    socket.emit('handshake0')
    socket.on('handshake1', (uuid, game) => {
        if (!uuid) {
            uuid = uuidv4()
            socket.emit('uuid', uuid)
        }
        if (!getPlayer(uuid)) {
            createPlayer(uuid, socket)
        }
        if (getGame(game)) {
            // do stuff
        }
        console.log(uuid, game)
    })

    socket.on('disconnect', data => {
        console.log('disconnect', data)
    })
})
