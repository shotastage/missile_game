import { PieceType, PieceValues } from './pieces.js';

export class ShogiAI {
    constructor(difficulty = 'normal') {
        this.difficulty = difficulty;
        this.initializeParameters();
    }

    // AIの難易度に応じたパラメータを設定
    initializeParameters() {
        switch (this.difficulty) {
            case 'easy':
                this.searchDepth = 2;
                this.usePositionalEvaluation = false;
                break;
            case 'normal':
                this.searchDepth = 3;
                this.usePositionalEvaluation = true;
                break;
            case 'hard':
                this.searchDepth = 4;
                this.usePositionalEvaluation = true;
                break;
            default:
                this.searchDepth = 3;
                this.usePositionalEvaluation = true;
        }
    }

    // 最善手を選択
    getBestMove(board) {
        const startTime = Date.now();
        let bestMove = null;
        let bestScore = -Infinity;

        // 可能な手をすべて生成
        const possibleMoves = this.generateAllMoves(board, false);

        // 各手を評価
        for (const move of possibleMoves) {
            const boardCopy = board.cloneBoard();
            this.makeMove(boardCopy, move);

            // ミニマックス法で評価値を計算
            const score = this.minimax(boardCopy, this.searchDepth - 1, -Infinity, Infinity, true);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        const endTime = Date.now();
        console.log(`AI思考時間: ${endTime - startTime}ms`);

        return bestMove;
    }

    // ミニマックス法（アルファベータ探索）の実装
    minimax(board, depth, alpha, beta, isMaximizingPlayer) {
        // 終端ノードの評価
        if (depth === 0 || this.isGameOver(board)) {
            return this.evaluatePosition(board);
        }

        const possibleMoves = this.generateAllMoves(board, isMaximizingPlayer);

        if (isMaximizingPlayer) {
            let maxScore = -Infinity;
            for (const move of possibleMoves) {
                const boardCopy = board.cloneBoard();
                this.makeMove(boardCopy, move);
                const score = this.minimax(boardCopy, depth - 1, alpha, beta, false);
                maxScore = Math.max(maxScore, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break; // アルファベータカット
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (const move of possibleMoves) {
                const boardCopy = board.cloneBoard();
                this.makeMove(boardCopy, move);
                const score = this.minimax(boardCopy, depth - 1, alpha, beta, true);
                minScore = Math.min(minScore, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break; // アルファベータカット
            }
            return minScore;
        }
    }

    // 局面の評価関数
    evaluatePosition(board) {
        let score = 0;

        // 材料価値の評価
        score += this.evaluateMaterial(board);

        // 位置の評価
        if (this.usePositionalEvaluation) {
            score += this.evaluatePositional(board);
        }

        // 王の安全度評価
        score += this.evaluateKingSafety(board);

        // 機動力の評価
        score += this.evaluateMobility(board);

        // 持ち駒の評価
        score += this.evaluateCapturedPieces(board);

        return score;
    }

    // 材料価値の評価
    evaluateMaterial(board) {
        let score = 0;

        // 盤上の駒の評価
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY) {
                    const value = PieceValues[piece.type];
                    score += piece.isPlayer ? -value : value;
                }
            }
        }

        // 持ち駒の評価
        for (const piece of board.capturedPieces.opponent) {
            score += PieceValues[piece.type];
        }
        for (const piece of board.capturedPieces.player) {
            score -= PieceValues[piece.type];
        }

        return score;
    }

    // 位置の評価
    evaluatePositional(board) {
        let score = 0;

        // 駒の配置に関する評価値テーブル
        const positionValues = this.getPositionValues();

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY) {
                    const posValue = positionValues[piece.type]?.[piece.isPlayer ? row : 8 - row][col] || 0;
                    score += piece.isPlayer ? -posValue : posValue;
                }
            }
        }

        return score * 0.1; // 位置の評価値の重みを調整
    }

    // 駒の配置評価値テーブルを取得
    getPositionValues() {
        return {
            [PieceType.PAWN]: [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [20, 20, 20, 20, 20, 20, 20, 20, 20],
                [15, 15, 15, 15, 15, 15, 15, 15, 15],
                [10, 10, 10, 10, 10, 10, 10, 10, 10],
                [5,  5,  5,  5,  5,  5,  5,  5,  5],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            [PieceType.LANCE]: [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [15, 15, 15, 15, 15, 15, 15, 15, 15],
                [10, 10, 10, 10, 10, 10, 10, 10, 10],
                [5,  5,  5,  5,  5,  5,  5,  5,  5],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            [PieceType.KNIGHT]: [
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [15, 20, 20, 20, 20, 20, 20, 20, 15],
                [10, 15, 15, 15, 15, 15, 15, 15, 10],
                [5,  10, 10, 10, 10, 10, 10, 10,  5],
                [0,  5,  5,  5,  5,  5,  5,  5,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            [PieceType.SILVER]: [
                [5,  5,  5,  5,  5,  5,  5,  5,  5],
                [5,  10, 10, 10, 10, 10, 10, 10,  5],
                [5,  10, 15, 15, 15, 15, 15, 10,  5],
                [5,  10, 15, 20, 20, 20, 15, 10,  5],
                [0,  5,  10, 15, 15, 15, 10,  5,  0],
                [0,  0,  5,  10, 10, 10,  5,  0,  0],
                [0,  0,  0,  5,  5,  5,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ],
            [PieceType.GOLD]: [
                [5,  5,  5,  5,  5,  5,  5,  5,  5],
                [10, 10, 10, 10, 10, 10, 10, 10, 10],
                [10, 15, 15, 15, 15, 15, 15, 15, 10],
                [10, 15, 20, 20, 20, 20, 20, 15, 10],
                [5,  10, 15, 15, 15, 15, 15, 10,  5],
                [0,  5,  10, 10, 10, 10, 10,  5,  0],
                [0,  0,  5,  5,  5,  5,  5,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0],
                [0,  0,  0,  0,  0,  0,  0,  0,  0]
            ]
        };
    }

    // 王の安全度評価
    evaluateKingSafety(board) {
        let score = 0;

        // 相手と自分の王の位置を取得
        const [opponentKingRow, opponentKingCol] = this.findKing(board, false);
        const [playerKingRow, playerKingCol] = this.findKing(board, true);

        // 王の周りの守り
        score += this.evaluateKingSurroundings(board, opponentKingRow, opponentKingCol, false);
        score -= this.evaluateKingSurroundings(board, playerKingRow, playerKingCol, true);

        // 玉の遠さによるボーナス
        score += Math.abs(opponentKingRow - 8) * 5; // 相手の玉が後ろにいるほど良い
        score -= Math.abs(playerKingRow - 0) * 5;   // 自分の玉が後ろにいるほど良い

        return score;
    }

    // 王の周りの守りを評価
    evaluateKingSurroundings(board, kingRow, kingCol, isPlayer) {
        let score = 0;
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (const [dRow, dCol] of directions) {
            const row = kingRow + dRow;
            const col = kingCol + dCol;

            if (board.isOnBoard(row, col)) {
                const piece = board.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY && piece.isPlayer === isPlayer) {
                    score += 5; // 味方の駒による守り
                }
            }
        }

        return score;
    }

    // 機動力（可能な手の数）の評価
    evaluateMobility(board) {
        const opponentMoves = this.generateAllMoves(board, false).length;
        const playerMoves = this.generateAllMoves(board, true).length;

        return (opponentMoves - playerMoves) * 0.1;
    }

    // 持ち駒の評価
    evaluateCapturedPieces(board) {
        let score = 0;

        // 持ち駒の数と種類に応じた評価
        const evaluateCaptured = (pieces, isPlayer) => {
            let value = 0;
            for (const piece of pieces) {
                value += PieceValues[piece.type];
                // 同じ種類の持ち駒が複数ある場合、価値を少し割り引く
                const sameTypePieces = pieces.filter(p => p.type === piece.type).length;
                if (sameTypePieces > 1) {
                    value -= (sameTypePieces - 1) * 0.2 * PieceValues[piece.type];
                }
            }
            return isPlayer ? -value : value;
        };

        score += evaluateCaptured(board.capturedPieces.opponent, false);
        score += evaluateCaptured(board.capturedPieces.player, true);

        return score;
    }

    // すべての可能な手を生成
    generateAllMoves(board, isPlayer) {
        const moves = [];

        // 盤上の駒の移動
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board.getPiece(row, col);
                if (piece.type !== PieceType.EMPTY && piece.isPlayer === isPlayer) {
                    const validMoves = board.getValidMoves(row, col);
                    for (const [toRow, toCol] of validMoves) {
                        // 成れる場合は成る手と成らない手の両方を追加
                        if (board.canPromote(row, col, toRow, toCol)) {
                            moves.push({ type: 'move', from: [row, col], to: [toRow, toCol], promote: true });
                            if (!board.mustPromote(row, col, toRow)) {
                                moves.push({ type: 'move', from: [row, col], to: [toRow, toCol], promote: false });
                            }
                        } else {
                            moves.push({ type: 'move', from: [row, col], to: [toRow, toCol], promote: false });
                        }
                    }
                }
            }
        }

        // 持ち駒を打つ手
        const capturedPieces = isPlayer ? board.capturedPieces.player : board.capturedPieces.opponent;
        for (const piece of capturedPieces) {
            const validDrops = board.getValidDropPositions({ ...piece, isPlayer });
            for (const [row, col] of validDrops) {
                moves.push({ type: 'drop', piece: { ...piece, isPlayer }, to: [row, col] });
            }
        }

        return moves;
    }

    // 指定された手を実行
    makeMove(board, move) {
        if (move.type === 'move') {
            board.movePiece(move.from[0], move.from[1], move.to[0], move.to[1], move.promote);
        } else if (move.type === 'drop') {
            board.dropPiece(move.to[0], move.to[1], move.piece);
        }
    }

    // 王の位置を探す
    findKing(board, isPlayer) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board.getPiece(row, col);
                if (piece.type === PieceType.KING && piece.isPlayer === isPlayer) {
                    return [row, col];
                }
            }
        }
        return [-1, -1]; // 王が見つからない場合（通常はありえない）
    }

    // ゲーム終了判定
    isGameOver(board) {
        return board.isCheckmate(true) || board.isCheckmate(false);
    }
}
