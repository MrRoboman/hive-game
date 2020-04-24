const socket = io()
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
    socket.emit('handshake1', getUuid())
})

socket.on('uuid', uuid => {
    setUuid(uuid)
})

let images

let orientation
let startDragOrientation
let mouseStartDragPos

const radius = 40

let players

let selected = null

const BEE = 0
const BEETLE = 1
const SPIDER = 2
const GRASSHOPPER = 3
const ANT = 4
const PIECES_TYPES = [BEE, BEETLE, SPIDER, GRASSHOPPER, ANT]
const STARTING_PIECE_COUNTS = {
    [BEE]: 1,
    [BEETLE]: 2,
    [SPIDER]: 2,
    [GRASSHOPPER]: 3,
    [ANT]: 3,
}

let turn
const WHITE = 240
const BLACK = 15
const colorNames = {
    [WHITE]: 'White',
    [BLACK]: 'Black',
}

const TOP = 0
const BOTTOM = 1

function preload() {
    images = [
        loadImage('./assets/hive_bee.png'),
        loadImage('./assets/hive_beetle.png'),
        loadImage('./assets/hive_spider.png'),
        loadImage('./assets/hive_grasshopper.png'),
        loadImage('./assets/hive_ant.png'),
    ]
}

function setup() {
    createCanvas(windowWidth, windowHeight)
    orientation = createVector(width / 2, height / 2)

    reset()
}

function draw() {
    dragScreen()
    background(100)

    drawBoardPieces()
    drawAvailableSpaces()
    drawPlayerPieces()
    drawSelectionHex()

    // noLoop()
}

function reset() {
    createPlayers()
    createBoard()
    turn = WHITE
}

function nextTurn() {
    // Check to see if player can actually make move.
    turn = turn === WHITE ? BLACK : WHITE
}

function stringIndexToTuple(index) {
    if (typeof index === 'string') {
        return index.split(',').map(i => parseInt(i))
    }
    return index
}

function safeIndex(i) {
    while (i >= 6) i -= 6
    while (i < 0) i += 6
    return i
}

function dragScreen() {
    if (mouseIsPressed) {
        let mousePos = createVector(mouseX, mouseY)
        if (!mouseStartDragPos) {
            mouseStartDragPos = mousePos.copy()
            startDragOrientation = orientation
        }

        mousePos.sub(mouseStartDragPos)
        orientation = p5.Vector.add(startDragOrientation, mousePos)
    } else {
        mouseStartDragPos = null
    }
}

function createPlayers() {
    players = {
        [BLACK]: createPlayerSpaces(BLACK, TOP),
        [WHITE]: createPlayerSpaces(WHITE, BOTTOM),
    }
}

function createPlayerSpaces(color, side) {
    return PIECES_TYPES.map((type) => {
        const pos = createPlayerSpacePosition(side, type)
        const pieces = []
        let numPieces = STARTING_PIECE_COUNTS[type]
        while (numPieces--) {
            pieces.push({ color, type })
        }
        return createSpace(pos, pieces)
    })
}

function createPlayerSpacePosition(side, type) {
    const typesCount = PIECES_TYPES.length
    const halfTypesCount = typesCount / 2
    const x = width / 2 - radius * typesCount + radius * halfTypesCount * type
    const y = side === TOP ? radius * 1.2 : height - radius * 1.2
    return createVector(x, y)
}

function createSpace(pos, pieces = []) {
    return {
        pos,
        pieces,
        index: null,
        isOnBoard: false,
        isAvailable: false,
        get pieceCount() {
            return this.pieces.length
        },
        get piece() {
            if (this.pieceCount) {
                return this.pieces[this.pieceCount - 1]
            }
        },
        get color() {
            return this.piece && this.piece.color
        },
        get type() {
            return this.piece && this.piece.type
        },
    }
}

function createBoard() {
    board = {}
    createBoardSpace([0, 0])

    // Dev
    // setPiece({ color: WHITE, type: SPIDER }, getBoardSpace([0, 0]))
    // setPiece({ color: BLACK, type: SPIDER }, getBoardSpace([1, 0]))
    // setPiece({ color: BLACK, type: SPIDER }, getBoardSpace([1, -1]))
}

function createBoardSpace(index) {
    index = stringIndexToTuple(index)
    if (!board[index]) {
        const pos = createBoardSpacePos(index)
        board[index] = createSpace(pos)
        board[index].index = index
        board[index].isOnBoard = true
    }
}

