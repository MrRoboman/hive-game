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

socket.on('uuid', uuid => {
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

socket.on('gameState', gameState => {
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
let draggingSpace = null
let dragOffset
let wasDragged = false
let waitForRelease = false
let justSelected = false

const radius = 40
const STACK_HEIGHT = 8
const PIECE_HEIGHT = 6

let selectedSpace = null

// TODO: Add turns

const TOP = 0
const BOTTOM = 1

const colorInfo = {
    [hive.colors.WHITE]: {
        name: 'White',
        value: 240,
        fillColors: [
            [204, 204, 204],
            [153, 153, 153],
            [102, 102, 102],
            [255, 255, 255],
        ],
    },
    [hive.colors.BLACK]: {
        name: 'Black',
        value: 35,
        fillColors: [
            [102, 102, 102],
            [51, 51, 51],
            [0, 0, 0],
            [0, 0, 0],
        ],
    },
}
function getColorName(color) {
    return colorInfo[color].name
}
function getColorValue(color) {
    return colorInfo[color].value
}

function getFillColors(color) {
    return colorInfo[color].fillColors
}

// Cache positions by space index
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
    return p5.Vector.add(getPosition(space), orientation)
}

function getScreenPosition(space) {
    return hive.isOnBoard(space) ? getOrientPosition(space) : getPosition(space)
}

function getStackPosition(space, offset = 0) {
    const position = getScreenPosition(space)
    const pieceCount = space.pieceCount + offset
    const stackPos = createVector(0, STACK_HEIGHT * pieceCount)
    return p5.Vector.sub(position, stackPos)
}

function getStackPositionFromBottom(space, offset = 0) {
    const position = getScreenPosition(space)
    const stackPos = createVector(0, STACK_HEIGHT * offset)
    return p5.Vector.sub(position, stackPos)
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
    const y = side === BOTTOM ? radius * 2 : height - radius * 1.2
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
let f = 0
function draw() {
    dragLogic()
    // dragScreen()
    // background(100)
    drawBackground()

    // drawBoardPieces()
    // drawAvailableSpaces()
    // drawPlayerPieces()
    // drawDrag()
    // drawSelectionHex()

    drawHexesInOrder()
}

const BROKEN_RULE_NO_PIECE = 'Space has no piece'
const BROKEN_RULE_NOT_MY_TURN = 'Not my turn'
const BROKEN_RULE_NO_MOVES_BEFORE_QUEEN =
    'Cannot move pieces until Queen Bee is played'
const BROKEN_RULE_ONE_HIVE = 'Must maintain one hive'
const BROKEN_RULE_MUST_PLAY_QUEEN = 'Must play Queen Bee this turn'

function checkForBrokenRule(space) {
    if (!space.piece) {
        return BROKEN_RULE_NO_PIECE
    }

    // if is my turn

    if (hive.isOnBoard(space)) {
        if (!hive.queenIsOnBoard(space)) {
            return BROKEN_RULE_NO_MOVES_BEFORE_QUEEN
        }
        if (hive.wouldBreakOneHive(space)) {
            return BROKEN_RULE_ONE_HIVE
        }
    } else {
        if (hive.mustPlayQueen(space)) {
            return BROKEN_RULE_MUST_PLAY_QUEEN
        }
    }

    return null
}

function handleBrokenRule(brokenRule) {
    console.log(brokenRule)
}

function markSpacesAvailable(space) {
    if (hive.isOnBoard(space)) {
        hive.markSpacesAvailableForMovement(space)
    } else {
        hive.markSpacesAvailableForPlacement(space)
    }
}

function dragLogic() {
    let mousePos = createVector(mouseX, mouseY)
    if (mouseIsPressed) {
        if (waitForRelease) {
            return
        }
        if (!draggingSpace) {
            const playerSpaces = hive.getPlayerSpacesWithPieces()
            for (let i = 0; i < playerSpaces.length; i++) {
                const space = playerSpaces[i]
                const position = getScreenPosition(space)
                const stackPosition = getStackPosition(space)
                if (didClickSpace(mousePos, stackPosition)) {
                    const brokenRule = checkForBrokenRule(space)
                    if (brokenRule) {
                        handleBrokenRule(brokenRule)
                        waitForRelease = true
                        return
                    }
                    if (selectedSpace === space) {
                        justSelected = false
                    } else {
                        justSelected = true
                    }
                    selectedSpace = space
                    draggingSpace = space
                    dragOffset = p5.Vector.sub(position, mousePos)
                    wasDragged = false
                    hive.clearAvailableSpaces()
                    markSpacesAvailable(selectedSpace)
                    return
                }
            }

            const boardSpaces = hive
                .getSpacesOnBoardWithPieces()
                .sort(bottomToTop)
            for (let i = 0; i < boardSpaces.length; i++) {
                const space = boardSpaces[i]
                // When Beetle is selectedSpace, some board spaces will be marked available
                // and we want to move to it instead of select the piece.
                if (space.isAvailable) continue
                const position = getScreenPosition(space)
                const stackPosition = getStackPosition(space)
                if (didClickSpace(mousePos, stackPosition)) {
                    const brokenRule = checkForBrokenRule(space)
                    if (brokenRule) {
                        handleBrokenRule(brokenRule)
                        waitForRelease = true
                        return
                    }
                    if (selectedSpace === space) {
                        justSelected = false
                    } else {
                        justSelected = true
                    }
                    selectedSpace = space
                    draggingSpace = space
                    dragOffset = p5.Vector.sub(position, mousePos)
                    wasDragged = false
                    hive.clearAvailableSpaces()
                    markSpacesAvailable(selectedSpace)
                    return
                }
            }

            const availableSpaces = hive.getAvailableSpaces()
            for (let i = 0; i < availableSpaces.length; i++) {
                const space = availableSpaces[i]
                const position = getStackPosition(space)
                if (didClickSpace(mousePos, position)) {
                    // emitMove(selectedSpace, space)
                    hive.movePiece(selectedSpace, space)
                    selectedSpace = null
                    hive.clearAvailableSpaces()
                    waitForRelease = true
                    // checkForWin()
                    // nextTurn()
                    return
                }
            }
        }
    } else {
        waitForRelease = false
        if (selectedSpace) {
            if (didClickSpace(mousePos, getStackPosition(selectedSpace))) {
                if (!justSelected) {
                    selectedSpace = null
                    hive.clearAvailableSpaces()
                }
            }
        }
        if (draggingSpace) {
            const availableSpaces = hive.getAvailableSpaces()
            for (let i = 0; i < availableSpaces.length; i++) {
                const space = availableSpaces[i]
                const pos = getStackPosition(space)
                if (wasDragged && didClickSpace(mousePos, pos)) {
                    // emitMove(selectedSpace, space)
                    hive.movePiece(draggingSpace, space)
                    // checkForWin()
                    // nextTurn()
                    // return
                }
            }
            draggingSpace = null
            if (wasDragged) {
                selectedSpace = null
                hive.clearAvailableSpaces()
            }
        }
    }
}

function mouseDragged() {
    wasDragged = true
}

function drawDrag() {
    if (draggingSpace) {
        const mousePos = createVector(mouseX, mouseY)
        const pos = p5.Vector.add(mousePos, dragOffset)
        const pieceCount = draggingSpace.pieceCount - 1
        const stackPos = createVector(0, STACK_HEIGHT * pieceCount)
        const position = p5.Vector.sub(pos, stackPos)
        drawPiece(draggingSpace.piece, position, radius)
    }
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

function drawBackground() {
    background(51, 153, 153)
    // const pos = getScreenPosition(hive.getSpace([0, 0]))
    // drawIndented(pos, radius, 4, [
    //     [157, 95, 22],
    //     [153, 102, 0],
    //     [153, 102, 0],
    //     [153, 102, 0],
    // ])
    // drawHexIndent(getScreenPosition(hive.getSpace([0, 0])), radius, 4)
}

function drawHexesInOrder() {
    const boardSpaces = hive.getSpacesOnBoardWithPieces()
    const availableSpaces = hive.getAvailableSpaces()
    const spaces = boardSpaces.concat(availableSpaces).sort(topToBottom)
    spaces.forEach(space => {
        const dontDrawTopPiece = space === draggingSpace
        drawPieces(space, dontDrawTopPiece)
        if (space.isAvailable) {
            drawAvailableHex(space)
        }
    })

    drawPlayerPieces()
    drawDrag()

    if (draggingSpace) {
        const mousePos = createVector(mouseX, mouseY)
        const pos = p5.Vector.add(mousePos, dragOffset)
        const pieceCount = draggingSpace.pieceCount - 1
        const stackPos = createVector(0, STACK_HEIGHT * pieceCount)
        const position = p5.Vector.sub(pos, stackPos)
        drawHex3D(
            position,
            radius,
            PIECE_HEIGHT,
            [255, 0, 0],
            [[255, 0, 0, 40]]
        )
    } else if (selectedSpace) {
        const pos = getStackPosition(selectedSpace, -1)
        drawHex3D(pos, radius, PIECE_HEIGHT, [255, 0, 0], [[255, 0, 0, 40]])
    }
}

function topToBottom(spaceA, spaceB) {
    const posA = getScreenPosition(spaceA)
    const posB = getScreenPosition(spaceB)
    if (posA.y < posB.y) return -1
    if (posA.y > posB.y) return 1
    return 0
}

function bottomToTop(spaceA, spaceB) {
    const posA = getScreenPosition(spaceA)
    const posB = getScreenPosition(spaceB)
    if (posA.y < posB.y) return 1
    if (posA.y > posB.y) return -1
    return 0
}

function drawBoardPieces() {
    hive.getSpacesOnBoardWithPieces()
        .sort(topToBottom)
        .forEach(space => {
            const dontDrawTopPiece = space === draggingSpace
            drawPieces(space, dontDrawTopPiece)
        })
}

function drawAvailableHex(space) {
    drawHex3D(
        getStackPosition(space),
        radius,
        PIECE_HEIGHT,
        [0, 255, 0, 255],
        [[0, 255, 0, 100]]
    )
}

function drawAvailableSpaces() {
    availableStroke()
    hive.getAvailableSpaces().forEach(space => {
        drawAvailableHex(space)
    })
}

function drawIndented(pos, r, h, fillColors) {
    const hFraction = h * 0.6
    let x, y, angle

    fill(...fillColors[0])
    beginShape()
    for (let i = 0; i <= 6; i++) {
        const angle = (PI / 3) * i
        x = pos.x + cos(angle) * r
        y = pos.y + sin(angle) * r
        vertex(x, y)
    }
    endShape()

    fill(...fillColors[1])
    angle = PI
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x + cos(PI / 3) * hFraction, y + sin(PI / 3) * hFraction)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x, y + h)
    vertex(x, y)
    endShape()

    fill(...fillColors[2])
    angle = PI + PI / 3
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x, y + h)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x, y + h)
    vertex(x, y)
    endShape()

    fill(...fillColors[3])
    angle = 2 * PI - PI / 3
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x, y + h)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x + cos((2 * PI) / 3) * hFraction, y + sin((2 * PI) / 3) * hFraction)
    vertex(x, y)
    endShape()
}

