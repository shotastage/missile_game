import { PieceType, PieceMoves, PromotionMap } from './pieces.js';

export class Board {
    constructor() {
        this.reset();
    }

    // 盤面を初期状態にリセット
    reset() {
        this.board = Array(9).fill().map(() => Array(9).fill({ type: PieceType.EMPTY, isPlayer: true }));
        this.capturedPieces = {
            player: [],
            opponent: []
        };
        this.initializeBoard();
    }

    // 初期配置を設定
    initializeBoard() {
        // 歩兵の配置
        for (let col = 0; col < 9; col++) {
            this.setPiece(2, col, { type: PieceType.PAWN, isPlayer: true });
            this.setPiece(6, col, { type: PieceType.PAWN, isPlayer: false });
        }

        // 香車の配置
        this.setPiece(0, 0, { type: PieceType.LANCE, isPlayer: true });
        this.setPiece(0, 8, { type: PieceType.LANCE, isPlayer: true });
        this.setPiece(8, 0, { type: PieceType.LANCE, isPlayer: false });
        this.setPiece(8, 8, { type: PieceType.LANCE, isPlayer: false });

        // 桂馬の配置
        this.setPiece(0, 1, { type: PieceType.KNIGHT, isPlayer: true });
        this.setPiece(0, 7, { type: PieceType.KNIGHT, isPlayer: true });
        this.setPiece(8, 1, { type: PieceType.KNIGHT, isPlayer: false });
        this.setPiece(8, 7, { type: PieceType.KNIGHT, isPlayer: false });

        // 銀将の配置
        this.setPiece(0, 2, { type: PieceType.SILVER, isPlayer: true });
        this.setPiece(0, 6, { type: PieceType.SILVER, isPlayer: true });
        this.setPiece(8, 2, { type: PieceType.SILVER, isPlayer: false });
        this.setPiece(8, 6, { type: PieceType.SILVER, isPlayer: false });

        // 金将の配置
        this.setPiece(0, 3, { type: PieceType.GOLD, isPlayer: true });
        this.setPiece(0, 5, { type: PieceType.GOLD, isPlayer: true });
        this.setPiece(8, 3, { type: PieceType.GOLD, isPlayer: false });
        this.setPiece(8, 5, { type: PieceType.GOLD, isPlayer: false });

        // 王将・玉将の配置
        this.setPiece(0, 4, { type: PieceType.KING, isPlayer: true });
        this.setPiece(8, 4, { type: PieceType.KING, isPlayer: false });

        // 角行の配置
        this.setPiece(1, 1, { type: PieceType.BISHOP, isPlayer: true });
        this.setPiece(7, 7, { type: PieceType.BISHOP, isPlayer: false });

        // 飛車の配置
        this.setPiece(1, 7, { type: PieceType.ROOK, isPlayer: true });
        this.setPiece(7, 1, { type: PieceType.ROOK, isPlayer: false });
    }

    // 駒を配置
    setPiece(row, col, piece) {
        this.board[row][col] = piece;
    }

    // 駒を取得
    getPiece(row, col) {
        return this.board[row][col];
    }

    // 駒を移動
    movePiece(fromRow, fromCol, toRow, toCol, promote = false) {
        const piece = this.getPiece(fromRow, fromCol);
        const targetPiece = this.getPiece(toRow, toCol);

        // 駒を取る場合
        if (targetPiece.type !== PieceType.EMPTY) {
            const capturedPiece = {
                type: this.getOriginalPieceType(targetPiece.type),
                isPlayer: !targetPiece.isPlayer
            };
            this.capturedPieces[piece.isPlayer ? 'player' : 'opponent'].push(capturedPiece);
        }

        // 駒を移動
        this.setPiece(toRow, toCol, promote ?
            { type: PromotionMap[piece.type], isPlayer: piece.isPlayer } :
            { ...piece });
        this.setPiece(fromRow, fromCol, { type: PieceType.EMPTY, isPlayer: true });

        return true;
    }

    // 持ち駒を打つ
    dropPiece(row, col, piece) {
        if (this.getPiece(row, col).type !== PieceType.EMPTY) return false;

        const capturedPieces = piece.isPlayer ? this.capturedPieces.player : this.capturedPieces.opponent;
        const index = capturedPieces.findIndex(p => p.type === piece.type);

        if (index === -1) return false;

        this.setPiece(row, col, piece);
        capturedPieces.splice(index, 1);
        return true;
    }

    // 合法手の生成
    getValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (piece.type === PieceType.EMPTY) return [];

        const moves = [];
        const pieceMoves = PieceMoves[piece.type](piece.isPlayer);

        if (pieceMoves.long) {
            // 長距離移動できる駒（飛車、角、香車など）
            for (const direction of pieceMoves.long) {
                let newRow = row + direction[0];
                let newCol = col + direction[1];

                while (this.isOnBoard(newRow, newCol)) {
                    const targetPiece = this.getPiece(newRow, newCol);
                    if (targetPiece.type === PieceType.EMPTY) {
                        moves.push([newRow, newCol]);
                    } else if (targetPiece.isPlayer !== piece.isPlayer) {
                        moves.push([newRow, newCol]);
                        break;
                    } else {
                        break;
                    }
                    newRow += direction[0];
                    newCol += direction[1];
                }
            }
        }

