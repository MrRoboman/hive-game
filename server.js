var PORT = process.env.PORT || 3000
var express = require('express')
var path = require('path')

var app = express()
var server = app.listen(PORT)

app.use(express.static('public'))

var socket = require('socket.io')
var io = socket(server)

io.sockets.on('connection', socket => {
    socket.emit('hello', 'world')
})
