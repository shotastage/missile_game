import { Board } from "./board.js";
import { ShogiAI } from "./ai.js";
import { PieceType, PieceKanji } from "./pieces.js";

export class ShogiGame {
  constructor() {
    this.board = new Board();
    this.ai = new ShogiAI("normal");
    this.selectedCell = null;
    this.selectedCapturedPiece = null;
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
  }

  // セルのクリック処理
  handleCellClick(event) {
    if (!this.playerTurn || this.gameOver) return;

    const cell = event.target.closest(".cell");
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    // 持ち駒が選択されている場合
    if (this.selectedCapturedPiece) {
      if (this.isValidMove(row, col)) {
        this.dropCapturedPiece(row, col);
      }
      this.clearSelection();
      return;
    }

    // 既に駒が選択されている場合
    if (this.selectedCell) {
      const [selectedRow, selectedCol] = this.selectedCell;

      if (this.isValidMove(row, col)) {
        this.moveProcess(selectedRow, selectedCol, row, col);
      } else {
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

  // 持ち駒のクリックハンドラ
  handleCapturedPieceClick(event) {
    if (!this.playerTurn || this.gameOver) return;

    const pieceDiv = event.target.closest(".piece");
    if (!pieceDiv) return;

    const pieceType = this.getPieceTypeFromKanji(pieceDiv.textContent);
    if (!pieceType) return;

    // 既に持ち駒が選択されている場合、選択を解除
    if (this.selectedCapturedPiece) {
      this.clearSelection();
    }

    // 新しい持ち駒を選択
    this.selectedCapturedPiece = pieceType;
    pieceDiv.classList.add("selected");

    // 配置可能な場所を表示
    this.validMoves = this.board.getValidDropPositions({
      type: pieceType,
      isPlayer: true,
    });

    this.updateBoard();
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
    this.selectedCapturedPiece = null;
    this.validMoves = [];

    // 選択状態のクラスを解除
    document.querySelectorAll(".piece.selected").forEach((piece) => {
      piece.classList.remove("selected");
    });

    this.updateBoard();
  }

  // 移動可能な場所かどうかの判定
  isValidMove(row, col) {
    return this.validMoves.some(([r, c]) => r === row && c === col);
  }

  // 移動処理のメインロジック
  async moveProcess(fromRow, fromCol, toRow, toCol) {
    const canPromote = this.board.canPromote(fromRow, fromCol, toRow, toCol);
    const mustPromote = this.board.mustPromote(fromRow, fromCol, toRow);

    let promote = false;
    if (canPromote) {
      if (mustPromote) {
        promote = true;
      } else {
        promote = await this.showPromotionDialog();
      }
    }

    // 移動を実行
    this.makeMove(fromRow, fromCol, toRow, toCol, promote);
  }

  // 持ち駒を配置
  dropCapturedPiece(row, col) {
    const piece = {
      type: this.selectedCapturedPiece,
      isPlayer: true,
    };

    if (this.board.dropPiece(row, col, piece)) {
      this.playerTurn = false;
      this.lastMove = { to: [row, col], isDrop: true };
      this.updateBoard();

      // 詰みチェック
      if (this.board.isCheckmate(false)) {
        this.gameOver = true;
        this.showGameOverDialog("あなたの勝ちです！");
        return;
      }

      setTimeout(() => this.makeAIMove(), 100);
    }
  }

  // 駒の移動
  async makeMove(fromRow, fromCol, toRow, toCol, promote = false) {
    const result = this.board.movePiece(
      fromRow,
      fromCol,
      toRow,
      toCol,
      promote
    );
    this.lastMove = { from: [fromRow, fromCol], to: [toRow, toCol] };
    this.clearSelection();

    // 王を取った場合は即座に勝利
    if (result.type === "win") {
      this.gameOver = true;
      if (result.winner === "player") {
        this.showGameOverDialog("あなたの勝ちです！王を取りました！");
      } else {
        this.showGameOverDialog("コンピュータの勝ちです。王を取られました。");
      }
      return;
    }

    this.playerTurn = false;
    this.updateBoard();

    // 通常の詰みチェック（王が取られていない場合のみ）
    if (this.board.isCheckmate(false)) {
      this.gameOver = true;
      this.showGameOverDialog("あなたの勝ちです！");
      return;
    }

    setTimeout(() => this.makeAIMove(), 100);
  }

  // AIの手を実行するメソッドも更新
  async makeAIMove() {
    if (this.gameOver) return;

    try {
      this.updateBoard();
      const move = this.ai.getBestMove(this.board);

      if (move.type === "move") {
        const result = this.board.movePiece(
          move.from[0],
          move.from[1],
          move.to[0],
          move.to[1],
          move.promote
        );

        // 王を取った場合は即座に勝利
        if (result.type === "win") {
          this.gameOver = true;
          this.showGameOverDialog("コンピュータの勝ちです。王を取られました。");
          return;
        }

        this.lastMove = { from: move.from, to: move.to };
      } else if (move.type === "drop") {
        this.board.dropPiece(move.to[0], move.to[1], move.piece);
        this.lastMove = { to: move.to, isDrop: true };
      }

      this.playerTurn = true;
      this.updateBoard();

      // 通常の詰みチェック（王が取られていない場合のみ）
      if (this.board.isCheckmate(true)) {
        this.gameOver = true;
        this.showGameOverDialog("コンピュータの勝ちです");
      }
    } catch (error) {
      console.error("AIの思考中にエラーが発生しました:", error);
      this.playerTurn = true;
      this.updateBoard();
    }
  }

  // 成り駒ダイアログの表示
  showPromotionDialog() {
    return new Promise((resolve) => {
      const dialog = document.getElementById("promotionDialog");
      dialog.style.display = "flex";

      const handleResponse = (promote) => {
        dialog.style.display = "none";
        resolve(promote);
      };

      // イベントリスナーは一時的に設定
      const yesButton = document.getElementById("promoteYes");
      const noButton = document.getElementById("promoteNo");

      const yesHandler = () => {
        handleResponse(true);
        yesButton.removeEventListener("click", yesHandler);
        noButton.removeEventListener("click", noHandler);
      };

      const noHandler = () => {
        handleResponse(false);
        yesButton.removeEventListener("click", yesHandler);
        noButton.removeEventListener("click", noHandler);
      };

      yesButton.addEventListener("click", yesHandler);
      noButton.addEventListener("click", noHandler);
    });
  }

  // ゲーム終了ダイアログの表示
  showGameOverDialog(message) {
    const dialog = document.getElementById("gameOverDialog");
    const messageElement = document.getElementById("gameOverMessage");
    messageElement.textContent = message;
    dialog.style.display = "flex";
  }

  // 駒の種類を漢字から取得
  getPieceTypeFromKanji(kanji) {
    // 複数の駒がある場合（例：「歩×2」）、最初の文字だけを使用
    const firstKanji = kanji.charAt(0);
    for (const [type, symbol] of Object.entries(PieceKanji)) {
      if (symbol === firstKanji) {
        return parseInt(type);
      }
    }
    return null;
  }

  // 盤面の更新
  updateBoard() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell) => {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      const piece = this.board.getPiece(row, col);

      // セルの内容をクリア
      cell.innerHTML = "";
      cell.className = "cell";

      // 駒の表示
      if (piece.type !== PieceType.EMPTY) {
        const pieceDiv = document.createElement("div");
        pieceDiv.className = `piece ${piece.isPlayer ? "player" : "opponent"}`;
        if (piece.type >= 11) {
          // 成り駒の場合
          pieceDiv.classList.add("promoted");
        }
        pieceDiv.textContent = PieceKanji[piece.type];
        cell.appendChild(pieceDiv);
      }

      // 選択状態の表示
      if (
        this.selectedCell &&
        this.selectedCell[0] === row &&
        this.selectedCell[1] === col
      ) {
        cell.classList.add("selected");
      }

      // 移動可能な場所の表示
      if (this.validMoves.some(([r, c]) => r === row && c === col)) {
        cell.classList.add("valid-move");
      }

      // 最後の移動の表示
      if (this.lastMove) {
        if (
          (this.lastMove.from &&
            this.lastMove.from[0] === row &&
            this.lastMove.from[1] === col) ||
          (this.lastMove.to &&
            this.lastMove.to[0] === row &&
            this.lastMove.to[1] === col)
        ) {
          cell.classList.add("last-move");
        }
      }
    });

    // 持ち駒の更新
    this.updateCapturedPieces();

    // ステータス表示の更新
    const statusElement = document.getElementById("gameStatus");
    if (this.gameOver) {
      statusElement.textContent = "対局終了";
      statusElement.classList.remove("thinking");
    } else if (this.playerTurn) {
      statusElement.textContent = "あなたの番です";
      statusElement.classList.remove("thinking");
    } else {
      statusElement.textContent = "コンピュータが思考中です...";
      statusElement.classList.add("thinking");
    }
  }

