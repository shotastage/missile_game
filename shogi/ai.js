import { PieceType, PieceValues, PieceKanji } from "./pieces.js";

export class ShogiAI {
  constructor(difficulty = "normal") {
    this.difficulty = difficulty;
    this.initializeParameters();
    this.moveCount = 0;
    this.timeLimit = 15000; // 15秒の制限時間
    this.logGroups = []; // グループスタックを追加
    this.logBuffer = ""; // ログバッファを追加
    this.initializeConsoleOverrides();
  }

  initializeConsoleOverrides() {
    // オリジナルのコンソール関数を保存
    this.originalConsole = {
      log: console.log,
      group: console.group,
      groupEnd: console.groupEnd,
    };

    // コンソール関数をオーバーライド
    console.group = (label) => {
      this.originalConsole.group(label);
      this.logGroups.push(label);
      this.appendLog(`${"\t".repeat(this.logGroups.length - 1)}${label}`);
    };

    console.groupEnd = () => {
      this.originalConsole.groupEnd();
      this.logGroups.pop();
    };

    console.log = (message) => {
      this.originalConsole.log(message);
      this.appendLog(`${"\t".repeat(this.logGroups.length)}${message}`);
    };
  }

  // ログを追加するメソッド
  appendLog(message) {
    const logContent = document.getElementById("aiLogContent");
    if (logContent) {
      this.logBuffer += message + "\n";
      logContent.textContent = this.logBuffer;
      logContent.scrollTop = logContent.scrollHeight;
    }
  }

  initializeParameters() {
    switch (this.difficulty) {
      case "easy":
        this.maxDepth = 2;
        this.usePositionalEvaluation = false;
        break;
      case "normal":
        this.maxDepth = 3;
        this.usePositionalEvaluation = true;
        break;
      case "hard":
        this.maxDepth = 4;
        this.usePositionalEvaluation = true;
        break;
      default:
        this.maxDepth = 3;
        this.usePositionalEvaluation = true;
    }
  }

  getBestMove(board) {
    this.moveCount++;
    this.startTime = Date.now();
    this.logBuffer = "";
    this.appendLog(`第${this.moveCount}手の思考開始`);

    // 反復深化法の実装
    let currentDepth = 1;
    let bestMove = null;
    let bestScore = -Infinity;

    const possibleMoves = this.generateAllMoves(board, false);

    // 即詰みの手があれば即座に返す
    for (const move of possibleMoves) {
      const boardCopy = board.cloneBoard();
      this.makeMove(boardCopy, move);
      if (boardCopy.isCheckmate(true)) {
        this.appendLog("即詰みの手を発見");
        return move;
      }
    }

    try {
      // 反復深化で探索
      while (currentDepth <= this.maxDepth) {
        if (Date.now() - this.startTime > this.timeLimit) {
          break;
        }

        let alpha = -Infinity;
        let beta = Infinity;
        let bestMoveAtDepth = null;
        let bestScoreAtDepth = -Infinity;

        const movesSortedByValue = this.sortMovesByValue(board, possibleMoves);

        for (const move of movesSortedByValue) {
          const boardCopy = board.cloneBoard();
          this.makeMove(boardCopy, move);

          const score = -this.minimax(
            boardCopy,
            currentDepth - 1,
            -beta,
            -alpha,
            true
          );

          if (score > bestScoreAtDepth) {
            bestScoreAtDepth = score;
            bestMoveAtDepth = move;
          }

          alpha = Math.max(alpha, score);
          if (beta <= alpha) {
            break;
          }
        }

        // より深い探索の結果を保存
        bestMove = bestMoveAtDepth;
        bestScore = bestScoreAtDepth;

        // 現在の探索状況をログに出力
        this.appendLog(`深さ${currentDepth}での探索完了`);
        this.appendLog(`最善手: ${this.formatMove(bestMove)}`);
        this.appendLog(`評価値: ${bestScore}`);

        currentDepth++;
      }
    } catch (e) {
      if (e.message !== "timeout") throw e;
    }

    const endTime = Date.now() - this.startTime;
    this.appendLog(`思考時間: ${endTime}ms`);
    this.appendLog("-------------------");

    return bestMove || possibleMoves[0];
  }

  // 手を読みやすい形式に変換するヘルパーメソッド
  formatMove(move) {
    if (!move) return "なし";

    if (move.type === "move") {
      const from = `${9 - move.from[1]}${move.from[0] + 1}`;
      const to = `${9 - move.to[1]}${move.to[0] + 1}`;
      return `${from}から${to}へ${move.promote ? "成り" : ""}`;
    } else if (move.type === "drop") {
      const to = `${9 - move.to[1]}${move.to[0] + 1}`;
      const piece = PieceKanji[move.piece.type];
      return `持ち駒${piece}を${to}に打つ`;
    }
    return "不明な手";
  }

