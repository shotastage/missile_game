import { Interceptor } from './missile.js';
import { Explosion } from './particle.js';

class AegisSystem {
    constructor(launcher) {
        this.launcher = launcher;
        this.active = false;
        this.timer = 0;
        this.duration = 3 * 1000; // 30秒間
        this.baseFireRate = 100; // 基本発射間隔（ミリ秒）
        this.lastFireTime = 0;
        this.currentLevel = 1;

        // イージス発動のスコア間隔を調整
        this.aegisActivationInterval = 3000; // 3000点ごとに発動
        this.lastActivationScore = 0;
    }

    // レベルに基づいて発射間隔を計算
    getFireRate() {
        // レベルが上がるごとに発射間隔が短くなる（最小30ミリ秒）
        return Math.max(30, this.baseFireRate - (this.currentLevel - 1) * 7);
    }

    // スコアに基づいてイージスシステムを発動するかチェック
    checkActivation(currentScore) {
        const scoreThreshold = Math.floor(currentScore / this.aegisActivationInterval) * this.aegisActivationInterval;
        if (scoreThreshold > this.lastActivationScore) {
            this.lastActivationScore = scoreThreshold;
            return true;
        }
        return false;
    }

    activate() {
        this.active = true;
        this.timer = this.duration;
        this.lastFireTime = Date.now();
        this.showActivationEffect();
    }

    showActivationEffect() {
        let warningElement = document.getElementById('aegisWarning');
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'aegisWarning';
            document.body.appendChild(warningElement);
        }

        const fireRate = this.getFireRate();
        warningElement.innerHTML = `AEGIS SYSTEM ACTIVATED<br>AUTO-INTERCEPT MODE ON<br>Fire Rate: ${fireRate}ms`;
        warningElement.style.display = 'block';

        setTimeout(() => {
            warningElement.style.display = 'none';
        }, 3000);
    }

    update(missiles, interceptors, explosions, currentScore) {
        if (!this.active) {
            // 非アクティブ時にスコアをチェックして発動判定
            if (this.checkActivation(currentScore)) {
                this.activate();
            }
            return;
        }

        const currentTime = Date.now();
        this.timer -= 16.67;

        if (this.timer <= 0) {
            this.active = false;
            return;
        }

        // 現在のレベルを更新（10段階システムに合わせて調整）
        this.currentLevel = Math.floor(currentScore / 2000) + 1;
        this.currentLevel = Math.min(10, this.currentLevel); // 最大レベル10に制限

        // レベルに基づいた発射間隔で処理
        if (currentTime - this.lastFireTime >= this.getFireRate()) {
            this.autoFireInterceptors(missiles, interceptors, explosions);
            this.lastFireTime = currentTime;
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const aegisStatusElement = document.getElementById('aegisStatus');
        const aegisTimerElement = document.getElementById('aegisTimer');
        if (this.active) {
            aegisStatusElement.style.display = 'block';
            aegisStatusElement.classList.add('aegis-active');
            const fireRate = this.getFireRate();
            aegisTimerElement.textContent = `${(this.timer / 1000).toFixed(1)}s (Fire Rate: ${fireRate}ms)`;
        } else {
            aegisStatusElement.style.display = 'none';
            aegisStatusElement.classList.remove('aegis-active');
        }
    }

    autoFireInterceptors(missiles, interceptors, explosions) {
        // ターゲットの数をレベルに応じて増やす（最大15）
        const maxTargets = Math.min(15, Math.floor(this.currentLevel * 1.5));

        // 優先度の高いミサイルを選択
        const targets = missiles
            .filter(m => m.isInViewport(document.getElementById('gameCanvas')))
            .sort((a, b) => {
                // 優先順位付け: y座標（高さ）と速度を考慮
                const scoreA = b.y + (b.speed || 1) * 50;
                const scoreB = a.y + (a.speed || 1) * 50;
                return scoreA - scoreB;
            })
            .slice(0, maxTargets);

        targets.forEach(target => {
            // レベルに応じて複数の迎撃ミサイルを発射
            if (this.currentLevel >= 7) {
                // レベル7以上で扇状発射
                [-5, 0, 5].forEach(angle => {
                    const radianAngle = (angle * Math.PI) / 180;
                    const offsetX = Math.sin(radianAngle) * 50;
                    interceptors.push(new Interceptor(
                        this.launcher.x,
                        this.launcher.y,
                        target.x + offsetX,
                        target.y
                    ));
                });
            } else {
                // 通常発射
                interceptors.push(new Interceptor(
                    this.launcher.x,
                    this.launcher.y,
                    target.x,
                    target.y
                ));
            }

            explosions.push(new Explosion(this.launcher.x, this.launcher.y, 'interceptor'));
        });
    }
}

export { AegisSystem };