  // 持ち駒の表示更新
  updateCapturedPieces() {
    const updateCapturedGrid = (pieces, gridId) => {
      const grid = document.getElementById(gridId);
      grid.innerHTML = "";

      // 持ち駒をグループ化
      const groupedPieces = pieces.reduce((acc, piece) => {
        acc[piece.type] = (acc[piece.type] || 0) + 1;
        return acc;
      }, {});

      // グループ化された持ち駒を表示
      for (const [type, count] of Object.entries(groupedPieces)) {
        const pieceDiv = document.createElement("div");
        pieceDiv.className = "piece captured-piece";
        if (gridId === "playerCapturedGrid") {
          pieceDiv.addEventListener("click", (e) =>
            this.handleCapturedPieceClick(e)
          );
        }
        pieceDiv.textContent = PieceKanji[parseInt(type)];
        if (count > 1) {
          pieceDiv.textContent += `×${count}`;
        }
        grid.appendChild(pieceDiv);
      }
    };

    updateCapturedGrid(this.board.capturedPieces.player, "playerCapturedGrid");
    updateCapturedGrid(
      this.board.capturedPieces.opponent,
      "opponentCapturedGrid"
    );
  }

  // ゲームのリセット
  resetGame() {
    this.board = new Board();
    this.selectedCell = null;
    this.selectedCapturedPiece = null;
    this.playerTurn = true;
    this.gameOver = false;
    this.validMoves = [];
    this.lastMove = null;
    this.updateBoard();

    const gameOverDialog = document.getElementById("gameOverDialog");
    gameOverDialog.style.display = "none";
  }

  // イベントリスナーの設定
  setupEventListeners() {
    const resetButton = document.getElementById("resetButton");
    if (resetButton) {
      resetButton.addEventListener("click", () => this.resetGame());
    }
  }
}
