// game.js
import { ShogiGame } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
    // ゲームインスタンスの作成
    const game = new ShogiGame();

    // 盤面の初期化
    initializeBoard();

    // 盤面の初期化関数
    function initializeBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';

        // 9x9の盤面を作成
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                // セルクリックイベントの追加
                cell.addEventListener('click', (e) => game.handleCellClick(e));

                board.appendChild(cell);
            }
        }

        // ゲームをリセットするボタンのイベントリスナーを設定
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                game.resetGame();
            });
        }
    }

    // プロモーションダイアログのボタン設定
    const promoteYes = document.createElement('button');
    promoteYes.id = 'promoteYes';
    promoteYes.textContent = 'はい';
    promoteYes.className = 'promotion-button';

    const promoteNo = document.createElement('button');
    promoteNo.id = 'promoteNo';
    promoteNo.textContent = 'いいえ';
    promoteNo.className = 'promotion-button';

    const promotionButtons = document.querySelector('.promotion-buttons');
    if (promotionButtons) {
        promotionButtons.appendChild(promoteYes);
        promotionButtons.appendChild(promoteNo);
    }

    // ゲームオーバーダイアログのリセットボタン設定
    const resetGameButton = document.createElement('button');
    resetGameButton.textContent = '新しいゲーム';
    resetGameButton.addEventListener('click', () => {
        game.resetGame();
        document.getElementById('gameOverDialog').style.display = 'none';
    });

    const gameOverContent = document.querySelector('.game-over-content');
    if (gameOverContent) {
        gameOverContent.appendChild(resetGameButton);
    }
});
