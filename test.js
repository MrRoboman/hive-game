const hive = require('./public/hive')

describe('server', () => {
    const whiteBee = () => [{ color: hive.colors.WHITE, type: hive.types.BEE }]
    const whiteBeetle = () => [
        { color: hive.colors.WHITE, type: hive.types.BEETLE },
    ]
    const whiteSpider = () => [
        { color: hive.colors.WHITE, type: hive.types.SPIDER },
    ]
    const whiteGrasshopper = () => [
        { color: hive.colors.WHITE, type: hive.types.GRASSHOPPER },
    ]
    const whiteAnt = () => [{ color: hive.colors.WHITE, type: hive.types.ANT }]
    const twoWhiteBeetles = () => [
        { color: hive.colors.WHITE, type: hive.types.BEETLE },
        { color: hive.colors.WHITE, type: hive.types.BEETLE },
    ]

    const blackBee = () => [{ color: hive.colors.BLACK, type: hive.types.BEE }]
    const blackBeetle = () => [
        { color: hive.colors.BLACK, type: hive.types.BEETLE },
    ]
    const blackSpider = () => [
        { color: hive.colors.BLACK, type: hive.types.SPIDER },
    ]
    const blackGrasshopper = () => [
        { color: hive.colors.BLACK, type: hive.types.GRASSHOPPER },
    ]
    const blackAnt = () => [{ color: hive.colors.BLACK, type: hive.types.ANT }]

    const putPiece = (x, y, piece) => hive.createSpaceAtIndex([x, y], piece)

    beforeEach(() => {
        hive.resetSpaces()
    })

    it('resetSpaces', () => {
        expect(hive.getSpaces().length).toEqual(0)
    })

    it('createSpaceAtIndex', () => {
        hive.createSpaceAtIndex(
            [0, 0],
            [{ color: hive.colors.BLACK, type: hive.types.BEE }]
        )
        expect(hive.getSpace([0, 0]).index).toEqual([0, 0])
        expect(hive.getSpaces().length).toBe(1)
    })

    it('getSpace', () => {
        expect(hive.getSpace([0, 0])).toBeTruthy()
        expect(hive.getSpaces().length).toBe(1)
    })

    it('getSpaces', () => {
        expect(hive.getSpaces().length).toBe(0)
        hive.createSpaceAtIndex(0)
        expect(hive.getSpaces().length).toBe(1)
    })

    it('getSpacesOnBoard', () => {
        hive.createSpaceAtIndex(0)
        hive.createSpaceAtIndex(1)
        hive.createSpaceAtIndex([0, 0])
        expect(hive.getSpacesOnBoard().length).toBe(1)
    })

    it('getSpacesOnBoardWithPieces', () => {
        hive.createSpaceAtIndex(0)
        hive.createSpaceAtIndex(1)
        hive.createSpaceAtIndex([0, 0])
        hive.createSpaceAtIndex(
            [0, 0],
            [{ color: hive.colors.WHITE, type: hive.types.GRASSHOPPER }]
        )
        expect(hive.getSpacesOnBoard().length).toBe(1)
    })

    it('getAvailableSpaces', () => {
        hive.createSpaceAtIndex(0)
        hive.createSpaceAtIndex(1)
        hive.createSpaceAtIndex([0, 0]).isAvailable = true
        hive.createSpaceAtIndex(
            [0, 0],
            [{ color: hive.colors.WHITE, type: hive.types.GRASSHOPPER }]
        )
        expect(hive.getAvailableSpaces().length).toBe(1)
    })

    it('getSpacesOnBoardByColor', () => {
        hive.createSpaceAtIndex(0)
        hive.createSpaceAtIndex(1, [
            { color: hive.colors.WHITE, type: hive.types.GRASSHOPPER },
        ])
        hive.createSpaceAtIndex(
            [3, 3],
            [{ color: hive.colors.WHITE, type: hive.types.GRASSHOPPER }]
        )
        hive.createSpaceAtIndex(
            [0, 0],
            [{ color: hive.colors.BLACK, type: hive.types.GRASSHOPPER }]
        )
        hive.createSpaceAtIndex(
            [2, 2],
            [{ color: hive.colors.BLACK, type: hive.types.GRASSHOPPER }]
        )
        expect(hive.getSpacesOnBoardByColor(hive.colors.WHITE).length).toBe(1)
        expect(hive.getSpacesOnBoardByColor(hive.colors.BLACK).length).toBe(2)
    })

    describe('getNeighbors', () => {
        it('does not accept a number', () => {
            expect(() => hive.getNeighbors(2)).toThrow()
        })

        it('returns neighbors of space in clockwise order from the top', () => {
            const neighbors = hive.getNeighbors([0, 0])
            expect(neighbors[0].index).toEqual([0, -1])
            expect(neighbors[1].index).toEqual([1, -1])
            expect(neighbors[2].index).toEqual([1, 0])
            expect(neighbors[3].index).toEqual([0, 1])
            expect(neighbors[4].index).toEqual([-1, 0])
            expect(neighbors[5].index).toEqual([-1, -1])
            expect(hive.getSpaces().length).toBe(6)
        })
    })

    it('types', () => {
        expect(Object.keys(hive.types)).toEqual([
            'BEE',
            'BEETLE',
            'SPIDER',
            'GRASSHOPPER',
            'ANT',
        ])
    })

    it('isOnBoard', () => {
        const offBoard = hive.getSpace(0)
        const onBoard = hive.getSpace([0, 0])
        expect(hive.isOnBoard(offBoard)).toBe(false)
        expect(hive.isOnBoard(onBoard)).toBe(true)
    })

    describe('createPlayerSpaces', () => {
        const assert = (spaces, index, offset, color) => {
            expect(spaces[index].index).toBe(index + offset)
            expect(spaces[index].pieceCount).toBe(
                hive.STARTING_PIECE_COUNTS[index]
            )
            expect(spaces[index].color).toBe(color)
            expect(spaces[index].type).toBe(hive.getTypes()[index])
        }

        it('createWhitePlayerSpaces', () => {
            hive.createPlayerSpaces(hive.colors.WHITE, 0)
            const spaces = hive.getSpaces()
            expect(spaces.length).toBe(5)
            for (let i = 0; i < 5; i++) {
                assert(spaces, i, 0, hive.colors.WHITE)
            }
        })

        it('createBlackPlayerSpaces', () => {
            hive.createPlayerSpaces(hive.colors.BLACK, hive.getTypeCount())
            const spaces = hive.getSpaces()
            expect(spaces.length).toBe(5)
            for (let i = 0; i < 5; i++) {
                assert(spaces, i, hive.getTypeCount(), hive.colors.BLACK)
            }
        })
    })

    it('createPieces', () => {
        const pieces = hive.createPieces(hive.colors.BLACK, hive.ANT, 2)
        expect(pieces).toEqual([
            { color: hive.colors.BLACK, type: hive.ANT },
            { color: hive.colors.BLACK, type: hive.ANT },
        ])
    })

    describe('createSpace', () => {
        it('creates an empty space', () => {
            const space = hive.createSpace(0)
            expect(space.index).toEqual(0)
            expect(space.pieces).toEqual([])
            expect(space.isAvailable).toBe(false)
            expect(space.piece).toBe(undefined)
            expect(space.pieceCount).toBe(0)
            expect(space.color).toBe(undefined)
            expect(space.type).toBe(undefined)
        })

        it('creates a space with one piece', () => {
            const piece = { color: hive.colors.WHITE, type: hive.types.BEE }
            const space = hive.createSpace([0, 0], [piece])
            expect(space.index).toEqual([0, 0])
            expect(space.pieces).toEqual([piece])
            expect(space.isAvailable).toBe(false)
            expect(space.piece).toEqual(piece)
            expect(space.pieceCount).toBe(1)
            expect(space.color).toBe(hive.colors.WHITE)
            expect(space.type).toBe(hive.types.BEE)
        })

        it('creates a space with more than one piece', () => {
            const piece1 = { color: hive.colors.WHITE, type: hive.types.BEE }
            const piece2 = { color: hive.colors.BLACK, type: hive.types.BEETLE }
            const space = hive.createSpace('stringIndex', [piece1, piece2])
            expect(space.index).toEqual('stringIndex')
            expect(space.pieces).toEqual([piece1, piece2])
            expect(space.isAvailable).toBe(false)
            expect(space.piece).toEqual(piece2)
            expect(space.pieceCount).toBe(2)
            expect(space.color).toBe(hive.colors.BLACK)
            expect(space.type).toBe(hive.types.BEETLE)
        })
    })

    it('resetGame', () => {
        hive.resetGame()
        expect(hive.getSpaces().length).toEqual(11)

        // White pieces
        expect(hive.getSpace(0).pieceCount).toBe(1)
        expect(hive.getSpace(0).color).toBe(hive.colors.WHITE)
        expect(hive.getSpace(0).type).toBe(hive.types.BEE)

        expect(hive.getSpace(1).pieceCount).toBe(2)
        expect(hive.getSpace(1).color).toBe(hive.colors.WHITE)
        expect(hive.getSpace(1).type).toBe(hive.types.BEETLE)

        expect(hive.getSpace(2).pieceCount).toBe(2)
        expect(hive.getSpace(2).color).toBe(hive.colors.WHITE)
        expect(hive.getSpace(2).type).toBe(hive.types.SPIDER)

        expect(hive.getSpace(3).pieceCount).toBe(3)
        expect(hive.getSpace(3).color).toBe(hive.colors.WHITE)
        expect(hive.getSpace(3).type).toBe(hive.types.GRASSHOPPER)

        expect(hive.getSpace(4).pieceCount).toBe(3)
        expect(hive.getSpace(4).color).toBe(hive.colors.WHITE)
        expect(hive.getSpace(4).type).toBe(hive.types.ANT)

        // Black pieces
        expect(hive.getSpace(5).pieceCount).toBe(1)
        expect(hive.getSpace(5).color).toBe(hive.colors.BLACK)
        expect(hive.getSpace(5).type).toBe(hive.types.BEE)

        expect(hive.getSpace(6).pieceCount).toBe(2)
        expect(hive.getSpace(6).color).toBe(hive.colors.BLACK)
        expect(hive.getSpace(6).type).toBe(hive.types.BEETLE)

        expect(hive.getSpace(7).pieceCount).toBe(2)
        expect(hive.getSpace(7).color).toBe(hive.colors.BLACK)
        expect(hive.getSpace(7).type).toBe(hive.types.SPIDER)

        expect(hive.getSpace(8).pieceCount).toBe(3)
        expect(hive.getSpace(8).color).toBe(hive.colors.BLACK)
        expect(hive.getSpace(8).type).toBe(hive.types.GRASSHOPPER)

        expect(hive.getSpace(9).pieceCount).toBe(3)
        expect(hive.getSpace(9).color).toBe(hive.colors.BLACK)
        expect(hive.getSpace(9).type).toBe(hive.types.ANT)

        // Board
        expect(hive.getSpace([0, 0]).pieceCount).toBe(0)
    })

    it('hasIndex', () => {
        expect(hive.hasIndex(hive.getSpace(0), 0)).toBe(true)
        expect(hive.hasIndex(hive.getSpace(0), 1)).toBe(false)
        expect(hive.hasIndex(hive.getSpace([0, 0]), [0, 0])).toBe(true)
        expect(hive.hasIndex(hive.getSpace([0, 0]), [0, 1])).toBe(false)
        expect(hive.hasIndex(hive.getSpace([0, 0]), 0)).toBe(false)
        expect(hive.hasIndex(hive.createSpace([3, 3]), [2, 2])).toBe(false)
    })

    it('includesIndex', () => {
        const spaces = [hive.getSpace([0, 0]), hive.getSpace([1, 1])]
        expect(hive.includesIndex(spaces, [2, 2])).toBe(false)
        expect(hive.includesIndex(spaces, [1, 1])).toBe(true)
    })

    it('isSpaceIncluded', () => {
        const space = hive.createSpace([3, 3])
        hive.createSpaceAtIndex([1, 1])
        hive.createSpaceAtIndex([2, 2])

        expect(hive.isSpaceIncluded(hive.getSpaces(), space)).toBe(false)

        hive.createSpaceAtIndex([3, 3])

        expect(hive.isSpaceIncluded(hive.getSpaces(), space)).toBe(true)
    })

    it('subtractSpaces', () => {
        const spaces = [hive.getSpace(1), hive.getSpace(2)]
        const minusSpaces = [hive.getSpace(1), hive.getSpace(3)]
        const result = hive.subtractSpaces(spaces, minusSpaces)
        expect(hive.isSpaceIncluded(result, hive.getSpace(2))).toBe(true)
        expect(result.length).toBe(1)
    })

    it('safeIndex', () => {
        expect(hive.safeIndex(-6)).toBe(0)
        expect(hive.safeIndex(-1)).toBe(5)
        expect(hive.safeIndex(0)).toBe(0)
        expect(hive.safeIndex(3)).toBe(3)
        expect(hive.safeIndex(6)).toBe(0)
        expect(hive.safeIndex(13)).toBe(1)
    })

    it('getLeftRight', () => {
        const neighbors = hive.getNeighbors([0, 0])
        const assert = (neighborIndex, leftIndex, rightIndex) => {
            const [left, right] = hive.getLeftRight(neighbors, neighborIndex)
            expect(left.index).toEqual(leftIndex)
            expect(right.index).toEqual(rightIndex)
        }
        assert(0, [-1, -1], [1, -1])
        assert(1, [0, -1], [1, 0])
        assert(2, [1, -1], [0, 1])
        assert(3, [1, 0], [-1, 0])
        assert(4, [0, 1], [-1, -1])
        assert(5, [-1, 0], [0, -1])
    })

    describe('movement', () => {
        let assertMove = (piece, move, expectedIndexes) => {
            const selected = putPiece(0, 0, piece)
            move(selected)
            const availableSpaces = hive.getAvailableSpaces()
            expect(availableSpaces.length).toBe(expectedIndexes.length)
            availableSpaces.forEach((space) => {
                const isExpectedIndex = expectedIndexes.some((index) =>
                    hive.hasIndex(space, index)
                )
                expect(isExpectedIndex).toBe(true)
            })
        }
        beforeEach(() => {
            putPiece(0, 1, blackAnt())
            putPiece(1, 1, blackAnt())
            putPiece(2, 1, blackAnt())
            putPiece(2, 0, blackAnt())
            putPiece(1, -1, blackAnt())
        })

        it('beeMove', () => {
            assertMove(whiteBee(), hive.beeMove.bind(hive), [
                [0, -1],
                [-1, 0],
            ])
        })

        it('beetleMove - ground', () => {
            assertMove(whiteBeetle(), hive.beetleMove.bind(hive), [
                [0, -1],
                [1, -1],
                [0, 1],
                [-1, 0],
            ])
        })

        it('beetleMove - mounted', () => {
            assertMove(twoWhiteBeetles(), hive.beetleMove.bind(hive), [
                [0, -1],
                [1, -1],
                [0, 1],
                [-1, 0],
                [1, 0],
                [-1, -1],
            ])
        })

        it('spiderMove', () => {
            assertMove(whiteSpider(), hive.spiderMove.bind(hive), [
                [2, -1],
                [0, 2],
            ])
        })

        it('grasshopperMove', () => {
            assertMove(whiteGrasshopper(), hive.grasshopperMove.bind(hive), [
                [2, -1],
                [0, 2],
            ])
        })

        it('antMove', () => {
            assertMove(whiteAnt(), hive.antMove.bind(hive), [
                [0, -1],
                [1, -2],
                [2, -1],
                [3, -1],
                [3, 0],
                [3, 1],
                [2, 2],
                [1, 2],
                [0, 2],
                [-1, 1],
                [-1, 0],
            ])
        })

        // This is outside of the describe block for other tests of this function
        // because I wanted to use the beforeEach of this function.
        it('isValidMove', () => {
            hive.createSpaceAtIndex([0, 0], whiteBee())
            const fromSpace = hive.getSpace([0, 0])

            expect(hive.isValidMove(fromSpace, hive.getSpace([1, 0]))).toBe(
                false
            )
            expect(hive.isValidMove(fromSpace, hive.getSpace([-1, 0]))).toBe(
                true
            )
        })

        it('setSpacesAvailableByInsect', () => {})
    })

    describe('getPlaceableSpaces', () => {
        it('handles first placement', () => {
            const beeSpace = hive.createSpaceAtIndex(0, blackBee())
            const spaces = hive.getPlaceableSpaces(beeSpace)
            expect(spaces.length).toBe(1)
            expect(spaces[0].index).toEqual([0, 0])
        })

        it('handles second placement', () => {
            hive.createSpaceAtIndex([0, 0], whiteBee())
            const beeSpace = hive.createSpaceAtIndex(0, blackBee())
            const spaces = hive.getPlaceableSpaces(beeSpace)
            expect(spaces.length).toBe(6)
            expect(spaces[0].index).toEqual([0, -1])
            expect(spaces[1].index).toEqual([1, -1])
            expect(spaces[2].index).toEqual([1, 0])
            expect(spaces[3].index).toEqual([0, 1])
            expect(spaces[4].index).toEqual([-1, 0])
            expect(spaces[5].index).toEqual([-1, -1])
        })

        it('handles third placement', () => {
            hive.createSpaceAtIndex([0, 0], blackAnt())
            hive.createSpaceAtIndex([0, -1], whiteBee())
            const beeSpace = hive.createSpaceAtIndex(0, blackBee())
            const spaces = hive.getPlaceableSpaces(beeSpace)
            const indexes = spaces.map((s) => s.index)
            expect(indexes).toEqual([
                [1, 0],
                [0, 1],
                [-1, 0],
            ])
        })
    })

    describe('isValidMove', () => {
        let fromSpace
        let toSpace
        let isValid
        let whiteBee, whiteAnt, blackBee, blackAnt

        beforeEach(() => {
            hive.resetSpaces()
            whiteBee = hive.createPieces(hive.colors.WHITE, hive.types.BEE, 1)
            whiteAnt = hive.createPieces(hive.colors.WHITE, hive.types.ANT, 1)
            blackBee = hive.createPieces(hive.colors.BLACK, hive.types.BEE, 1)
            blackAnt = hive.createPieces(hive.colors.BLACK, hive.types.ANT, 1)
        })

        it('canDoGroundMove', () => {
            hive.createSpaceAtIndex([0, 0], blackAnt)
            hive.createSpaceAtIndex([0, 1], blackAnt)
            hive.createSpaceAtIndex([1, 1], blackAnt)
            hive.createSpaceAtIndex([2, 1], blackAnt)
            hive.createSpaceAtIndex([2, 0], blackAnt)
            hive.createSpaceAtIndex([1, -1], blackAnt)
            const selected = hive.getSpace([1, 1])
            const neighbors = hive.getNeighbors([1, 1])
            expect(hive.canDoGroundMove(selected, neighbors, 0)).toBe(false)
            expect(hive.canDoGroundMove(selected, neighbors, 1)).toBe(false)
            expect(hive.canDoGroundMove(selected, neighbors, 2)).toBe(true)
            expect(hive.canDoGroundMove(selected, neighbors, 3)).toBe(false)
            expect(hive.canDoGroundMove(selected, neighbors, 4)).toBe(true)
            expect(hive.canDoGroundMove(selected, neighbors, 5)).toBe(false)
        })

        it('is not valid if the fromSpace has no piece', () => {
            fromSpace = hive.getSpace(0)
            toSpace = hive.getSpace([0, 0])
            isValid = hive.isValidMove(fromSpace, toSpace)
            expect(isValid).toBe(false)
        })

        it('is not valid if the toSpace index is not a tuple', () => {
            fromSpace = hive.createSpaceAtIndex(0, whiteBee)
            toSpace = hive.getSpace(1)
            isValid = hive.isValidMove(fromSpace, toSpace)
            expect(isValid).toBe(false)
        })

        it('is not valid if space is already occupied', () => {
            fromSpace = hive.createSpaceAtIndex(5, blackBee)
            toSpace = hive.createSpaceAtIndex([0, 0], whiteBee)
            expect(hive.isValidMove(fromSpace, toSpace)).toBe(false)
        })

        it('handles first move', () => {
            fromSpace = hive.createSpaceAtIndex(0, whiteBee)
            toSpace = hive.getSpace([1, 1])

            isValid = hive.isValidMove(fromSpace, toSpace)
            expect(isValid).toBe(false)

            toSpace = hive.getSpace([0, 0])
            isValid = hive.isValidMove(hive.getSpace(0), hive.getSpace([0, 0]))
            expect(isValid).toBe(true)
        })

        it('handles second move', () => {
            hive.createSpaceAtIndex([0, 0], whiteBee)
            fromSpace = hive.createSpaceAtIndex(5, blackBee)

            toSpace = hive.getSpace([2, 0])
            isValid = hive.isValidMove(fromSpace, toSpace)
            expect(isValid).toBe(false)

            toSpace = hive.getSpace()
            isValid = hive.isValidMove(fromSpace, toSpace)
            expect(isValid).toBe(false)
        })

        it('handles third move', () => {
            hive.createSpaceAtIndex([0, 0], whiteBee)
            hive.createSpaceAtIndex([0, -1], blackBee)

            fromSpace = hive.createSpaceAtIndex(4, whiteAnt)

            const neighbors = hive.getNeighbors([0, 0])
            expect(hive.isValidMove(fromSpace, neighbors[0])).toBe(false)
            expect(hive.isValidMove(fromSpace, neighbors[1])).toBe(false)
            expect(hive.isValidMove(fromSpace, neighbors[2])).toBe(true)
            expect(hive.isValidMove(fromSpace, neighbors[3])).toBe(true)
            expect(hive.isValidMove(fromSpace, neighbors[4])).toBe(true)
            expect(hive.isValidMove(fromSpace, neighbors[5])).toBe(false)
        })

        it('handles fourth move', () => {
            hive.createSpaceAtIndex([0, 0], whiteBee)
            hive.createSpaceAtIndex([0, -1], blackBee)
            hive.createSpaceAtIndex([0, 1], whiteAnt)

            fromSpace = hive.createSpaceAtIndex(9, blackAnt)

            const neighbors = hive.getNeighbors([0, -1])
            expect(hive.isValidMove(fromSpace, neighbors[0])).toBe(true)
            expect(hive.isValidMove(fromSpace, neighbors[1])).toBe(true)
            expect(hive.isValidMove(fromSpace, neighbors[2])).toBe(false)
            expect(hive.isValidMove(fromSpace, neighbors[3])).toBe(false)
            expect(hive.isValidMove(fromSpace, neighbors[4])).toBe(false)
            expect(hive.isValidMove(fromSpace, neighbors[5])).toBe(true)
        })

        it('can move from player space to board space', () => {})

        it('can move from board space to board space', () => {})
    })
})
