// Player character

const defaultShootAngle = 45
const defaultShootSpeed = 0.8
const barrelLen = 15
const barrelThickness = 4
let colourList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#e6beff', '#fffac8', '#800000', '#aaffc3', '#ffd8b1', '#000075']
const steepNessAbility = 3

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
        this.fuel = 1000
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

    isAlive() {
        return this.hp > 0
    }

    canMove(dir) {
        let cent = centerOfObject(this)

        if(this.isGoingLeft(dir)) return !gameScreen[Math.max(cent[0] - 1, 0)][this.y + this.height - steepNessAbility]
        else return !gameScreen[Math.min(cent[0] + 1, WIDTH - 1)][this.y + this.height - steepNessAbility]
    }

    move(dir) {
        if(this.canMove(dir) && this.fuel > 0) {
            this.fuel--
            console.log(this.fuel)
            if(this.isGoingLeft(dir)) this.x = Math.max(this.x - 1, -this.width / 2)
            else this.x = Math.min(this.x + 1, WIDTH - 1 - this.width / 2)
        }
    }

    isGoingLeft(dir) {
        return dir === 'left'
    }

    rotateBarrel(dir) {
        switch (dir) {
            case 'left':
                this.shootAngle += 1
                break
                
            case 'right':
                this.shootAngle -= 1
                break
        }
    }

    shoot() {
        let barrelEnd = this.getBarrelEnd()
        return (new Bullet(barrelEnd[0], barrelEnd[1] + 2, this.shootAngle, this.shootSpeed))
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