  // ログを追加するメソッド
  appendLog(message) {
    const logContent = document.getElementById("aiLogContent");
    if (logContent) {
      this.logBuffer += message + "\n";
      logContent.textContent = this.logBuffer;
      logContent.scrollTop = logContent.scrollHeight;
    }
  }

  searchWithTimeLimit(board, depth) {
    let bestMove = null;
    let bestScore = -Infinity;
    let timeout = false;

    const possibleMoves = this.generateAllMoves(board, false);
    const movesSortedByValue = this.sortMovesByValue(board, possibleMoves);

    for (const move of movesSortedByValue) {
      if (Date.now() - this.startTime > this.timeLimit) {
        timeout = true;
        break;
      }

      const boardCopy = board.cloneBoard();
      this.makeMove(boardCopy, move);

      const score = this.minimax(
        boardCopy,
        depth - 1,
        -Infinity,
        Infinity,
        true,
        Date.now()
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return { move: bestMove, score: bestScore, timeout };
  }

  // 手を評価値でソート
  sortMovesByValue(board, moves) {
    return moves.sort((a, b) => {
      const scoreA = this.getQuickMoveScore(board, a);
      const scoreB = this.getQuickMoveScore(board, b);
      return scoreB - scoreA;
    });
  }

  // 手の簡易評価（キャプチャー > 成り > その他）
  getQuickMoveScore(board, move) {
    let score = 0;

    if (move.type === "move") {
      const targetPiece = board.getPiece(move.to[0], move.to[1]);
      if (targetPiece.type !== 0) {
        score += PieceValues[targetPiece.type] * 10;
      }
      if (move.promote) {
        score += 5;
      }
    }

    return score;
  }

  minimax(board, depth, alpha, beta, isMaximizingPlayer, startTime) {
    // 時間制限のチェック
    if (Date.now() - startTime > this.timeLimit) {
      throw new Error("timeout");
    }

    // 終端ノードの評価
    if (depth === 0 || this.isGameOver(board)) {
      return this.evaluatePosition(board);
    }

    const possibleMoves = this.generateAllMoves(board, isMaximizingPlayer);

    // 手の並び替えによる枝刈りの効率化
    const sortedMoves = this.sortMovesByValue(board, possibleMoves);

    if (isMaximizingPlayer) {
      let maxScore = -Infinity;
      for (const move of sortedMoves) {
        const boardCopy = board.cloneBoard();
        this.makeMove(boardCopy, move);
        const score = this.minimax(
          boardCopy,
          depth - 1,
          alpha,
          beta,
          false,
          startTime
        );
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const move of sortedMoves) {
        const boardCopy = board.cloneBoard();
        this.makeMove(boardCopy, move);
        const score = this.minimax(
          boardCopy,
          depth - 1,
          alpha,
          beta,
          true,
          startTime
        );
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  // 局面の評価関数
  evaluatePosition(board) {
    let score = 0;

    // 材料価値の評価
    const materialScore = this.evaluateMaterial(board);

    // 位置の評価
    const positionalScore = this.usePositionalEvaluation
      ? this.evaluatePositional(board)
      : 0;

    // 王の安全度評価
    const kingSafetyScore = this.evaluateKingSafety(board);

    // 機動力の評価
    const mobilityScore = this.evaluateMobility(board);

    // 持ち駒の評価
    const capturedScore = this.evaluateCapturedPieces(board);

    // 各スコアを加算
    score =
      materialScore +
      positionalScore +
      kingSafetyScore +
      mobilityScore +
      capturedScore;

    // 評価結果のログ出力
    const logContent =
      `評価結果:\n` +
      `・材料価値: ${materialScore}\n` +
      `・位置評価: ${positionalScore}\n` +
      `・王の安全度: ${kingSafetyScore}\n` +
      `・機動力: ${mobilityScore}\n` +
      `・持ち駒評価: ${capturedScore}\n` +
      `・総合評価: ${score}`;

    this.appendLog(logContent);

    return score;
  }

  // 手を読みやすい形式に変換するヘルパーメソッド
  formatMove(move) {
    if (!move) return "なし";

    if (move.type === "move") {
      const from = `${9 - move.from[1]}${move.from[0] + 1}`;
      const to = `${9 - move.to[1]}${move.to[0] + 1}`;
      const piece = move.piece ? PieceKanji[move.piece.type] : "駒";
      return `${from}${piece}→${to}${move.promote ? "成" : ""}`;
    } else if (move.type === "drop") {
      const to = `${9 - move.to[1]}${move.to[0] + 1}`;
      const piece = PieceKanji[move.piece.type];
      return `持ち駒${piece}→${to}`;
    }
    return "不明な手";
  }

  // 材料価値の評価
  evaluateMaterial(board) {
    let score = 0;
    console.group("材料価値の詳細");

    // 盤上の駒の評価
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const piece = board.getPiece(row, col);
        if (piece.type !== PieceType.EMPTY) {
          const value = PieceValues[piece.type];
          const contribution = piece.isPlayer ? -value : value;
          if (value > 0) {
            console.log(
              `${9 - col}${row + 1}の${PieceKanji[piece.type]}: ${contribution}`
            );
          }
          score += contribution;
        }
      }
    }

    // 持ち駒の評価
    if (board.capturedPieces.opponent.length > 0) {
      console.group("相手の持ち駒");
      board.capturedPieces.opponent.forEach((piece) => {
        const value = PieceValues[piece.type];
        console.log(`${PieceKanji[piece.type]}: +${value}`);
        score += value;
      });
      console.groupEnd();
    }

    if (board.capturedPieces.player.length > 0) {
      console.group("自分の持ち駒");
      board.capturedPieces.player.forEach((piece) => {
        const value = PieceValues[piece.type];
        console.log(`${PieceKanji[piece.type]}: -${value}`);
        score -= value;
      });
      console.groupEnd();
    }

    console.log(`材料価値の合計: ${score}`);
    console.groupEnd();
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
          const posValue =
            positionValues[piece.type]?.[piece.isPlayer ? row : 8 - row][col] ||
            0;
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
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [15, 15, 15, 15, 15, 15, 15, 15, 15],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [PieceType.LANCE]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [15, 15, 15, 15, 15, 15, 15, 15, 15],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [PieceType.KNIGHT]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [15, 20, 20, 20, 20, 20, 20, 20, 15],
        [10, 15, 15, 15, 15, 15, 15, 15, 10],
        [5, 10, 10, 10, 10, 10, 10, 10, 5],
        [0, 5, 5, 5, 5, 5, 5, 5, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [PieceType.SILVER]: [
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [5, 10, 10, 10, 10, 10, 10, 10, 5],
        [5, 10, 15, 15, 15, 15, 15, 10, 5],
        [5, 10, 15, 20, 20, 20, 15, 10, 5],
        [0, 5, 10, 15, 15, 15, 10, 5, 0],
        [0, 0, 5, 10, 10, 10, 5, 0, 0],
        [0, 0, 0, 5, 5, 5, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      [PieceType.GOLD]: [
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [10, 15, 15, 15, 15, 15, 15, 15, 10],
        [10, 15, 20, 20, 20, 20, 20, 15, 10],
        [5, 10, 15, 15, 15, 15, 15, 10, 5],
        [0, 5, 10, 10, 10, 10, 10, 5, 0],
        [0, 0, 5, 5, 5, 5, 5, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    };
  }

  // 王の安全度評価
  evaluateKingSafety(board) {
    let score = 0;

    // 相手と自分の王の位置を取得
    const [opponentKingRow, opponentKingCol] = this.findKing(board, false);
    const [playerKingRow, playerKingCol] = this.findKing(board, true);

    // 王の周りの守り
    score += this.evaluateKingSurroundings(
      board,
      opponentKingRow,
      opponentKingCol,
      false
    );
    score -= this.evaluateKingSurroundings(
      board,
      playerKingRow,
      playerKingCol,
      true
    );

    // 玉の遠さによるボーナス
    score += Math.abs(opponentKingRow - 8) * 5; // 相手の玉が後ろにいるほど良い
    score -= Math.abs(playerKingRow - 0) * 5; // 自分の玉が後ろにいるほど良い

    return score;
  }

  // 王の周りの守りを評価
  evaluateKingSurroundings(board, kingRow, kingCol, isPlayer) {
    let score = 0;
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
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
        const sameTypePieces = pieces.filter(
          (p) => p.type === piece.type
        ).length;
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
              moves.push({
                type: "move",
                from: [row, col],
                to: [toRow, toCol],
                promote: true,
              });
              if (!board.mustPromote(row, col, toRow)) {
                moves.push({
                  type: "move",
                  from: [row, col],
                  to: [toRow, toCol],
                  promote: false,
                });
              }
            } else {
              moves.push({
                type: "move",
                from: [row, col],
                to: [toRow, toCol],
                promote: false,
              });
            }
          }
        }
      }
    }

    // 持ち駒を打つ手
    const capturedPieces = isPlayer
      ? board.capturedPieces.player
      : board.capturedPieces.opponent;
    for (const piece of capturedPieces) {
      const validDrops = board.getValidDropPositions({ ...piece, isPlayer });
      for (const [row, col] of validDrops) {
        moves.push({
          type: "drop",
          piece: { ...piece, isPlayer },
          to: [row, col],
        });
      }
    }

    return moves;
  }

  // 指定された手を実行
  makeMove(board, move) {
    if (move.type === "move") {
      board.movePiece(
        move.from[0],
        move.from[1],
        move.to[0],
        move.to[1],
        move.promote
      );
    } else if (move.type === "drop") {
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
