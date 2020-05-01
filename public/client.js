const socket = io()
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

socket.on('uuid', (uuid) => {
    setUuid(uuid)
})

function emitMove(fromSpace, toSpace) {
    socket.emit('move', {
        fromSpaceIndex: fromSpace.index,
        toSpaceIndex: toSpace.index,
    })
}

function emitReset() {
    socket.emit('reset')
}

socket.on('gameState', (gameState) => {
    console.log('gameState', gameState)
    hive.resetSpaces()
    gameState.forEach(({ index, pieces }) => {
        hive.createSpaceAtIndex(index, pieces)
    })
})

function keyPressed() {
    if (key === 'r') {
        emitReset()
    }
}

let images

let orientation
let startDragOrientation
let mouseStartDragPos

const radius = 40

let selected = null

// TODO: Add turns

const TOP = 0
const BOTTOM = 1

const colorInfo = {
    [hive.colors.WHITE]: {
        name: 'White',
        value: 240,
    },
    [hive.colors.BLACK]: {
        name: 'Black',
        value: 15,
    },
}
function getColorName(color) {
    return colorInfo[color].name
}
function getColorValue(color) {
    return colorInfo[color].value
}

const spacePositions = {}
function getPosition(space) {
    if (!spacePositions[space.index]) {
        if (hive.isOnBoard(space)) {
            spacePositions[space.index] = createBoardSpacePosition(space)
        } else {
            spacePositions[space.index] = createPlayerSpacePosition(space)
        }
    }
    return spacePositions[space.index]
}

function getOrientPosition(space) {
    // console.log(getPosition(space))
    return p5.Vector.add(getPosition(space), orientation)
}

function createBoardSpacePosition(space) {
    const index = space.index
    const x = cos(PI / 6) * radius * 2 * index[0]
    const y =
        radius * 2 * index[1] +
        (index[0] % 2 === 0 ? 0 : sin(PI / 6) * radius * 2)
    return createVector(x, y)
}

function createPlayerSpacePosition(space) {
    const typeCount = hive.getTypeCount()
    const halfTypeCount = typeCount / 2
    const side = floor(space.index / typeCount)
    const localIndex = space.index % typeCount
    const x =
        width / 2 - radius * typeCount + radius * halfTypeCount * localIndex
    const y = side === BOTTOM ? radius * 1.2 : height - radius * 1.2
    return createVector(x, y)
}

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

    // hive.resetGame()
}

function draw() {
    dragScreen()
    background(100)

    drawBoardPieces()
    drawAvailableSpaces()
    drawPlayerPieces()
    drawSelectionHex()

    //     // noLoop()
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

function drawBoardPieces() {
    hive.getSpacesOnBoardWithPieces().forEach((space) => {
        drawPiece(space.piece, getOrientPosition(space), radius)
    })
}

function drawAvailableSpaces() {
    availableStroke()
    hive.getAvailableSpaces().forEach((space) => {
        drawHexagon(getOrientPosition(space), radius)
    })
}

function drawPlayerPieces() {
    hive.getPlayerSpacesWithPieces().forEach((space) => {
        const { piece, pieceCount } = space
        const pos = getPosition(space)
        drawPiece(piece, pos, radius)
        const x = pos.x + radius * 0.8
        const y = pos.y + radius * 0.8 * -0.7
        noStroke()
        text(pieceCount, x, y)
    })
}

function drawPiece(piece, pos, rad) {
    fill(getColorValue(piece.color))
    noStroke()
    drawHexagon(pos, rad)
    drawBug(piece.type, pos, rad)
}

function drawSelectionHex() {
    if (selected) {
        const pos = hive.isOnBoard(selected)
            ? getOrientPosition(selected)
            : getPosition(selected)
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
    selected = false
}

function mouseClicked() {
    const clickPos = createVector(mouseX, mouseY)

    const playerSpaces = hive.getPlayerSpacesWithPieces()
    for (let i = 0; i < playerSpaces.length; i++) {
        const space = playerSpaces[i]
        if (didClickSpace(clickPos, getPosition(space))) {
            if (hive.isMyTurn(space.color)) {
                if (hive.mustPlayQueen(space)) {
                    console.log('Must play queen')
                    return
                }
                selectSpace(space)
                hive.clearAvailableSpaces()
                hive.markSpacesAvailableForPlacement(space)
                return
            }
        }
    }

    const availableSpaces = hive.getAvailableSpaces()
    for (let i = 0; i < availableSpaces.length; i++) {
        const space = availableSpaces[i]
        if (didClickSpace(clickPos, getOrientPosition(space))) {
            emitMove(selected, space)
            hive.movePiece(selected, space)
            unselectSpace()
            hive.clearAvailableSpaces()
            // checkForWin()
            // nextTurn()
            return
        }
    }

    const boardPieceSpaces = hive.getSpacesOnBoardWithPieces()
    for (let i = 0; i < boardPieceSpaces.length; i++) {
        const space = boardPieceSpaces[i]
        if (didClickSpace(clickPos, getOrientPosition(space))) {
            if (hive.isMyTurn(space.color)) {
                if (hive.wouldBreakOneHive(space)) {
                    console.log('Breaks one hive rule!')
                    return
                }
                if (!selected) {
                    selectSpace(space)
                    hive.setSpacesAvailableByInsect(space)
                    if (hive.getAvailableSpaces().length === 0) {
                        console.log('That piece cannot move')
                        unselectSpace()
                    }
                    return
                } else if (space === selected) {
                    unselectSpace()
                    hive.clearAvailableSpaces()
                    return
                }
            }
        }
    }
    // loop()
}
