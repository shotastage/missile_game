import { Board } from './board.js';
import { ShogiAI } from './ai.js';
import { PieceType, PieceKanji } from './pieces.js';

class ShogiGame {
    constructor() {
        this.board = new Board();
        this.ai = new ShogiAI('normal');
        this.selectedCell = null;
        this.playerTurn = true;
        this.gameOver = false;
        this.validMoves = [];
        this.lastMove = null;
        this.initializeGame();
    }

    // ゲームの初期化
    initializeGame() {
        this.setupEventListeners();
        this.updateBoard();
        this.loadSounds();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 盤面のクリックイベント
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        // リセットボタン
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetGame();
        });

        // 成り駒ダイアログのボタン
        document.getElementById('promoteYes').addEventListener('click', () => {
            this.handlePromotion(true);
        });
        document.getElementById('promoteNo').addEventListener('click', () => {
            this.handlePromotion(false);
        });
    }

    // 効果音の読み込み
    loadSounds() {
        this.moveSound = document.getElementById('moveSound');
        this.captureSound = document.getElementById('captureSound');
    }

    // セルのクリック処理
    handleCellClick(event) {
        if (!this.playerTurn || this.gameOver) return;

        const cell = event.target.closest('.cell');
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // 既に駒が選択されている場合
        if (this.selectedCell) {
            const [selectedRow, selectedCol] = this.selectedCell;
            const piece = this.board.getPiece(selectedRow, selectedCol);

            // 移動可能な場所をクリックした場合
            if (this.isValidMove(row, col)) {
                this.makeMove(selectedRow, selectedCol, row, col);
            } else {
                // 別の自分の駒を選択した場合
                const newPiece = this.board.getPiece(row, col);
                if (newPiece.type !== PieceType.EMPTY && newPiece.isPlayer) {
                    this.selectCell(row, col);
                } else {
                    this.clearSelection();
                }
            }
        } else {
            // 新しく駒を選択する場合
            const piece = this.board.getPiece(row, col);
            if (piece.type !== PieceType.EMPTY && piece.isPlayer) {
                this.selectCell(row, col);
            }
        }
    }

    // 駒の選択
    selectCell(row, col) {
        this.selectedCell = [row, col];
        this.validMoves = this.board.getValidMoves(row, col);
        this.updateBoard();
    }

    // 選択の解除
    clearSelection() {
        this.selectedCell = null;
        this.validMoves = [];
        this.updateBoard();
    }

    // 移動可能な場所かどうかの判定
    isValidMove(row, col) {
        return this.validMoves.some(([r, c]) => r === row && c === col);
    }

    // 駒の移動
    async makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.board.getPiece(fromRow, fromCol);
        const targetPiece = this.board.getPiece(toRow, toCol);
        const canPromote = this.board.canPromote(fromRow, fromCol, toRow, toCol);
        const mustPromote = this.board.mustPromote(fromRow, fromCol, toRow);

        let promote = false;
        if (canPromote) {
            if (mustPromote) {
                promote = true;
            } else {
                // 成るかどうかの選択
                promote = await this.showPromotionDialog();
            }
        }

        // 移動を実行
        this.board.movePiece(fromRow, fromCol, toRow, toCol, promote);

        // 効果音の再生
        if (targetPiece.type !== PieceType.EMPTY) {
            this.captureSound.play();
        } else {
            this.moveSound.play();
        }

        this.lastMove = { from: [fromRow, fromCol], to: [toRow, toCol] };
        this.clearSelection();
        this.playerTurn = false;

        // 詰みチェック
        if (this.board.isCheckmate(false)) {
            this.gameOver = true;
            this.showGameOverDialog('あなたの勝ちです！');
            return;
        }

        // AIの手番
        setTimeout(() => this.makeAIMove(), 500);
    }

    // AIの手を実行
    async makeAIMove() {
        const move = this.ai.getBestMove(this.board);

        if (move.type === 'move') {
            this.board.movePiece(
                move.from[0], move.from[1],
                move.to[0], move.to[1],
                move.promote
            );
            this.lastMove = { from: move.from, to: move.to };
        } else if (move.type === 'drop') {
            this.board.dropPiece(move.to[0], move.to[1], move.piece);
            this.lastMove = { to: move.to, isDrop: true };
        }

        // 効果音の再生
        this.moveSound.play();

        this.updateBoard();
        this.playerTurn = true;

        // 詰みチェック
        if (this.board.isCheckmate(true)) {
            this.gameOver = true;
            this.showGameOverDialog('コンピュータの勝ちです');
            return;
        }
    }

    // 成り駒ダイアログの表示
    showPromotionDialog() {
        return new Promise(resolve => {
            const dialog = document.getElementById('promotionDialog');
            dialog.style.display = 'flex';

            const handleResponse = (promote) => {
                dialog.style.display = 'none';
                resolve(promote);
            };

            document.getElementById('promoteYes').onclick = () => handleResponse(true);
            document.getElementById('promoteNo').onclick = () => handleResponse(false);
        });
    }

    // ゲーム終了ダイアログの表示
    showGameOverDialog(message) {
        const dialog = document.getElementById('gameOverDialog');
        const messageElement = document.getElementById('gameOverMessage');
        messageElement.textContent = message;
        dialog.style.display = 'flex';
    }

    // 盤面の更新
    updateBoard() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const piece = this.board.getPiece(row, col);

            // セルの内容をクリア
            cell.innerHTML = '';
            cell.className = 'cell';

            // 駒の表示
            if (piece.type !== PieceType.EMPTY) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = `piece ${piece.isPlayer ? 'player' : 'opponent'}`;
                if (piece.type >= 11) { // 成り駒の場合
                    pieceDiv.classList.add('promoted');
                }
                pieceDiv.textContent = PieceKanji[piece.type];
                cell.appendChild(pieceDiv);
            }

            // 選択状態の表示
            if (this.selectedCell && this.selectedCell[0] === row && this.selectedCell[1] === col) {
                cell.classList.add('selected');
            }

            // 移動可能な場所の表示
            if (this.validMoves.some(([r, c]) => r === row && c === col)) {
                cell.classList.add('valid-move');
            }

            // 最後の移動の表示
            if (this.lastMove) {
                if ((this.lastMove.from && this.lastMove.from[0] === row && this.lastMove.from[1] === col) ||
                    (this.lastMove.to && this.lastMove.to[0] === row && this.lastMove.to[1] === col)) {
                    cell.classList.add('last-move');
                }
            }
        });

        // 持ち駒の更新
        this.updateCapturedPieces();

        // ステータス表示の更新
        const statusElement = document.getElementById('gameStatus');
        if (this.gameOver) {
            statusElement.textContent = '対局終了';
        } else {
            statusElement.textContent = this.playerTurn ? 'あなたの番です' : 'コンピュータの番です';
        }
    }

    // 持ち駒の表示更新
    updateCapturedPieces() {
        const updateCapturedGrid = (pieces, gridId) => {
            const grid = document.getElementById(gridId);
            grid.innerHTML = '';

            // 持ち駒を種類ごとにグループ化
            const groupedPieces = pieces.reduce((acc, piece) => {
                acc[piece.type] = (acc[piece.type] || 0) + 1;
                return acc;
            }, {});

            // グループ化された持ち駒を表示
            for (const [type, count] of Object.entries(groupedPieces)) {
                const pieceDiv = document.createElement('div');
                pieceDiv.className = 'piece captured-piece';
                pieceDiv.textContent = PieceKanji[parseInt(type)];
                if (count > 1) {
                    pieceDiv.textContent += `×${count}`;
                }
                grid.appendChild(pieceDiv);
            }
        };

        updateCapturedGrid(this.board.capturedPieces.player, 'playerCapturedGrid');
        updateCapturedGrid(this.board.capturedPieces.opponent, 'opponentCapturedGrid');
    }

    // ゲームのリセット
    resetGame() {
        this.board = new Board();
        this.selectedCell = null;
        this.playerTurn = true;
        this.gameOver = false;
        this.validMoves = [];
        this.lastMove = null;
        this.updateBoard();

        const gameOverDialog = document.getElementById('gameOverDialog');
        gameOverDialog.style.display = 'none';
    }
}

// ゲームの開始
document.addEventListener('DOMContentLoaded', () => {
    new ShogiGame();
});
