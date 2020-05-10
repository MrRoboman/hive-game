var PORT = process.env.PORT || 3000
var express = require('express')
var path = require('path')
const uuidv4 = require('uuid/v4')

var app = express()
var server = app.listen(PORT)

app.use(express.static('public'))
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'))
// })

var socket = require('socket.io')
var io = socket(server)

const hive = require('./public/hive')

hive.resetGame()

const board = {}
const players = {}
const games = {}
let whitePlayer
let blackPlayer

function getGame(gameName) {
    if (!games[gameName]) {
        games[gameName] = {}
    }
    return games[gameName]
}

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

function extractGameName(socket) {
    let referer
    try {
        referer = socket.handshake.headers.referer
    } catch (e) {
        console.error('Cannot extract game name from referer')
        return null
    }

    return referer.split('/')[3]
}

io.sockets.on('connection', socket => {
    socket.emit('handshake0')
    socket.on('handshake1', uuid => {
        if (!uuid) {
            uuid = uuidv4()
            socket.emit('uuid', uuid)
        }
        socket.uuid = uuid
        // if (!getPlayer(uuid)) {
        //     createPlayer(uuid, socket)
        // }
        // console.log(uuid)
        players[socket.id] = socket
        if (!whitePlayer) {
            if (socket !== blackPlayer) {
                console.log('white')
                whitePlayer = socket
                socket.emit('color', hive.colors.WHITE)
            }
        } else if (!blackPlayer) {
            if (socket !== whitePlayer) {
                console.log('black')
                blackPlayer = socket
                socket.emit('color', hive.colors.BLACK)
            }
        }
        socket.emit('turn', hive.getTurn())
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
            io.emit('turn', hive.nextTurn())
        }
    })

    socket.on('reset', () => {
        hive.resetGame()
        whitePlayer = null
        blackPlayer = null

        Object.keys(players).forEach((socketId, i) => {
            console.log({ socketId })
            if (i === 0) {
                whitePlayer = players[socketId]
                players[socketId].emit('color', hive.colors.WHITE)
            } else if (i === 1) {
                blackPlayer = players[socketId]
                players[socketId].emit('color', hive.colors.BLACK)
            }
        })

        io.emit('gameState', getGameState())
    })

    socket.on('disconnect', data => {
        // disconnectPlayer(socket)
        delete players[socket.id]
        if (socket === whitePlayer) {
            whitePlayer = null
        }
        if (socket === blackPlayer) {
            blackPlayer = null
        }
    })
})

function getGameState() {
    return hive.getSpaces().map(({ index, pieces }) => ({
        index,
        pieces,
    }))
}
