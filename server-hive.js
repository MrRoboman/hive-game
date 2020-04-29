let spaces
let players

const types = {
    BEE: 0,
    BEETLE: 1,
    SPIDER: 2,
    GRASSHOPPER: 3,
    ANT: 4,
}

const colors = {
    WHITE: 0,
    BLACK: 1,
}

const STARTING_PIECE_COUNTS = {
    [types.BEE]: 1,
    [types.BEETLE]: 2,
    [types.SPIDER]: 2,
    [types.GRASSHOPPER]: 3,
    [types.ANT]: 3,
}

module.exports = {
    types,
    colors,
    STARTING_PIECE_COUNTS,

    getTypeCount() {
        return Object.keys(types).length
    },

    getTypes() {
        return Object.values(types)
    },

    getOtherColor(color) {
        return color === colors.WHITE ? colors.BLACK : colors.WHITE
    },

    getSpaces() {
        return Object.values(spaces)
    },

    getSpacesOnBoard() {
        return this.getSpaces().filter(
            (space) => typeof space.index === 'object'
        )
    },

    getSpacesOnBoardWithPieces() {
        return this.getSpacesOnBoard().filter((space) => space.piece)
    },

    getAvailaleSpaces() {
        return this.getSpaces().filter((space) => space.isAvailable)
    },

    getSpacesOnBoardByColor(color) {
        return this.getSpacesOnBoard().filter((space) => space.color === color)
    },

    getSpace(index) {
        if (!spaces[index]) {
            this.createSpaceAtIndex(index)
        }
        return spaces[index]
    },

    getNeighbors(index) {
        if (typeof index !== 'object') {
            throw new Error('getNeighbors expects a tuple, got: ', index)
        }
        const [x, y] = index
        const neighbors = []
        neighbors.push(this.getSpace([x, y - 1]))
        if (x % 2 === 0) {
            neighbors.push(this.getSpace([x + 1, y - 1]))
            neighbors.push(this.getSpace([x + 1, y]))
        } else {
            neighbors.push(this.getSpace([x + 1, y]))
            neighbors.push(this.getSpace([x + 1, y + 1]))
        }
        neighbors.push(this.getSpace([x, y + 1]))
        if (x % 2 === 0) {
            neighbors.push(this.getSpace([x - 1, y]))
            neighbors.push(this.getSpace([x - 1, y - 1]))
        } else {
            neighbors.push(this.getSpace([x - 1, y + 1]))
            neighbors.push(this.getSpace([x - 1, y]))
        }
        return neighbors
    },

    getNeighborhood(spaces) {
        const neighborsOfSpaces = spaces.reduce(
            (neighbors, space) => [
                ...neighbors,
                ...this.getNeighbors(space.index),
            ],
            []
        )
        return Array.from(new Set(neighborsOfSpaces))
    },

    createSpaceAtIndex(index, pieces = []) {
        if (!spaces[index]) {
            spaces[index] = this.createSpace(index, pieces)
        }
        return spaces[index]
    },

    createSpace(index, pieces = []) {
        return {
            index,
            pieces,
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
    },

    createPieces(color, type, count) {
        const pieces = []
        while (count--) {
            pieces.push({ color, type })
        }
        return pieces
    },

    resetSpaces() {
        spaces = {}
    },

    createPlayerSpaces(color, indexOffset) {
        this.getTypes().forEach((type, i) => {
            const index = i + indexOffset
            const pieceCount = STARTING_PIECE_COUNTS[type]
            const pieces = this.createPieces(color, type, pieceCount)
            this.createSpaceAtIndex(index, pieces)
        })
    },

    createWhitePlayerSpaces() {
        this.createPlayerSpaces(colors.WHITE)
    },

    createBlackPlayerSpaces() {
        this.createPlayerSpaces(colors.BLACK, 5)
    },

    resetGame() {
        this.resetSpaces()
        this.createPlayerSpaces(colors.WHITE, 0)
        this.createPlayerSpaces(colors.BLACK, this.getTypeCount())
        this.createSpaceAtIndex([0, 0])
    },

    hasIndex(space, index) {
        if (typeof index === 'object') {
            if (typeof space.index === 'object') {
                return index.every((_, i) => index[i] === space.index[i])
            } else {
                return false
            }
        }

        return space.index === index
    },

    includesIndex(spaces, index) {
        return spaces.some((s) => this.hasIndex(s, index))
    },

    isSpaceIncluded(spaces, space) {
        return spaces.some((s) => this.hasIndex(s, space.index))
    },

    subtractSpaces(spaces, minusSpaces) {
        const spaceSet = new Set(spaces)
        minusSpaces.forEach((space) => spaceSet.delete(space))
        return Array.from(spaceSet)
    },

    isValidMove(fromSpace, toSpace) {
        if (!fromSpace.piece) {
            return false
        }
        if (typeof toSpace.index !== 'object') {
            return false
        }

        // Placing on board
        if (typeof fromSpace.index === 'number') {
            if (toSpace.piece) {
                return false
            }
            const spacesWithPieces = this.getSpacesOnBoardWithPieces()
            if (spacesWithPieces.length === 0) {
                return this.hasIndex(toSpace, [0, 0])
            } else if (spacesWithPieces.length === 1) {
                const neighbors = this.getNeighbors([0, 0])
                return this.isSpaceIncluded(neighbors, toSpace)
            } else {
                const myColor = fromSpace.color
                const theirColor = this.getOtherColor(myColor)
                const mySpaces = this.getSpacesOnBoardByColor(myColor)
                const theirSpaces = this.getSpacesOnBoardByColor(theirColor)
                const myNeighbors = this.getNeighborhood(mySpaces)
                const theirNeighbors = this.getNeighborhood(theirSpaces)
                const availableSpaces = this.subtractSpaces(
                    myNeighbors,
                    theirNeighbors
                )
                return this.isSpaceIncluded(availableSpaces, toSpace)
            }
        }
        // Moving piece on board
        else {
            this.setSpacesAvailableByInsect(fromSpace)
            return this.includesIndex(this.getAvailaleSpaces(), toSpace.index)
        }
    },

    safeIndex(i) {
        while (i >= 6) i -= 6
        while (i < 0) i += 6
        return i
    },

    getLeftRight(neighbors, i) {
        const left = neighbors[this.safeIndex(i - 1)]
        const right = neighbors[this.safeIndex(i + 1)]
        return [left, right]
    },

    canDoGroundMove(selected, neighbors, i) {
        const [left, right] = this.getLeftRight(neighbors, i)

        const spaceIsEmpty = !neighbors[i].piece
        const spaceIsNextToPiece = !!(left.piece || right.piece)
        const spaceIsNextToTwoPieces = !!(left.piece && right.piece)
        const spaceIsNextToSelected = left === selected || right === selected

        const isNotTightSqueeze =
            !spaceIsNextToTwoPieces || spaceIsNextToSelected
        const spaceIsNotOnlyNextToSelected = !(
            spaceIsNextToSelected && !spaceIsNextToTwoPieces
        )

        const isNotAlreadyAvailable = !neighbors[i].isAvailable
        return (
            spaceIsEmpty &&
            spaceIsNextToPiece &&
            isNotTightSqueeze &&
            spaceIsNotOnlyNextToSelected &&
            isNotAlreadyAvailable
        )
    },

    setSpacesAvailableByInsect(space) {
        switch (space.type) {
            case types.BEE:
                this.beeMove(space)
                break
            case types.BEETLE:
                this.beetleMove(space)
                break
            case types.SPIDER:
                this.spiderMove(space)
                break
            case types.GRASSHOPPER:
                this.grasshopperMove(space)
                break
            case types.ANT:
                this.antMove(space)
                break
        }
    },

    beeMove(space) {
        const neighbors = this.getNeighbors(space.index)
        neighbors.forEach((neighbor, i) => {
            if (this.canDoGroundMove(space, neighbors, i)) {
                neighbor.isAvailable = true
            }
        })
    },

    beetleMove(space) {
        const neighbors = this.getNeighbors(space.index)
        neighbors.forEach((neighbor, i) => {
            const beetleMounted = space.pieceCount >= 2
            const spaceHasPiece = !!neighbor.piece
            if (
                this.canDoGroundMove(space, neighbors, i) ||
                spaceHasPiece ||
                beetleMounted
            ) {
                neighbor.isAvailable = true
            }
        })
    },

    spiderMove(space) {
        const selected = space
        const recurse = (_space, _count) => {
            if (!_count) return
            const neighbors = this.getNeighbors(_space.index)
            neighbors.forEach((neighbor, i) => {
                if (this.canDoGroundMove(selected, neighbors, i)) {
                    neighbor.isAvailable = true
                    recurse(neighbor, _count - 1)
                    if (_count > 1) neighbor.isAvailable = false
                }
            })
        }
        recurse(space, 3)
    },

    grasshopperMove(space) {
        const neighbors = this.getNeighbors(space.index)
        neighbors.forEach((neighbor, i) => {
            if (neighbor.piece) {
                while (neighbor.piece) {
                    neighbor = this.getNeighbors(neighbor.index)[i]
                }
                neighbor.isAvailable = true
            }
        })
    },

    antMove(space) {
        const selected = space
        const recurse = (_space) => {
            const neighbors = this.getNeighbors(_space.index)
            neighbors.forEach((neighbor, i) => {
                if (this.canDoGroundMove(selected, neighbors, i)) {
                    neighbor.isAvailable = true
                    recurse(neighbor)
                }
            })
        }
        recurse(space)
    },
}
