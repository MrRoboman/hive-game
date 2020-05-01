var PORT = process.env.PORT || 3000
var express = require('express')
var path = require('path')
const uuidv4 = require('uuid/v4')

var app = express()
var server = app.listen(PORT)

app.use(express.static('public'))

var socket = require('socket.io')
var io = socket(server)

const hive = require('./public/hive')

hive.resetGame()

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
        socket.emit('gameState', getGameState())
    })

    socket.on('move', ({ fromSpaceIndex, toSpaceIndex }) => {
        console.log('move', fromSpaceIndex, toSpaceIndex)
        const fromSpace = hive.getSpace(fromSpaceIndex)
        const toSpace = hive.getSpace(toSpaceIndex)
        console.log('isValidMove', hive.isValidMove(fromSpace, toSpace))
        if (hive.isValidMove(fromSpace, toSpace)) {
            hive.movePiece(fromSpace, toSpace)
            socket.broadcast.emit('gameState', getGameState())
        }
    })

    socket.on('reset', () => {
        hive.resetGame()
        console.log('broadcast!')
        io.emit('gameState', getGameState())
    })

    socket.on('disconnect', (data) => {
        disconnectPlayer(socket)
    })
})

function getGameState() {
    return hive.getSpaces().map(({ index, pieces }) => ({
        index,
        pieces,
    }))
}