function createBoardSpacePos(index) {
    index = stringIndexToTuple(index)
    const x = cos(PI / 6) * radius * 2 * index[0]
    const y =
        radius * 2 * index[1] +
        (index[0] % 2 === 0 ? 0 : sin(PI / 6) * radius * 2)
    return createVector(x, y)
}

function getAllSpaces() {
    return Object.values(board)
}

function getAvailableSpaces() {
    return getAllSpaces().filter((space) => space.isAvailable)
}

function getAllSpacesWithPieces() {
    return getAllPlayerSpaces().concat(getAllBoardSpacesWithPieces())
}

function getAllPlayerSpaces() {
    return Object.values(players).flat()
}

function getAllPlayerSpacesWithPieces() {
    return getAllPlayerSpaces().filter((space) => space.piece)
}

function getAllBoardSpacesWithPieces() {
    return getAllSpaces().filter((space) => space.piece)
}

function getBoardSpace(index) {
    if (!board[index]) {
        createBoardSpace(index)
    }
    return board[index]
}

function getNeighbors(index) {
    const [x, y] = index
    const neighbors = []
    neighbors.push(getBoardSpace([x, y - 1]))
    if (x % 2 === 0) {
        neighbors.push(getBoardSpace([x + 1, y - 1]))
        neighbors.push(getBoardSpace([x + 1, y]))
    } else {
        neighbors.push(getBoardSpace([x + 1, y]))
        neighbors.push(getBoardSpace([x + 1, y + 1]))
    }
    neighbors.push(getBoardSpace([x, y + 1]))
    if (x % 2 === 0) {
        neighbors.push(getBoardSpace([x - 1, y]))
        neighbors.push(getBoardSpace([x - 1, y - 1]))
    } else {
        neighbors.push(getBoardSpace([x - 1, y + 1]))
        neighbors.push(getBoardSpace([x - 1, y]))
    }
    return neighbors
}

function getNeighborhood(spaces) {
    const neighborsOfSpaces = spaces.reduce(
        (neighbors, space) => [...neighbors, ...getNeighbors(space.index)],
        []
    )
    return Array.from(new Set(neighborsOfSpaces))
}

function getBoardSpacesByPieceAttributes({ color, type }) {
    return getAllBoardSpacesWithPieces().filter((space) => {
        const isCorrectColor = color === undefined || space.color === color
        const isCorrectType = type === undefined || space.type === type
        return isCorrectColor && isCorrectType
    })
}

function drawPiece(piece, pos, rad) {
    fill(piece.color)
    noStroke()
    drawHexagon(pos, rad)
    drawBug(piece.type, pos, rad)
}

function drawPlayerPieces() {
    getAllPlayerSpacesWithPieces().forEach(({ piece, pos, pieceCount }) => {
        drawPiece(piece, pos, radius)
        const x = pos.x + radius * 0.8
        const y = pos.y + radius * 0.8 * -0.7
        noStroke()
        text(pieceCount, x, y)
    })
}

function drawBoardPieces() {
    getAllBoardSpacesWithPieces().forEach(({ piece, pos }) =>
        drawPiece(piece, getOrientPosition(pos), radius)
    )
}

function drawAvailableSpaces() {
    availableStroke()
    getAvailableSpaces().forEach((space) =>
        drawHexagon(p5.Vector.add(space.pos, orientation), radius)
    )
}

function drawSelectionHex() {
    if (selected) {
        const pos = selected.isOnBoard
            ? getOrientPosition(selected.pos)
            : selected.pos
        selectedStroke()
        drawHexagon(pos, radius)
    }
}

function drawHexagon(pos, r) {
    beginShape()
    for (let i = 0; i <= 6; i++) {
        const angle = (PI / 3) * i
        const x = pos.x + cos(angle) * r
        const y = pos.y + sin(angle) * r
        vertex(x, y)
    }
    endShape()
}

function drawBug(type, pos, r) {
    const size = r * 1.3
    image(images[type], pos.x - size / 2, pos.y - size / 2, size, size)
}

function selectedStroke() {
    noFill()
    stroke(0, 0, 255)
    strokeWeight(4)
}

function availableStroke() {
    noFill()
    stroke(0, 255, 0)
    strokeWeight(4)
}

function getOrientPosition(pos) {
    return p5.Vector.add(pos, orientation)
}

function didClickSpace(clickPos, pos) {
    // Radius???
    return clickPos.dist(pos) <= radius
}

function selectSpace(space) {
    if (space === selected) {
        selected = null
    } else {
        selected = space
    }
}

