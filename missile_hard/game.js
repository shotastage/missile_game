import { Missile, Interceptor, checkCollision } from './missile.js';
import { Explosion } from './particle.js';
import { AegisSystem } from './aegis.js';
import { DifficultySystem, FastMissile, LargeMissile, SplittingMissile, ZigzagMissile } from './difficulty.js';
import { BomberSystem } from './bomber.js';
import { GameAudio } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.livesElement = document.getElementById('lives');
        this.startButton = document.getElementById('startButton');

        // 音声システムの初期化
        this.audio = new GameAudio();

        // マウス関連の変数
        this.isMouseDown = false;
        this.lastShotTime = 0;
        this.shotCooldown = 300; // 連射の間隔（ミリ秒）
        this.mouseX = 0;
        this.mouseY = 0;

        // ゲーム状態
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.missiles = [];
        this.interceptors = [];
        this.explosions = [];

        // 発射台の設定
        this.launcher = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 30,
            width: 40,
            height: 30,
            color: '#4CAF50'
        };

        // 発射間隔の基本値を設定
        this.baseShotCooldown = 300; // 基本の発射間隔（ミリ秒）
        this.lastShotTime = 0;

        // イージスシステム
        this.aegisSystem = new AegisSystem(this.launcher);

        // 難易度システム
        this.difficultySystem = new DifficultySystem();

        // 爆撃機システム
        this.bomberSystem = new BomberSystem(this.canvas);

        // 難易度表示用のUI要素
        this.levelElement = document.createElement('span');
        this.levelElement.id = 'level';
        document.getElementById('gameInfo').appendChild(document.createTextNode(' | レベル: '));
        document.getElementById('gameInfo').appendChild(this.levelElement);

        // イベントリスナーの設定
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave());
        this.startButton.addEventListener('click', () => this.startGame());
    }

    handleMouseDown(e) {
        this.isMouseDown = true;
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.shoot();
    }

    handleMouseMove(e) {
        if (this.isMouseDown) {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        }
    }

    handleMouseUp() {
        this.isMouseDown = false;
    }

    handleMouseLeave() {
        this.isMouseDown = false;
    }

    startGame() {
        this.gameRunning = true;
        this.score = 0;
        this.lives = 3;
        this.missiles = [];
        this.interceptors = [];
        this.explosions = [];
        this.bomberSystem.reset();
        this.scoreElement.textContent = this.score;
        this.livesElement.textContent = this.lives;
        this.startButton.style.display = 'none';
        this.updateDifficultyDisplay();
        this.gameLoop();
    }

    calculateShotCooldown() {
        const currentLevel = this.difficultySystem.getCurrentLevel(this.score);
        return Math.max(100, this.baseShotCooldown - (currentLevel - 1) * 20);
    }

    fireInterceptor(angleOffset) {
        const dx = this.mouseX - this.launcher.x;
        const dy = this.mouseY - this.launcher.y;
        const baseAngle = Math.atan2(dy, dx);

        const angleInRadians = (angleOffset * Math.PI) / 180;
        const finalAngle = baseAngle + angleInRadians;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetX = this.launcher.x + Math.cos(finalAngle) * distance;
        const targetY = this.launcher.y + Math.sin(finalAngle) * distance;

        this.interceptors.push(new Interceptor(
            this.launcher.x,
            this.launcher.y,
            targetX,
            targetY
        ));
    }

    shoot() {
        if (!this.gameRunning || !this.isMouseDown) return;

        const currentTime = Date.now();
        const shotCooldown = this.calculateShotCooldown();
        const currentLevel = this.difficultySystem.getCurrentLevel(this.score);

        if (currentTime - this.lastShotTime >= shotCooldown) {
            if (currentLevel >= 4) {
                this.fireInterceptor(-10);
                this.fireInterceptor(0);
                this.fireInterceptor(10);
            } else {
                this.fireInterceptor(0);
            }

            this.explosions.push(new Explosion(
                this.launcher.x,
                this.launcher.y,
                'interceptor'
            ));
            this.audio.playExplosionSound('interceptor');

            this.lastShotTime = currentTime;
        }
    }

    updateScore(newScore) {
        const oldScore = this.score;
        this.score = newScore;
        this.scoreElement.textContent = this.score;

        this.aegisSystem.update(this.missiles, this.interceptors, this.explosions, this.score);
    }

    updateDifficultyDisplay() {
        const currentLevel = this.difficultySystem.getCurrentLevel(this.score);
        this.levelElement.textContent = currentLevel;
    }

    createNewMissile() {
        const types = this.difficultySystem.getMissileTypes(this.score);
        const randomType = types[Math.floor(Math.random() * types.length)];

        switch (randomType) {
            case 'fast':
                return new FastMissile(this.canvas.width);
            case 'large':
                return new LargeMissile(this.canvas.width);
            case 'splitting':
                return new SplittingMissile(this.canvas.width);
            case 'zigzag':
                return new ZigzagMissile(this.canvas.width);
            default:
                return new Missile(this.canvas.width);
        }
    }

    drawDefenseLine() {
        const y = this.canvas.height - 100;

        const gradient = this.ctx.createLinearGradient(0, y - 2, 0, y + 2);
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, y - 2, this.canvas.width, 4);

        this.ctx.beginPath();
        this.ctx.setLineDash([5, 15]);
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvas.width, y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText('DEFENSE LINE', this.canvas.width - 10, y - 5);
    }

    drawLauncher() {
        this.ctx.fillStyle = this.launcher.color;
        this.ctx.fillRect(
            this.launcher.x - this.launcher.width/2,
            this.launcher.y - this.launcher.height/2,
            this.launcher.width,
            this.launcher.height
        );
    }

    calculateScore(missile) {
        if (missile instanceof FastMissile) return 200;
        if (missile instanceof LargeMissile) return 300;
        if (missile instanceof SplittingMissile) return 250;
        if (missile instanceof ZigzagMissile) return 150;
        return 100;
    }

    gameOver() {
        this.gameRunning = false;
        alert(`ゲームオーバー！\nスコア: ${this.score}`);
        this.startButton.style.display = 'block';
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.shoot();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.aegisSystem.update(this.missiles, this.interceptors, this.explosions, this.score);

        const currentTime = Date.now();
        const currentLevel = this.difficultySystem.getCurrentLevel(this.score);

        this.bomberSystem.update(
            currentTime,
            currentLevel,
            this.interceptors,
            this.explosions,
            {
                onBombPassDefenseLine: (bomb) => {
                    this.lives--;
                    this.livesElement.textContent = this.lives;
                    this.explosions.push(new Explosion(bomb.x, bomb.y, 'damage'));
                    this.audio.playExplosionSound('damage');
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                },
                onBombIntercepted: (bomb, interceptor) => {
                    this.updateScore(this.score + 100);
                    this.explosions.push(new Explosion(bomb.x, bomb.y, 'normal'));
                    this.audio.playExplosionSound('normal');
                },
                onBomberDestroyed: (bomber) => {
                    this.updateScore(this.score + 1000);
                    this.explosions.push(new Explosion(
                        bomber.x + bomber.width/2,
                        bomber.y + bomber.height/2,
                        'damage'
                    ));
                    this.audio.playExplosionSound('damage');
                },
                onBomberDamaged: (bomber) => {
                    this.explosions.push(new Explosion(
                        bomber.x + bomber.width/2,
                        bomber.y + bomber.height/2,
                        'normal'
                    ));
                    this.audio.playExplosionSound('normal');
                }
            }
        );

        this.bomberSystem.draw(this.ctx);

        const spawnRate = this.difficultySystem.getSpawnRate(this.score);
        if (Math.random() < spawnRate) {
            const newMissile = this.createNewMissile();
            newMissile.speed = this.difficultySystem.getMissileSpeed(this.score);
            this.missiles.push(newMissile);
        }

        this.missiles = this.missiles.filter(missile => {
            missile.update(this.missiles);
            missile.draw(this.ctx);

            const defenseLine = this.canvas.height - 100;
            if (missile.y > defenseLine && missile.isInViewport(this.canvas)) {
                this.lives--;
                this.livesElement.textContent = this.lives;
                this.explosions.push(new Explosion(missile.x, missile.y, 'damage'));
                this.audio.playExplosionSound('damage');
                if (this.lives <= 0) {
                    this.gameOver();
                }
                return false;
            }

            let hit = false;
            this.interceptors = this.interceptors.filter(interceptor => {
                if (!hit && checkCollision(missile, interceptor)) {
                    if (missile instanceof LargeMissile) {
                        missile.health--;
                        if (missile.health > 0) {
                            this.explosions.push(new Explosion(missile.x, missile.y, 'normal'));
                            this.audio.playExplosionSound('normal');
                            return true;
                        }
                    }
                    hit = true;
                    this.updateScore(this.score + this.calculateScore(missile));
                    this.explosions.push(new Explosion(missile.x, missile.y, 'normal'));
                    this.audio.playExplosionSound('normal');
                    return false;
                }
                return true;
            });
            return !hit;
        });

        this.interceptors = this.interceptors.filter(interceptor => {
            interceptor.update(this.missiles);
            interceptor.draw(this.ctx);
            return interceptor.isInViewport(this.canvas);
        });

        this.explosions = this.explosions.filter(explosion => {
            explosion.update();
            explosion.draw(this.ctx);
            return !explosion.isFinished();
        });

        this.drawDefenseLine();
        this.drawLauncher();
        this.updateDifficultyDisplay();
        requestAnimationFrame(() => this.gameLoop());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

export { Game };
