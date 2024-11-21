// パーティクルクラス
class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = options.radius || (2 + Math.random() * 2);
        const angle = Math.random() * Math.PI * 2;
        const speed = options.speed || (1 + Math.random() * 3);
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = options.decay || (0.02 + Math.random() * 0.02);
        this.gravity = options.gravity || 0;
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;
        this.velocityY += this.gravity;
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.fill();
        
        // 光の輪効果
        if (this.life > 0.5) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.life * 0.3})`;
            ctx.fill();
        }
    }
}

// 爆発クラス
class Explosion {
    constructor(x, y, type = 'normal') {
        this.particles = [];
        this.x = x;
        this.y = y;
        this.type = type;
        
        let particleCount, colors, particleOptions;
        
        switch(type) {
            case 'damage':
                particleCount = 50;
                colors = ['255, 50, 50', '255, 100, 100', '255, 150, 150'];
                particleOptions = {
                    radius: 3 + Math.random() * 3,
                    speed: 2 + Math.random() * 4,
                    decay: 0.01 + Math.random() * 0.01,
                    gravity: 0.1
                };
                this.shockwave = {
                    radius: 1,
                    maxRadius: 100,
                    alpha: 1
                };
                break;
            case 'normal':
                particleCount = 30;
                colors = ['255, 200, 0', '255, 100, 0', '255, 50, 0'];
                particleOptions = {};
                break;
            case 'interceptor':
                particleCount = 15;
                colors = ['0, 255, 100', '100, 255, 0', '50, 255, 0'];
                particleOptions = {};
                break;
        }

        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(
                x,
                y,
                colors[Math.floor(Math.random() * colors.length)],
                particleOptions
            ));
        }
    }

    update() {
        for (let particle of this.particles) {
            particle.update();
        }
        this.particles = this.particles.filter(particle => particle.life > 0);

        if (this.shockwave) {
            this.shockwave.radius += 5;
            this.shockwave.alpha -= 0.03;
        }
    }

    draw(ctx) {
        if (this.shockwave && this.shockwave.alpha > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shockwave.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.shockwave.alpha})`;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        for (let particle of this.particles) {
            particle.draw(ctx);
        }

        if (this.type === 'damage' && this.shockwave && this.shockwave.alpha > 0.5) {
            ctx.fillStyle = `rgba(255, 0, 0, ${this.shockwave.alpha * 0.2})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    isFinished() {
        return this.particles.length === 0 && 
               (!this.shockwave || this.shockwave.alpha <= 0);
    }
}

export { Particle, Explosion };