function unselectSpace() {
    selected = null
}

function clearAvailableSpaces() {
    getAllSpaces().forEach((space) => (space.isAvailable = false))
}

function getOtherColor(color) {
    return color === WHITE ? BLACK : WHITE
}

function splitSpacesByColor(spaces, color) {
    const myColorSpaces = []
    const theirColorSpaces = []
    spaces.forEach((space) => {
        if (space.color === selected.color) {
            myColorSpaces.push(space)
        } else {
            theirColorSpaces.push(space)
        }
    })
    return [myColorSpaces, theirColorSpaces]
}

function getEmptyNeighborsOfColorExclusive(color) {
    const spacesWithPieces = getAllBoardSpacesWithPieces()
    const [mySpaces, theirSpaces] = splitSpacesByColor(spacesWithPieces, color)
    const myNeighbors = getNeighborhood(mySpaces)
    const theirNeighbors = getNeighborhood(theirSpaces)
    const emptyNeighborsOfColor = myNeighbors.filter((space) => {
        const isEmpty = !space.piece
        const notTouchingOtherColor = !theirNeighbors.includes(space)
        return isEmpty && notTouchingOtherColor
    })
    return emptyNeighborsOfColor
}

function showAvailableSpaces() {
    clearAvailableSpaces()
    if (selected) {
        const spaces = getAllBoardSpacesWithPieces()
        if (spaces.length === 0) {
            setAvailable([getBoardSpace([0, 0])])
        } else if (spaces.length === 1) {
            // BUG: If beetles are stacked so that only one space has pieces, this condition is true
            setAvailable(getNeighbors([0, 0]))
        } else {
            setAvailable(getEmptyNeighborsOfColorExclusive(selected.color))
        }
    }
}

function setAvailable(pieces) {
    pieces.forEach((piece) => (piece.isAvailable = true))
}

function removePiece(space) {
    return space.pieces.pop()
}

function setPiece(piece, space) {
    space.pieces.push(piece)
}

function movePiece(fromSpace, toSpace) {
    const piece = removePiece(fromSpace)
    setPiece(piece, toSpace)
}

function isMyTurn(color) {
    return true
    return color === turn
}

function getNeighborsWithPieces(index) {
    return getNeighbors(index).filter((neighbor) => neighbor.piece)
}

function getAllAdjacentSpacesWithPieces(space, seen = new Set()) {
    if (seen.has(space)) return
    seen.add(space)
    getNeighborsWithPieces(space.index).forEach((neighbor) =>
        getAllAdjacentSpacesWithPieces(neighbor, seen)
    )
    return Array.from(seen)
}

function wouldBreakOneHive(space) {
    const piece = removePiece(space)
    const boardPieces = getAllBoardSpacesWithPieces()
    if (boardPieces.length === 0) {
        setPiece(piece, space)
        return true
    }
    const adjacentPieces = getAllAdjacentSpacesWithPieces(boardPieces[0])
    setPiece(piece, space)
    return boardPieces.length !== adjacentPieces.length
}

function mustPlayQueen({ color, type }) {
    const queenHasNotBeenPlayed =
        getBoardSpacesByPieceAttributes({ color, type: BEE }).length === 0
    const threePiecesHaveBeenPlayed =
        getBoardSpacesByPieceAttributes({ color }).length === 3
    const notCurrentlyPlayingQueen = type !== BEE
    return (
        queenHasNotBeenPlayed &&
        threePiecesHaveBeenPlayed &&
        notCurrentlyPlayingQueen
    )
}

function isSurrounded(space) {
    return getNeighborsWithPieces(space.index).length === 6
}

function checkForWin() {
    const bees = getBoardSpacesByPieceAttributes({ type: BEE })
    bees.forEach((bee) => {
        if (isSurrounded(bee)) {
            const otherColor = getOtherColor(bee.color)
            const colorName = colorNames[otherColor]
            console.log(`${colorName} wins!`)
        }
    })
}

function emitState() {
    const whitePieces = players[WHITE].map(space => space.pieces)
    const blackPieces = players[BLACK].map(space => space.pieces)
    let boardPieces = {}
    for (const index in board) {
        boardPieces[index] = board[index].pieces
    }
    const pieces = [...whitePieces, ...blackPieces, boardPieces]
    socket.emit('move', pieces)
    console.log('sent move', pieces)
}
socket.on('move', pieces => {
    console.log('received move', pieces)
    let i = 0
    while (i < 5) {
        players[WHITE][i].pieces = pieces[i]
        i++
    }
    while (i < 10) {
        players[BLACK][i-5].pieces = pieces[i]
        i++
    }
    const boardPieces = pieces[i]
    for (index in boardPieces) {
        const space = getBoardSpace(index)
        space.pieces = boardPieces[index]
    }
})