        // 1マス移動の処理
        const shortMoves = pieceMoves.short || pieceMoves;
        for (const direction of shortMoves) {
            const newRow = row + direction[0];
            const newCol = col + direction[1];

            if (this.isOnBoard(newRow, newCol)) {
                const targetPiece = this.getPiece(newRow, newCol);
                if (targetPiece.type === PieceType.EMPTY || targetPiece.isPlayer !== piece.isPlayer) {
                    moves.push([newRow, newCol]);
                }
            }
        }

        return moves;
    }

    // 持ち駒の打てる場所を取得
    getValidDropPositions(piece) {
        const validPositions = [];

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.getPiece(row, col).type === PieceType.EMPTY &&
                    this.isValidDrop(row, col, piece)) {
                    validPositions.push([row, col]);
                }
            }
        }

        return validPositions;
    }

    // 持ち駒を打てるかどうかの判定
    isValidDrop(row, col, piece) {
        // 二歩の判定
        if (piece.type === PieceType.PAWN) {
            for (let i = 0; i < 9; i++) {
                if (this.getPiece(i, col).type === PieceType.PAWN &&
                    this.getPiece(i, col).isPlayer === piece.isPlayer) {
                    return false;
                }
            }
        }

        // 打ち歩詰めの判定
        if (piece.type === PieceType.PAWN && this.isDropPawnMate(row, col, piece)) {
            return false;
        }

        // 行き所のない駒の判定
        return !this.isImmediatelyTrapped(row, col, piece);
    }

    // マスが盤面上にあるかどうかの判定
    isOnBoard(row, col) {
        return row >= 0 && row < 9 && col >= 0 && col < 9;
    }

    // 成れるかどうかの判定
    canPromote(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!PromotionMap[piece.type]) return false;

        return (piece.isPlayer && (fromRow < 3 || toRow < 3)) ||
               (!piece.isPlayer && (fromRow > 5 || toRow > 5));
    }

    // 成らないと動けない状況かどうかの判定
    mustPromote(fromRow, fromCol, toRow) {
        const piece = this.getPiece(fromRow, fromCol);
        if (piece.type === PieceType.PAWN || piece.type === PieceType.LANCE) {
            return (piece.isPlayer && toRow === 0) || (!piece.isPlayer && toRow === 8);
        }
        if (piece.type === PieceType.KNIGHT) {
            return (piece.isPlayer && toRow <= 1) || (!piece.isPlayer && toRow >= 7);
        }
        return false;
    }

    // 王手判定
    isCheck(isPlayerKing) {
        // 王の位置を探す
        let kingRow, kingCol;
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.getPiece(row, col);
                if (piece.type === PieceType.KING && piece.isPlayer === isPlayerKing) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
            if (kingRow !== undefined) break;
        }

        // 相手の駒からの攻撃をチェック
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY && piece.isPlayer !== isPlayerKing) {
                    const moves = this.getValidMoves(row, col);
                    if (moves.some(([r, c]) => r === kingRow && c === kingCol)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    // 詰み判定
    isCheckmate(isPlayerKing) {
        if (!this.isCheck(isPlayerKing)) return false;

        // 王の移動による回避
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY && piece.isPlayer === isPlayerKing) {
                    const moves = this.getValidMoves(row, col);
                    for (const [toRow, toCol] of moves) {
                        // 移動をシミュレート
                        const boardCopy = this.cloneBoard();
                        boardCopy.movePiece(row, col, toRow, toCol);
                        if (!boardCopy.isCheck(isPlayerKing)) {
                            return false;
                        }
                    }
                }
            }
        }

        // 持ち駒による回避
        const capturedPieces = isPlayerKing ? this.capturedPieces.player : this.capturedPieces.opponent;
        for (const piece of capturedPieces) {
            const positions = this.getValidDropPositions({ ...piece, isPlayer: isPlayerKing });
            for (const [row, col] of positions) {
                // 打つ手をシミュレート
                const boardCopy = this.cloneBoard();
                boardCopy.dropPiece(row, col, { ...piece, isPlayer: isPlayerKing });
                if (!boardCopy.isCheck(isPlayerKing)) {
                    return false;
                }
            }
        }

        return true;
    }

    // 盤面の複製
    cloneBoard() {
        const newBoard = new Board();
        newBoard.board = JSON.parse(JSON.stringify(this.board));
        newBoard.capturedPieces = JSON.parse(JSON.stringify(this.capturedPieces));
        return newBoard;
    }

    // 成り駒を元の駒に戻す
    getOriginalPieceType(type) {
        for (const [original, promoted] of Object.entries(PromotionMap)) {
            if (promoted === type) return parseInt(original);
        }
        return type;
    }

    // 打ち歩詰めの判定
    isDropPawnMate(row, col, piece) {
        if (piece.type !== PieceType.PAWN) return false;

        const boardCopy = this.cloneBoard();
        boardCopy.dropPiece(row, col, piece);

        return boardCopy.isCheckmate(!piece.isPlayer);
    }

    // 行き所のない駒の判定（歩、香車、桂馬）
    isImmediatelyTrapped(row, col, piece) {
        if (piece.type === PieceType.PAWN || piece.type === PieceType.LANCE) {
            return (piece.isPlayer && row === 0) || (!piece.isPlayer && row === 8);
        }
        if (piece.type === PieceType.KNIGHT) {
            return (piece.isPlayer && row <= 1) || (!piece.isPlayer && row >= 7);
        }
        return false;
    }
}
