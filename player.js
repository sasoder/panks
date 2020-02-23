// Player character

const defaultShootAngle = 45 // 45 degrees
console.log(defaultShootAngle)
const defaultShootSpeed = 0.8
const barrelLen = 15
const barrelThickness = 4

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
        this.score = 0
    }
    updatePlayer() {
        if(this.hp <= 0) {
            this.hp = 0
        }
        if(this.y >= HEIGHT) {
            this.hp = 0
        }
        if(this.shootAngle > 180) {
            this.shootAngle = 180
        }
        if(this.shootAngle < 0) {
            this.shootAngle = 0
        }
    }
    
    applyGravity() {
        // apply gravity and velocity to player
        this.velY += gravity
        this.y += this.velY

    }



    rotateBarrel(dir) {
        console.log('barrel:' + this.shootAngle )
        if(dir === 'left') {
            this.shootAngle += 1
        } else {
            this.shootAngle -= 1
        }
    }

    shoot() {
        let center = centerOfObject(this)

        // TODO spawn from end of barrel
        let barrelEnd = this.getBarrelEnd()
        return (new Bullet(barrelEnd[0], barrelEnd[1], this.shootAngle, this.shootSpeed))
    }

    getBarrelEnd() {
        return [this.x + this.width / 2 + Math.cos(degreeToRad(this.shootAngle)) * barrelLen / 2, this.y - Math.sin(degreeToRad(this.shootAngle)) * barrelLen / 2 - 5]
    }

    drawPlayer() {
        if(this.hp > 0) {
            ctx.translate(this.x + this.width / 2, this.y)

            ctx.rotate(-degreeToRad(this.shootAngle - 90))
            
            ctx.fillStyle = 'black'
            ctx.fillRect(-barrelThickness / 2, -barrelLen, barrelThickness, barrelLen)
            
            ctx.rotate(degreeToRad(this.shootAngle - 90))
            
            ctx.translate(-(this.x + this.width / 2), -(this.y))
            ctx.fillStyle = this.colour
            ctx.fillRect(this.x, this.y, this.width, this.height)
            
        }
    }
}
