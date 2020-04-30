var PORT = process.env.PORT || 3000
var express = require('express')
var path = require('path')
const uuidv4 = require('uuid/v4')

var app = express()
var server = app.listen(PORT)

app.use(express.static('public'))

var socket = require('socket.io')
var io = socket(server)

const hive = require('./server-hive')

hive.resetSpaces()

const board = {}
const players = {}

function createPlayer(uuid, socket) {
    players[socket] = {
        uuid,
        socket,
        isConnected: true,
    }
    return players[socket]
}
function getPlayer(uuid) {
    for (const p in players) {
        if (players[p].uuid === uuid) return players[p]
    }
    return null
}
function disconnectPlayer(socket) {
    players[socket].isConnected = false
}

io.sockets.on('connection', (socket) => {
    socket.emit('handshake0')
    socket.on('handshake1', (uuid) => {
        if (!uuid) {
            uuid = uuidv4()
            socket.emit('uuid', uuid)
        }
        if (!getPlayer(uuid)) {
            createPlayer(uuid, socket)
        }
        console.log(uuid)
    })

    socket.on('move', ({ fromSpaceIndex, toSpaceIndex }) => {
        console.log('move', fromSpaceIndex, toSpaceIndex)
        const fromSpace = hive.getSpace(fromSpaceIndex)
        const toSpace = hive.getSpace(toSpaceIndex)
        if (hive.isValidMove(fromSpace, toSpace)) {
            socket.broadcast.emit('move', { fromSpaceIndex, toSpaceIndex })
        }
    })

    socket.on('disconnect', (data) => {
        disconnectPlayer(socket)
    })
})
