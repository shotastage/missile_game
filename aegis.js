import { Interceptor } from './missile.js';
import { Explosion } from './particle.js';

class AegisSystem {
    constructor(launcher) {
        this.launcher = launcher;
        this.active = false;
        this.timer = 0;
        this.duration = 30 * 1000; // 30秒間
        this.lastActivationScore = 0;
        this.fireRate = 100; // 通常モードの発射間隔（ミリ秒）
        this.superFireRate = 2000; // スーパーモードの発射間隔（ミリ秒）
        this.lastFireTime = 0;
        this.lastSuperFireTime = 0;

        // スーパーモードフラグ
        this.superMode = true; // スーパーモードを有効化
    }

    activate() {
        this.active = true;
        this.timer = this.duration;
        this.lastFireTime = Date.now();
        this.lastSuperFireTime = Date.now();
        this.showActivationEffect();
    }

    showActivationEffect() {
        let warningElement = document.getElementById('aegisWarning');
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'aegisWarning';
            document.body.appendChild(warningElement);
        }

        warningElement.innerHTML = this.superMode ?
            'AEGIS SYSTEM ACTIVATED<br>SUPER MODE ENGAGED' :
            'AEGIS SYSTEM ACTIVATED<br>AUTO-INTERCEPT MODE ON';
        warningElement.style.display = 'block';

        setTimeout(() => {
            warningElement.style.display = 'none';
        }, 3000);
    }

    update(missiles, interceptors, explosions) {
        if (!this.active) return;

        const currentTime = Date.now();
        this.timer -= 16.67;

        if (this.timer <= 0) {
            this.active = false;
            return;
        }

        // 通常の自動発射処理
        if (currentTime - this.lastFireTime >= this.fireRate) {
            this.autoFireInterceptors(missiles, interceptors, explosions);
            this.lastFireTime = currentTime;
        }

        // スーパーモードの放射状発射処理
        if (this.superMode && currentTime - this.lastSuperFireTime >= this.superFireRate) {
            this.fireSuperModeInterceptors(interceptors, explosions);
            this.lastSuperFireTime = currentTime;
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const aegisStatusElement = document.getElementById('aegisStatus');
        const aegisTimerElement = document.getElementById('aegisTimer');
        if (this.active) {
            aegisStatusElement.style.display = 'block';
            aegisStatusElement.classList.add('aegis-active');
            aegisTimerElement.textContent = (this.timer / 1000).toFixed(1);
        } else {
            aegisStatusElement.style.display = 'none';
            aegisStatusElement.classList.remove('aegis-active');
        }
    }

    autoFireInterceptors(missiles, interceptors, explosions) {
        // 最も危険なミサイルを探す
        const targets = missiles
            .filter(m => m.isInViewport(document.getElementById('gameCanvas')))
            .sort((a, b) => b.y - a.y)
            .slice(0, 10);

        targets.forEach(target => {
            interceptors.push(new Interceptor(
                this.launcher.x,
                this.launcher.y,
                target.x,
                target.y
            ));

            explosions.push(new Explosion(this.launcher.x, this.launcher.y, 'interceptor'));
        });
    }

    fireSuperModeInterceptors(interceptors, explosions) {
        const missileCount = 160; // 一度に発射するミサイルの数
        const angleStep = (Math.PI * 2) / missileCount; // 発射角度の間隔

        // 放射状にミサイルを発射
        for (let i = 0; i < missileCount; i++) {
            const angle = i * angleStep;
            const radius = 300; // 目標点までの距離

            // 円周上の点を計算
            const targetX = this.launcher.x + Math.cos(angle) * radius;
            const targetY = this.launcher.y + Math.sin(angle) * radius;

            // 新しいインターセプターを作成
            const interceptor = new Interceptor(
                this.launcher.x,
                this.launcher.y,
                targetX,
                targetY
            );

            interceptors.push(interceptor);
        }

        // 大きな発射エフェクト
        explosions.push(new Explosion(this.launcher.x, this.launcher.y, 'interceptor'));

        // 追加のエフェクト（円状に4つの小さな爆発）
        for (let i = 0; i < 4; i++) {
            const angle = i * (Math.PI / 2);
            const effectRadius = 20;
            explosions.push(new Explosion(
                this.launcher.x + Math.cos(angle) * effectRadius,
                this.launcher.y + Math.sin(angle) * effectRadius,
                'interceptor'
            ));
        }
    }
}

export { AegisSystem };
