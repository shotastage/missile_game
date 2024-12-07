// 敵ミサイルクラス
class Missile {
    constructor(canvasWidth) {
        // ビューポートマージンを考慮した初期位置の設定
        const margin = 1;
        this.x = margin + Math.random() * (canvasWidth - 20 - margin * 2);
        this.y = -20;
        this.width = 10;
        this.height = 20;
        this.speed = 1.5 + Math.random() * 1.5;
        this.color = '#ff4444';
    }

    update() {
        this.y += this.speed;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.width/2, this.y + this.height);
        ctx.lineTo(this.x + this.width/2, this.y + this.height);
        ctx.closePath();
        ctx.fill();
    }

    // ビューポート内かどうかの判定
    isInViewport(canvas) {
        const margin = 1;
        return this.x >= margin && 
               this.x <= canvas.width - margin &&
               this.y >= -this.height &&
               this.y <= canvas.height;
    }
}

// 迎撃ミサイルクラス
class Interceptor {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.maxSpeed = 6;
        this.turnSpeed = 0.15;
        this.color = '#00ff00';
        this.trailPoints = [];
        this.maxTrailLength = 10;

        const angle = Math.atan2(targetY - y, targetX - x);
        this.velocity = {
            x: Math.cos(angle) * this.maxSpeed,
            y: Math.sin(angle) * this.maxSpeed
        };
        this.active = true;
    }

    findTarget(missiles) {
        let nearestMissile = null;
        let shortestDistance = 200;

        for (const missile of missiles) {
            const dx = missile.x - this.x;
            const dy = missile.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestMissile = missile;
            }
        }

        return nearestMissile;
    }

    update(missiles) {
        this.trailPoints.unshift({x: this.x, y: this.y});
        if (this.trailPoints.length > this.maxTrailLength) {
            this.trailPoints.pop();
        }

        const target = this.findTarget(missiles);
        if (target && this.active) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.velocity.y, this.velocity.x);

            let angleDiff = targetAngle - currentAngle;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            const turnAmount = Math.min(Math.abs(angleDiff), this.turnSpeed) * Math.sign(angleDiff);
            const newAngle = currentAngle + turnAmount;

            this.velocity.x = Math.cos(newAngle) * this.maxSpeed;
            this.velocity.y = Math.sin(newAngle) * this.maxSpeed;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }

    draw(ctx) {
        // 軌跡の描画
        ctx.beginPath();
        for (let i = 0; i < this.trailPoints.length; i++) {
            const point = this.trailPoints[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ミサイル本体の描画
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 進行方向を示す先端部分
        const headLength = 12;
        const angle = Math.atan2(this.velocity.y, this.velocity.x);
        ctx.beginPath();
        ctx.moveTo(
            this.x + Math.cos(angle) * (this.radius + headLength),
            this.y + Math.sin(angle) * (this.radius + headLength)
        );
        ctx.lineTo(
            this.x + Math.cos(angle + 2.5) * this.radius,
            this.y + Math.sin(angle + 2.5) * this.radius
        );
        ctx.lineTo(
            this.x + Math.cos(angle - 2.5) * this.radius,
            this.y + Math.sin(angle - 2.5) * this.radius
        );
        ctx.closePath();
        ctx.fill();
    }

    isInViewport(canvas) {
        return this.y > 0 && 
               this.y < canvas.height && 
               this.x > 0 && 
               this.x < canvas.width;
    }
}

// 衝突判定関数
function checkCollision(missile, interceptor) {
    const dx = missile.x - interceptor.x;
    const dy = missile.y - interceptor.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < missile.width + interceptor.radius + 5;
}

export { Missile, Interceptor, checkCollision };

