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
        value: 35,
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
    background(100)

    drawBoardPieces()
    drawAvailableSpaces()
    drawPlayerPieces()
    drawDrag()
    drawSelectionHex()

    // const pos = getOrientPosition(hive.getSpace([0, 0]))
    // drawRisingHexes({
    //     pos,
    //     h: 0,
    //     hexCount: 4,
    //     rad: radius,
    //     targetRad: 00,
    //     baseAlpha: 0,
    //     targetAlpha: 150,
    //     totalFrames: 150,
    //     frame: f++,
    // })
    //     // noLoop()
}

function getScreenPosition(space) {
    return hive.isOnBoard(space) ? getOrientPosition(space) : getPosition(space)
}

function isValidSpace(space) {
    if (!space.piece) {
        return false
    }

    // if is my turn

    if (hive.isOnBoard(space)) {
        if (!hive.queenIsOnBoard(space)) {
            console.log('no')
            return false
        }
        if (hive.wouldBreakOneHive(space)) {
            console.log('Breaks one hive rule!')
            return false
        }
    } else {
        if (hive.mustPlayQueen(space)) {
            console.log('Must play queen')
            return false
        }
    }

    return true
}

function markAvailable(space) {
    if (hive.isOnBoard(space)) {
        hive.setSpacesAvailableByInsect(space)
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
            const availableSpaces = hive.getAvailableSpaces()
            for (let i = 0; i < availableSpaces.length; i++) {
                const space = availableSpaces[i]
                const position = getScreenPosition(space)
                if (didClickSpace(mousePos, position)) {
                    hive.movePiece(selected, space)
                    unselectSpace()
                    hive.clearAvailableSpaces()
                    waitForRelease = true
                    return
                }
            }

            hive.getSpaces().forEach(space => {
                const position = getScreenPosition(space)
                if (didClickSpace(mousePos, position)) {
                    if (isValidSpace(space)) {
                        if (selected === space) {
                            justSelected = false
                        } else {
                            justSelected = true
                        }
                        selectSpace(space)
                        draggingSpace = space
                        dragOffset = p5.Vector.sub(position, mousePos)
                        wasDragged = false
                    }
                }
            })
            hive.clearAvailableSpaces()
            if (selected) {
                markAvailable(selected)
            }
        }
    } else {
        waitForRelease = false
        if (selected) {
            if (didClickSpace(mousePos, getScreenPosition(selected))) {
                if (!justSelected) {
                    unselectSpace()
                    hive.clearAvailableSpaces()
                }
            }
        }
        if (draggingSpace) {
            const availableSpaces = hive.getAvailableSpaces()
            for (let i = 0; i < availableSpaces.length; i++) {
                const space = availableSpaces[i]
                const pos = getOrientPosition(space)
                if (didClickSpace(mousePos, pos)) {
                    // emitMove(selected, space)
                    hive.movePiece(draggingSpace, space)
                    didSetPiece = true
                    // checkForWin()
                    // nextTurn()
                    // return
                }
            }
            draggingSpace = null
            if (wasDragged) {
                unselectSpace()
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
        let mousePos = createVector(mouseX, mouseY)
        let pos = p5.Vector.add(mousePos, dragOffset)
        pos = p5.Vector.add(
            pos,
            createVector(0, -8 * (draggingSpace.pieceCount - 1))
        )
        drawPiece(draggingSpace.piece, pos, radius)
    }
}

function getSpacesWithPiecesAndScreenPositions() {
    const playerSpaces = hive.getPlayerSpacesWithPieces()
    const boardSpaces = hive.getSpacesOnBoardWithPieces()
    const spaces = []
    playerSpaces.forEach(space =>
        spaces.push({ space: space, pos: getPosition(space) })
    )
    boardSpaces.forEach(space =>
        spaces.push({ space: space, pos: getOrientPosition(space) })
    )
    return spaces
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

function getBoardSpacesFromTopToBottom() {
    return hive.getSpacesOnBoardWithPieces().sort((spaceA, spaceB) => {
        const posA = getScreenPosition(spaceA)
        const posB = getScreenPosition(spaceB)
        if (posA.y < posB.y) return -1
        if (posA.y > posB.y) return 1
        return 0
    })
}

function drawBoardPieces() {
    getBoardSpacesFromTopToBottom().forEach(space => {
        const dontDrawTopPiece = space === draggingSpace
        drawPieces(space, dontDrawTopPiece)
    })
}

function drawAvailableSpaces() {
    availableStroke()
    hive.getAvailableSpaces().forEach(space => {
        // drawHexagon(getOrientPosition(space), radius)
        drawHexIndent(getOrientPosition(space), radius, 6)
        // let pos = getOrientPosition(space)
        // pos.y -= space.pieceCount * 6
        // drawHexOutdent(pos, radius, 6, null, true)
    })
}

function drawPlayerPieces() {
    hive.getPlayerSpacesWithPieces().forEach(space => {
        if (space === draggingSpace) {
            if (space.pieceCount >= 2) {
                const pos = getScreenPosition(space)
                // drawPiece(space.secondPiece, pos, radius)
                drawPieces(space, true)
                // drawPieceCount(space, -1)
            }
        } else {
            const pos = getScreenPosition(space)
            // drawPiece(space.piece, pos, radius)
            drawPieces(space)
            // drawPieceCount(space)
        }
    })
}

function drawPieceCount(space, offset = 0) {
    const pos = getScreenPosition(space)
    const x = pos.x + radius * 0.8
    const y = pos.y + radius * 0.8 * -0.7
    noStroke()
    text(space.pieceCount + offset, x, y)
}

function drawPiece(piece, pos, rad) {
    fill(getColorValue(piece.color))
    noStroke()
    // drawHexagon(pos, rad)
    drawHexOutdent(pos, rad, 6, getColorValue(piece.color))
    drawBug(piece.type, p5.Vector.add(pos, createVector(0, -6)), rad)
}

function drawPieces(space, upToSecondPiece) {
    const len = upToSecondPiece ? space.pieces.length - 1 : space.pieces.length
    for (let i = 0; i < len; i++) {
        const piece = space.pieces[i]
        let pos = getScreenPosition(space)
        pos = p5.Vector.sub(pos, createVector(0, 8 * i))
        drawPiece(piece, pos, radius)
    }
}

function drawRisingHexes({
    pos,
    h,
    hexCount,
    rad,
    targetRad,
    baseAlpha,
    targetAlpha,
    totalFrames,
    frame,
}) {
    // stroke(0, 255, 0)
    // noFill()
    // drawHexagon(pos, rad)
    noStroke()
    for (let i = 0; i < hexCount; i++) {
        const frameOffset = totalFrames / hexCount
        frame = frame + (totalFrames / hexCount) * i
        frame = frame % totalFrames
        const percentComplete = frame / totalFrames
        const maxHeight = pos.y - h
        const y = map(percentComplete, 0, 1, pos.y, maxHeight)
        const position = createVector(pos.x, y)
        const alpha = map(percentComplete, 0, 1, baseAlpha, targetAlpha)
        fill(0, 255, 0, alpha)
        const r = map(percentComplete, 0, 1, rad, targetRad)
        drawHexagon(position, r)
        // drawHexagon(pos, r)
    }
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

function drawHexOutdent(pos, r, h, fillColor = null, strokeColor = null) {
    let x, y

    const drawSide = (angle, fillColor, strokeColor) => {
        if (fillColor) {
            fill(fillColor)
        } else {
            noFill()
        }
        if (strokeColor) {
            stroke(0, 255, 0)
        } else {
            noStroke()
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

    strokeWeight(1)

    drawSide(0, fillColor ? fillColor - 90 : null, strokeColor)
    drawSide(PI / 3, fillColor ? fillColor - 90 + 25 : null, strokeColor)
    drawSide((2 * PI) / 3, fillColor ? fillColor - 90 + 50 : null, strokeColor)
    if (fillColor) {
        fill(fillColor)
    } else {
        noFill()
    }

    if (strokeColor) {
        stroke(0, 255, 0)
    } else {
        noStroke()
    }
    strokeWeight(2)
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

function selectedStroke() {
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

function selectSpace(space) {
    selected = space
}

function unselectSpace() {
    selected = false
}

function mouseClicked() {
    const clickPos = createVector(mouseX, mouseY)

    // const playerSpaces = hive.getPlayerSpacesWithPieces()
    // for (let i = 0; i < playerSpaces.length; i++) {
    //     const space = playerSpaces[i]
    //     if (didClickSpace(clickPos, getPosition(space))) {
    //         if (hive.isMyTurn(space.color)) {
    //             if (hive.mustPlayQueen(space)) {
    //                 console.log('Must play queen')
    //                 return
    //             }
    //             selectSpace(space)
    //             hive.clearAvailableSpaces()
    //             if (selected) {
    //                 hive.markSpacesAvailableForPlacement(space)
    //             }
    //             return
    //         }
    //     }
    // }

    // const availableSpaces = hive.getAvailableSpaces()
    // for (let i = 0; i < availableSpaces.length; i++) {
    //     const space = availableSpaces[i]
    //     if (didClickSpace(clickPos, getOrientPosition(space))) {
    //         emitMove(selected, space)
    //         hive.movePiece(selected, space)
    //         unselectSpace()
    //         hive.clearAvailableSpaces()
    //         // checkForWin()
    //         // nextTurn()
    //         return
    //     }
    // }

    // const boardPieceSpaces = hive.getSpacesOnBoardWithPieces()
    // for (let i = 0; i < boardPieceSpaces.length; i++) {
    //     const space = boardPieceSpaces[i]
    //     if (didClickSpace(clickPos, getOrientPosition(space))) {
    //         if (hive.isMyTurn(space.color)) {
    //             if (hive.wouldBreakOneHive(space)) {
    //                 console.log('Breaks one hive rule!')
    //                 return
    //             }
    //             if (!selected) {
    //                 selectSpace(space)
    //                 hive.setSpacesAvailableByInsect(space)
    //                 if (hive.getAvailableSpaces().length === 0) {
    //                     console.log('That piece cannot move')
    //                     unselectSpace()
    //                 }
    //                 return
    //             } else if (space === selected) {
    //                 unselectSpace()
    //                 hive.clearAvailableSpaces()
    //                 return
    //             }
    //         }
    //     }
    // }
    // loop()
}
