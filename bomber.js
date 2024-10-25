// bomber.js

export class Bomber {
    constructor(canvasWidth) {
        this.width = 50;
        this.height = 30;
        this.x = -this.width;
        this.y = 50;
        this.speed = 2;
        this.color = '#ff3333';
        this.health = 6;  // 6発で撃墜
        this.lastBombTime = 0;
        this.bombInterval = 2000;
        this.canvasWidth = canvasWidth;
        this.destroyed = false;
    }

    update(currentTime, bombs) {
        // 水平移動
        this.x += this.speed;

        // 一定間隔で爆弾を投下
        if (currentTime - this.lastBombTime > this.bombInterval) {
            bombs.push(new Bomb(this.x + this.width/2, this.y + this.height));
            this.lastBombTime = currentTime;
        }

        return this.x < this.canvasWidth + this.width; // 画面内にいる間はtrue
    }

    draw(ctx) {
        // 機体の描画
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // 翼の描画
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height/2);
        ctx.lineTo(this.x + 40, this.y + this.height/2);
        ctx.lineTo(this.x + 35, this.y + this.height);
        ctx.lineTo(this.x + 15, this.y + this.height);
        ctx.closePath();
        ctx.fill();

        // エンジンの描画
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(this.x - 5, this.y + this.height/3, 8, this.height/3);

        // 体力インジケーター
        const healthBarWidth = 40;
        const healthBarHeight = 4;
        const healthSegmentWidth = healthBarWidth / 6;  // 6分割に変更

        for (let i = 0; i < this.health; i++) {
            // 体力に応じて色を変更
            const healthPercentage = this.health / 6;
            let healthColor;
            if (healthPercentage > 0.7) {
                healthColor = '#00ff00'; // 緑
            } else if (healthPercentage > 0.3) {
                healthColor = '#ffff00'; // 黄
            } else {
                healthColor = '#ff0000'; // 赤
            }

            ctx.fillStyle = healthColor;
            ctx.fillRect(
                this.x + (i * healthSegmentWidth),
                this.y - healthBarHeight - 2,
                healthSegmentWidth - 1,
                healthBarHeight
            );
        }

        // ダメージを受けているときは機体が点滅
        if (this.health < 6 && Math.random() < 0.1) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    checkCollision(interceptor) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const dx = centerX - interceptor.x;
        const dy = centerY - interceptor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.width / 2 + interceptor.radius);
    }

    damage() {
        this.health--;
        return this.health <= 0;
    }
}

export class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;  // 当たり判定の半径を大きくする
        this.speed = 3;
        this.color = '#ff0000';
        // 揺れ効果のパラメータ
        this.swayAmplitude = 0.5;
        this.swayFrequency = 0.1;
        this.time = 0;
        this.destroyed = false;
        this.hitbox = {  // 明示的なヒットボックスを追加
            width: 16,
            height: 20
        };
    }

    update() {
        this.y += this.speed;
        // 左右の揺れを追加
        this.x += Math.sin(this.time * this.swayFrequency) * this.swayAmplitude;
        this.time += 1;
    }

    draw(ctx) {
        // 爆弾本体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 尾部
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.radius);
        ctx.lineTo(this.x - this.radius, this.y - this.radius * 2);
        ctx.lineTo(this.x + this.radius, this.y - this.radius * 2);
        ctx.closePath();
        ctx.fill();

        // デバッグ用の当たり判定表示（開発時のみ）
        if (false) {  // 必要に応じてtrueに変更
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeRect(
                this.x - this.hitbox.width/2,
                this.y - this.hitbox.height/2,
                this.hitbox.width,
                this.hitbox.height
            );
        }

        // 落下軌道の予測線
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = `rgba(255, 0, 0, 0.3)`;
        ctx.moveTo(this.x, this.y);
        // 将来の軌道を予測表示
        let futureX = this.x;
        let futureY = this.y;
        for (let i = 0; i < 10; i++) {
            futureY += this.speed * 2;
            futureX += Math.sin((this.time + i) * this.swayFrequency) * this.swayAmplitude;
            ctx.lineTo(futureX, futureY);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }

    checkCollision(interceptor) {
        // 円形の当たり判定（より正確）
        const dx = this.x - interceptor.x;
        const dy = this.y - interceptor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 矩形の当たり判定も追加
        const boxCollision =
            Math.abs(this.x - interceptor.x) < this.hitbox.width/2 + interceptor.radius &&
            Math.abs(this.y - interceptor.y) < this.hitbox.height/2 + interceptor.radius;

        // どちらかの当たり判定が真であれば衝突とみなす
        return distance < (this.radius + interceptor.radius) || boxCollision;
    }

    isInViewport(canvas) {
        return this.y > -this.hitbox.height &&
               this.y < canvas.height + this.hitbox.height &&
               this.x > -this.hitbox.width &&
               this.x < canvas.width + this.hitbox.width;
    }
}

export class BomberSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.bomber = null;
        this.bombs = [];
        this.spawnInterval = 30000; // 30秒ごとに出現
        this.lastSpawnTime = 0;
        this.minimumLevel = 6;
    }

    update(currentTime, level, interceptors, explosions, gameCallbacks) {
        // 爆撃機の生成管理
        if (level >= this.minimumLevel && !this.bomber &&
            currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.bomber = new Bomber(this.canvas.width);
            this.lastSpawnTime = currentTime;
        }

        // 爆撃機の更新
        if (this.bomber) {
            if (!this.bomber.destroyed) {
                if (!this.bomber.update(currentTime, this.bombs)) {
                    this.bomber = null;
                }

                // 迎撃ミサイルとの衝突判定
                for (let i = interceptors.length - 1; i >= 0; i--) {
                    const interceptor = interceptors[i];
                    if (this.bomber.checkCollision(interceptor)) {
                        if (this.bomber.health <= 1) {
                            // 爆撃機が破壊された
                            this.bomber.destroyed = true;
                            gameCallbacks.onBomberDestroyed(this.bomber);
                            this.bomber = null;
                        } else {
                            // ダメージを与える
                            this.bomber.health--;
                            gameCallbacks.onBomberDamaged(this.bomber);
                        }
                        // 迎撃ミサイルを削除
                        interceptors.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // 爆弾の更新と衝突判定
        for (let i = this.bombs.length - 1; i >= 0; i--) {
            const bomb = this.bombs[i];
            bomb.update();

            // 防衛ラインを超えた場合
            const defenseLine = this.canvas.height - 100;
            if (bomb.y > defenseLine && !bomb.destroyed) {
                gameCallbacks.onBombPassDefenseLine(bomb);
                this.bombs.splice(i, 1);
                continue;
            }

            // 迎撃ミサイルとの衝突判定を改善
            for (let j = interceptors.length - 1; j >= 0; j--) {
                const interceptor = interceptors[j];
                if (!bomb.destroyed && bomb.checkCollision(interceptor)) {
                    bomb.destroyed = true;
                    gameCallbacks.onBombIntercepted(bomb, interceptor);
                    interceptors.splice(j, 1);
                    this.bombs.splice(i, 1);
                    break;
                }
            }

            // ビューポート外に出た場合
            if (!bomb.destroyed && !bomb.isInViewport(this.canvas)) {
                this.bombs.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 爆撃機と爆弾の描画
        if (this.bomber && !this.bomber.destroyed) {
            this.bomber.draw(ctx);
        }

        this.bombs.forEach(bomb => bomb.draw(ctx));
    }

    reset() {
        this.bomber = null;
        this.bombs = [];
        this.lastSpawnTime = 0;
    }
}
