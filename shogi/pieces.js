// 駒の種類と移動ルールの定義
export const PieceType = {
    EMPTY: 0,
    PAWN: 1,
    LANCE: 2,
    KNIGHT: 3,
    SILVER: 4,
    GOLD: 5,
    BISHOP: 6,
    ROOK: 7,
    KING: 8,
    PROMOTED_PAWN: 11,
    PROMOTED_LANCE: 12,
    PROMOTED_KNIGHT: 13,
    PROMOTED_SILVER: 14,
    PROMOTED_BISHOP: 16,
    PROMOTED_ROOK: 17
};

// 駒の日本語表記
export const PieceKanji = {
    [PieceType.PAWN]: '歩',
    [PieceType.LANCE]: '香',
    [PieceType.KNIGHT]: '桂',
    [PieceType.SILVER]: '銀',
    [PieceType.GOLD]: '金',
    [PieceType.BISHOP]: '角',
    [PieceType.ROOK]: '飛',
    [PieceType.KING]: '玉',
    [PieceType.PROMOTED_PAWN]: 'と',
    [PieceType.PROMOTED_LANCE]: '成香',
    [PieceType.PROMOTED_KNIGHT]: '成桂',
    [PieceType.PROMOTED_SILVER]: '成銀',
    [PieceType.PROMOTED_BISHOP]: '馬',
    [PieceType.PROMOTED_ROOK]: '竜'
};

// 方向の定義
const DIRECTIONS = {
    UP: [-1, 0],
    DOWN: [1, 0],
    LEFT: [0, -1],
    RIGHT: [0, 1],
    UP_LEFT: [-1, -1],
    UP_RIGHT: [-1, 1],
    DOWN_LEFT: [1, -1],
    DOWN_RIGHT: [1, 1],
    KNIGHT_LEFT: [-2, -1],
    KNIGHT_RIGHT: [-2, 1]
};

// 各駒の移動可能方向を定義
export const PieceMoves = {
    [PieceType.PAWN]: (isPlayer) => ({
        short: [isPlayer ? DIRECTIONS.UP : DIRECTIONS.DOWN]
    }),

    [PieceType.LANCE]: (isPlayer) => ({
        long: [isPlayer ? DIRECTIONS.UP : DIRECTIONS.DOWN]
    }),

    [PieceType.KNIGHT]: (isPlayer) => ({
        short: [
            isPlayer ? DIRECTIONS.KNIGHT_LEFT : [-DIRECTIONS.KNIGHT_LEFT[0], DIRECTIONS.KNIGHT_LEFT[1]],
            isPlayer ? DIRECTIONS.KNIGHT_RIGHT : [-DIRECTIONS.KNIGHT_RIGHT[0], DIRECTIONS.KNIGHT_RIGHT[1]]
        ]
    }),

    [PieceType.SILVER]: (isPlayer) => ({
        short: [
            isPlayer ? DIRECTIONS.UP : DIRECTIONS.DOWN,
            isPlayer ? DIRECTIONS.UP_LEFT : DIRECTIONS.DOWN_RIGHT,
            isPlayer ? DIRECTIONS.UP_RIGHT : DIRECTIONS.DOWN_LEFT,
            isPlayer ? DIRECTIONS.DOWN_LEFT : DIRECTIONS.UP_RIGHT,
            isPlayer ? DIRECTIONS.DOWN_RIGHT : DIRECTIONS.UP_LEFT
        ]
    }),

    [PieceType.GOLD]: (isPlayer) => ({
        short: [
            isPlayer ? DIRECTIONS.UP : DIRECTIONS.DOWN,
            isPlayer ? DIRECTIONS.UP_LEFT : DIRECTIONS.DOWN_RIGHT,
            isPlayer ? DIRECTIONS.UP_RIGHT : DIRECTIONS.DOWN_LEFT,
            DIRECTIONS.LEFT,
            DIRECTIONS.RIGHT,
            isPlayer ? DIRECTIONS.DOWN : DIRECTIONS.UP
        ]
    }),

    [PieceType.BISHOP]: () => ({
        long: [
            DIRECTIONS.UP_LEFT,
            DIRECTIONS.UP_RIGHT,
            DIRECTIONS.DOWN_LEFT,
            DIRECTIONS.DOWN_RIGHT
        ]
    }),

    [PieceType.ROOK]: () => ({
        long: [
            DIRECTIONS.UP,
            DIRECTIONS.DOWN,
            DIRECTIONS.LEFT,
            DIRECTIONS.RIGHT
        ]
    }),

    [PieceType.KING]: () => ({
        short: [
            DIRECTIONS.UP,
            DIRECTIONS.DOWN,
            DIRECTIONS.LEFT,
            DIRECTIONS.RIGHT,
            DIRECTIONS.UP_LEFT,
            DIRECTIONS.UP_RIGHT,
            DIRECTIONS.DOWN_LEFT,
            DIRECTIONS.DOWN_RIGHT
        ]
    })
};

