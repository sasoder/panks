// Player character

const defaultShootAngle = 45 * Math.PI / 180 // 135 degrees
console.log(defaultShootAngle)
const defaultShootSpeed = 0.8

class Player {
    constructor() {
        this.width = 20
        this.height = 10
        this.x = Math.floor((Math.random() * 9 / 10 * WIDTH) + WIDTH / 10)
        this.y = 100
        this.velX = 0
        this.velY = 0
        this.hp = 100
        this.shootAngle = defaultShootAngle
        this.shootSpeed = defaultShootSpeed
        this.colour = colourList[Math.floor(Math.random() * colourList.length)]
    }
    // apply gravity and velocity to player
    updatePlayer() {
        this.velY += gravity
        this.y += this.velY
    }

    drawPlayer() {
        ctx.fillStyle = this.colour
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}