function drawPlayerPieces() {
    hive.getPlayerSpacesWithPieces().forEach(space => {
        if (space === draggingSpace) {
            if (space.pieceCount >= 2) {
                const dontDrawTopPiece = true
                drawPieces(space, dontDrawTopPiece)
            }
        } else {
            drawPieces(space)
        }
    })
}

function drawPiece(piece, pos, rad) {
    noStroke()
    const fillColors = getFillColors(piece.color)
    drawHex3D(pos, rad, PIECE_HEIGHT, null, fillColors)
    drawBug(piece.type, p5.Vector.add(pos, createVector(0, -PIECE_HEIGHT)), rad)
}

function drawPieces(space, dontDrawTopPiece) {
    const len = dontDrawTopPiece ? space.pieces.length - 1 : space.pieces.length
    for (let i = 0; i < len; i++) {
        const piece = space.pieces[i]
        const position = getStackPositionFromBottom(space, i)
        drawPiece(piece, position, radius)
    }
}

function drawSelectionHex() {
    if (draggingSpace) {
        const mousePos = createVector(mouseX, mouseY)
        const pos = p5.Vector.add(mousePos, dragOffset)
        const pieceCount = draggingSpace.pieceCount - 1
        const stackPos = createVector(0, STACK_HEIGHT * pieceCount)
        const position = p5.Vector.sub(pos, stackPos)
        drawHex3D(
            position,
            radius,
            PIECE_HEIGHT,
            [255, 0, 0],
            [[255, 0, 0, 40]]
        )
    } else if (selectedSpace) {
        const position = getStackPosition(selectedSpace, -1)
        drawHex3D(
            position,
            radius,
            PIECE_HEIGHT,
            [255, 0, 0],
            [[255, 0, 0, 40]]
        )
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

function drawHex3D(pos, r, h, strokeColor, fillColors) {
    if (strokeColor) {
        stroke(...strokeColor)
        strokeWeight(1)
    } else {
        noStroke()
    }

    const drawSide = (angle, fillColor) => {
        if (fillColor) {
            fill(...fillColor)
        } else {
            noFill()
        }
        beginShape()
        x = pos.x + cos(angle) * r
        y = pos.y + sin(angle) * r
        let _x = x
        let _y = y
        vertex(x, y)
        vertex(x, y - h)
        x = pos.x + cos(angle + PI / 3) * r
        y = pos.y + sin(angle + PI / 3) * r
        vertex(x, y - h)
        vertex(x, y)
        vertex(_x, _y)
        endShape()
    }

    fillColors = fillColors || []
    drawSide(0, fillColors[0])
    drawSide(PI / 3, fillColors[1] || fillColors[0])
    drawSide((2 * PI) / 3, fillColors[2] || fillColors[0])

    const fillColor = fillColors[3] || fillColors[0]
    if (fillColor) {
        fill(fillColor)
    } else {
        noFill()
    }

    if (strokeColor) {
        stroke(...strokeColor)
        strokeWeight(2)
    } else {
        noStroke()
    }
    beginShape()
    for (let i = 0; i <= 6; i++) {
        const angle = (PI / 3) * i
        x = pos.x + cos(angle) * r
        y = pos.y - h + sin(angle) * r
        vertex(x, y)
    }
    endShape()
}

function drawHexIndent(pos, r, h) {
    const hFraction = h * 0.6
    let x, y, angle

    fill(80)
    beginShape()
    for (let i = 0; i <= 6; i++) {
        const angle = (PI / 3) * i
        x = pos.x + cos(angle) * r
        y = pos.y + sin(angle) * r
        vertex(x, y)
    }
    endShape()

    fill(40)
    angle = PI
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x + cos(PI / 3) * hFraction, y + sin(PI / 3) * hFraction)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x, y + h)
    vertex(x, y)
    endShape()

    fill(50)
    angle = PI + PI / 3
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x, y + h)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x, y + h)
    vertex(x, y)
    endShape()

    fill(60)
    angle = 2 * PI - PI / 3
    beginShape()
    x = pos.x + cos(angle) * r
    y = pos.y + sin(angle) * r
    vertex(x, y)
    vertex(x, y + h)
    x = pos.x + cos(angle + PI / 3) * r
    y = pos.y + sin(angle + PI / 3) * r
    vertex(x + cos((2 * PI) / 3) * hFraction, y + sin((2 * PI) / 3) * hFraction)
    vertex(x, y)
    endShape()
}

function drawBug(type, pos, r) {
    const size = r * 1.3
    image(images[type], pos.x - size / 2, pos.y - size / 2, size, size)
}

function selectedSpaceStroke() {
    noFill()
    stroke(0, 0, 255)
    strokeWeight(2)
}

function availableStroke() {
    noFill()
    stroke(0, 255, 0)
    strokeWeight(4)

    noStroke()
}

function didClickSpace(clickPos, pos) {
    // Radius???
    return clickPos.dist(pos) <= radius
}