// 成り駒の移動ルールを定義
PieceMoves[PieceType.PROMOTED_PAWN] = PieceMoves[PieceType.GOLD];
PieceMoves[PieceType.PROMOTED_LANCE] = PieceMoves[PieceType.GOLD];
PieceMoves[PieceType.PROMOTED_KNIGHT] = PieceMoves[PieceType.GOLD];
PieceMoves[PieceType.PROMOTED_SILVER] = PieceMoves[PieceType.GOLD];

// 馬（成り角）の移動ルール
PieceMoves[PieceType.PROMOTED_BISHOP] = () => ({
    long: [
        DIRECTIONS.UP_LEFT,
        DIRECTIONS.UP_RIGHT,
        DIRECTIONS.DOWN_LEFT,
        DIRECTIONS.DOWN_RIGHT
    ],
    short: [
        DIRECTIONS.UP,
        DIRECTIONS.DOWN,
        DIRECTIONS.LEFT,
        DIRECTIONS.RIGHT
    ]
});

// 竜（成り飛車）の移動ルール
PieceMoves[PieceType.PROMOTED_ROOK] = () => ({
    long: [
        DIRECTIONS.UP,
        DIRECTIONS.DOWN,
        DIRECTIONS.LEFT,
        DIRECTIONS.RIGHT
    ],
    short: [
        DIRECTIONS.UP_LEFT,
        DIRECTIONS.UP_RIGHT,
        DIRECTIONS.DOWN_LEFT,
        DIRECTIONS.DOWN_RIGHT
    ]
});

// 駒の成りの可否と成り駒の種類を定義
export const PromotionMap = {
    [PieceType.PAWN]: PieceType.PROMOTED_PAWN,
    [PieceType.LANCE]: PieceType.PROMOTED_LANCE,
    [PieceType.KNIGHT]: PieceType.PROMOTED_KNIGHT,
    [PieceType.SILVER]: PieceType.PROMOTED_SILVER,
    [PieceType.BISHOP]: PieceType.PROMOTED_BISHOP,
    [PieceType.ROOK]: PieceType.PROMOTED_ROOK
};

// 駒の価値（AI用）
export const PieceValues = {
    [PieceType.PAWN]: 1,
    [PieceType.LANCE]: 3,
    [PieceType.KNIGHT]: 4,
    [PieceType.SILVER]: 5,
    [PieceType.GOLD]: 6,
    [PieceType.BISHOP]: 8,
    [PieceType.ROOK]: 10,
    [PieceType.KING]: 0,
    [PieceType.PROMOTED_PAWN]: 4,
    [PieceType.PROMOTED_LANCE]: 6,
    [PieceType.PROMOTED_KNIGHT]: 6,
    [PieceType.PROMOTED_SILVER]: 6,
    [PieceType.PROMOTED_BISHOP]: 10,
    [PieceType.PROMOTED_ROOK]: 12
};
