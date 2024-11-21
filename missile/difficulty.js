import { Missile } from './missile.js';

// 難易度調整システム
class DifficultySystem {
    constructor() {
        // 基本パラメータ
        this.baseSpawnRate = 0.02;
        this.baseSpeed = 1.5;
        this.baseMissileTypes = ['normal'];

        // 難易度レベルのしきい値を10段階に拡張
        this.difficultyThresholds = [
            { score: 0, level: 1 },      // 基本レベル：通常ミサイルのみ
            { score: 1000, level: 2 },   // ジグザグミサイル追加
            { score: 2500, level: 3 },   // 高速ミサイル追加
            { score: 4000, level: 4 },   // 大型ミサイル追加
            { score: 6000, level: 5 },   // 分裂ミサイル追加
            { score: 8000, level: 6 },   // ボスキャラクター（爆撃機）登場
            { score: 10000, level: 7 },  // 速度とスポーン率が更に上昇
            { score: 12500, level: 8 },  // より高密度な攻撃パターン
            { score: 15000, level: 9 },  // 極めて高い難易度
            { score: 20000, level: 10 }  // 最高難易度
        ];
    }

    // 現在の難易度レベルを取得
    getCurrentLevel(score) {
        for (let i = this.difficultyThresholds.length - 1; i >= 0; i--) {
            if (score >= this.difficultyThresholds[i].score) {
                return this.difficultyThresholds[i].level;
            }
        }
        return 1;
    }

    // ミサイル生成確率を取得（レベルに応じて指数関数的に増加）
    getSpawnRate(score) {
        const level = this.getCurrentLevel(score);
        return this.baseSpawnRate * (1 + (level - 1) * 0.15);
    }

    // ミサイルの速度を取得（レベルに応じて段階的に上昇）
    getMissileSpeed(score) {
        const level = this.getCurrentLevel(score);
        return this.baseSpeed * (1 + (level - 1) * 0.12);
    }

    // ミサイルの種類を取得（レベルに応じて段階的に解放）
    getMissileTypes(score) {
        const level = this.getCurrentLevel(score);
        const types = ['normal'];

        if (level >= 2) types.push('zigzag');    // レベル2で解放
        if (level >= 3) types.push('fast');      // レベル3で解放
        if (level >= 4) types.push('large');     // レベル4で解放
        if (level >= 5) types.push('splitting'); // レベル5で解放

        // レベル7以降は特定のミサイルタイプの出現確率が上昇
        if (level >= 7) {
            types.push(...['fast', 'splitting']); // 高速・分裂ミサイルの出現確率を上げる
        }

        // レベル9以降はさらに危険なミサイルの出現確率が上昇
        if (level >= 9) {
            types.push(...['large', 'splitting', 'splitting']); // 大型・分裂ミサイルの出現確率をさらに上げる
        }

        return types;
    }
}

// 高速ミサイル
class FastMissile extends Missile {
    constructor(canvasWidth) {
        super(canvasWidth);
        this.speed *= 1.5;
        this.width = 8;
        this.height = 16;
        this.color = '#ff8800';
    }
}

// 大型ミサイル
class LargeMissile extends Missile {
    constructor(canvasWidth) {
        super(canvasWidth);
        this.speed *= 0.7;
        this.width = 20;
        this.height = 30;
        this.color = '#ff0000';
        this.health = 2; // 2回の命中で破壊
    }
}

// 分裂ミサイル
class SplittingMissile extends Missile {
    constructor(canvasWidth) {
        super(canvasWidth);
        this.speed *= 0.8;
        this.width = 15;
        this.height = 25;
        this.color = '#ff00ff';
        this.hasSplit = false;
        this.canvasWidth = canvasWidth; // 画面幅を保持
    }

    split(missiles) {
        if (!this.hasSplit && this.y > 200) {
            const splitCount = 2;
            const spreadAngle = Math.PI / 6; // 30度

            for (let i = 0; i < splitCount; i++) {
                const newMissile = new Missile(this.canvasWidth);
                newMissile.x = this.x;
                newMissile.y = this.y;
                newMissile.speed = this.speed * 1.2;

                // 分裂時の角度を計算（左右に分かれる）
                const angle = (i === 0) ? -spreadAngle : spreadAngle;
                newMissile.velocityX = Math.sin(angle) * newMissile.speed;
                newMissile.velocityY = Math.cos(angle) * newMissile.speed;

                missiles.push(newMissile);
            }
            this.hasSplit = true;
        }
    }

    update(missiles) {
        super.update();
        this.split(missiles);
    }

    draw(ctx) {
        super.draw(ctx);

        // 分裂予告エフェクト
        if (!this.hasSplit && this.y > 100) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

class ZigzagMissile extends Missile {
    constructor(canvasWidth) {
        super(canvasWidth);
        this.baseX = this.x;  // 初期X座標を保存
        this.amplitude = 50;   // 振幅（横移動の最大幅）
        this.frequency = 0.02; // 周波数（ジグザグの密度）
        this.speed = 2;       // 基本速度
        this.time = 0;        // 時間経過を追跡
        this.color = '#00ffff'; // シアン色で識別しやすく
        this.width = 12;
        this.height = 22;
    }

    update() {
        // 縦方向の移動
        this.y += this.speed;

        // 横方向の正弦波動作
        this.x = this.baseX + Math.sin(this.time * this.frequency * Math.PI * 2) * this.amplitude;

        // 時間を進める
        this.time += 1;
    }

    draw(ctx) {
        // 通常の描画に加えて、進路予測線を表示
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.width/2, this.y + this.height);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // 軌道予測エフェクト（点線で表示）
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = `rgba(0, 255, 255, 0.3)`;
        ctx.moveTo(this.x, this.y);

        // 未来の軌道を予測表示
        for (let i = 1; i <= 10; i++) {
            const futureY = this.y + i * 20;
            const futureX = this.baseX +
                Math.sin((this.time + i * 5) * this.frequency * Math.PI * 2) * this.amplitude;
            ctx.lineTo(futureX, futureY);
        }

        ctx.stroke();
        ctx.setLineDash([]); // 点線をリセット
    }
}


export { DifficultySystem, FastMissile, LargeMissile, SplittingMissile, ZigzagMissile };
