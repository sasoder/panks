// Player character

const defaultShootAngle = 45 * Math.PI / 180 // 135 degrees
console.log(defaultShootAngle)
const defaultShootSpeed = 0.8

class Player {
    constructor() {
        this.width = 20
        this.height = 10
        this.x = Math.floor((Math.random() * 8 / 10 * WIDTH) + WIDTH / 10)
        this.y = 100
        this.velX = 0
        this.velY = 0
        this.hp = 100
        this.shootAngle = defaultShootAngle
        this.shootSpeed = defaultShootSpeed
        this.colour = colourList[Math.floor(Math.random() * colourList.length)]
        this.name = 'Pierre'
    }
    updatePlayer() {
        if(this.hp <= 0) {
            this.hp = 0
        }
        if(this.y >= HEIGHT) {
            this.hp = 0
        }
    }
    
    applyGravity() {
        // apply gravity and velocity to player
        this.velY += gravity
        this.y += this.velY

    }

    drawPlayer() {
        if(this.hp > 0) {
            ctx.fillStyle = this.colour
            ctx.fillRect(this.x, this.y, this.width, this.height)
        }
    }
}