function mouseClicked() {
    const clickPos = createVector(mouseX, mouseY)

    const playerSpaces = getAllPlayerSpaces()
    for (let i = 0; i < playerSpaces.length; i++) {
        const space = playerSpaces[i]
        if (didClickSpace(clickPos, space.pos)) {
            if (isMyTurn(space.color)) {
                if (mustPlayQueen(space)) {
                    console.log('Must play queen')
                    return
                }
                selectSpace(space)
                showAvailableSpaces()
                return
            }
        }
    }

    const availableSpaces = getAvailableSpaces()
    for (let i = 0; i < availableSpaces.length; i++) {
        const space = availableSpaces[i]
        if (didClickSpace(clickPos, getOrientPosition(space.pos))) {
            movePiece(selected, space)
            unselectSpace()
            clearAvailableSpaces()
            checkForWin()
            nextTurn()
            emitState()
            return
        }
    }

    const boardPieceSpaces = getAllBoardSpacesWithPieces()
    for (let i = 0; i < boardPieceSpaces.length; i++) {
        const space = boardPieceSpaces[i]
        if (didClickSpace(clickPos, getOrientPosition(space.pos))) {
            if (isMyTurn(space.color)) {
                if (wouldBreakOneHive(space)) {
                    console.log('Breaks one hive rule!')
                    return
                }
                if (!selected) {
                    selectSpace(space)
                    showAvailableMoves(space)
                    return
                } else if (space === selected) {
                    unselectSpace()
                    clearAvailableSpaces()
                    return
                }
            }
        }
    }
    // loop()
}

function showAvailableMoves(space) {
    ;[beeMove, beetleMove, spiderMove, grasshopperMove, antMove][space.type](
        space
    )
}

function getLeftRight(neighbors, i) {
    const left = neighbors[safeIndex(i - 1)]
    const right = neighbors[safeIndex(i + 1)]
    return [left, right]
}

function canDoGroundMove(neighbors, i) {
    const spaceIsEmpty = !neighbors[i].piece
    const [left, right] = getLeftRight(neighbors, i)
    const spaceIsNextToPiece = left.piece || right.piece
    const isNotTightSqueeze = !(left.piece && right.piece)
    const selectedIsNotLeftOrRight = left !== selected && right !== selected
    const isNotAlreadyAvailable = !neighbors[i].isAvailable
    return (
        spaceIsEmpty &&
        spaceIsNextToPiece &&
        isNotTightSqueeze &&
        selectedIsNotLeftOrRight &&
        isNotAlreadyAvailable
    )
}

function beeMove(space) {
    const neighbors = getNeighbors(space.index)
    const available = neighbors.filter((_, i) => {
        return canDoGroundMove(neighbors, i)
    })
    setAvailable(available)
}

function beetleMove(space) {
    const neighbors = getNeighbors(space.index)
    const available = neighbors.filter((neighbor, i) => {
        const beetleMounted = space.pieceCount >= 2
        const spaceHasPiece = !!neighbor.piece
        return canDoGroundMove(neighbors, i) || spaceHasPiece || beetleMounted
    })
    // const available = neighbors.filter(isEmpty)
    setAvailable(available)
}

function spiderMove(space, count = 3) {
    if (!count) return
    const neighbors = getNeighbors(space.index)
    neighbors.forEach((neighbor, i) => {
        if (canDoGroundMove(neighbors, i)) {
            neighbor.isAvailable = true
            spiderMove(neighbor, count - 1)
            if (count > 1) neighbor.isAvailable = false
        }
    })
}

function grasshopperMove(space) {
    const available = []
    const neighbors = getNeighbors(space.index)
    neighbors.forEach((neighbor, i) => {
        if (neighbor.piece) {
            while (neighbor.piece) {
                neighbor = getNeighbors(neighbor.index)[i]
            }
            available.push(neighbor)
        }
    })
    setAvailable(available)
}

function antMove(space) {
    const neighbors = getNeighbors(space.index)
    neighbors.forEach((neighbor, i) => {
        if (canDoGroundMove(neighbors, i)) {
            neighbor.isAvailable = true
            antMove(neighbor)
        }
    })
}
