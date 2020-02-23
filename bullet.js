let shootAmp = 10

class Bullet {
    constructor(x, y, shootAngle, shootSpeed) {
        this.x = x
        this.y = y
        this.velX = Math.cos(degreeToRad(shootAngle)) * shootSpeed * shootAmp
        this.velY = -Math.sin(degreeToRad(shootAngle)) * shootSpeed * shootAmp
        this.width = 3
        this.height = 3
        this.bombRadius = 15
        this.colour = 'black'
    }

    // apply gravity and velocity to player
    updateBullet() {
        this.velY += gravity
        this.y += this.velY
        this.x += this.velX
        this.x = this.x
    }

    drawBullet() {
        ctx.fillStyle = this.colour
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}