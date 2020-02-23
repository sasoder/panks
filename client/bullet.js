import Entity from './entity.js'
import {degreeToRad, centerOfObject} from './helpFunctions.js'
export default class Bullet extends Entity {
    constructor(x, y, shootAngle, shootPower, shooter) {
        super()
        this.x = x
        this.y = y
        this.velX = Math.cos(degreeToRad(shootAngle)) * shootPower
        this.velY = -Math.sin(degreeToRad(shootAngle)) * shootPower
        this.width = 3
        this.height = 3
        this.bombRadius = 15
        this.colour = 'black'
        this.shooter = shooter
    }

    // apply gravity and velocity to player
    update(gravity) {
        this.velY += gravity
        this.y += this.velY
        this.x += this.velX
    }


    explode(players, gameScreen, width, height) {
        let rad = this.bombRadius
        let x = Math.round(this.x)
        let y = Math.round(this.y)

        for (let col = Math.max(Math.round(x - rad), 0); col < Math.min(Math.round(x + rad), width); col++) {
            for (let row = Math.max(Math.round(y - rad), 0); row < Math.min(Math.round(y + rad), height); row++) {
                let comp1 = col - x
                let comp2 = row - y
    
                if (comp1 * comp1 + comp2 * comp2 <= rad * rad) {
                    gameScreen[col][row] = 0
                }
            }
        }
        players.forEach(p => {
            this.damagePlayer([x, y], this.bombRadius, p)
        });
    }

    damagePlayer(coords, rad, player) {
            let center = centerOfObject(player)
            let comp1 = coords[0] - center[0]
            let comp2 = coords[1] - center[1]
    
            let distFromPlayer = Math.sqrt(comp1 * comp1 + comp2 * comp2)
    
            if (distFromPlayer < rad * 2) {
                let dmg = rad * rad / distFromPlayer
                player.damage(dmg)
                
                if (this.shooter.id == player.id) player.score -= dmg
                else this.shooter.score += dmg
            }
    }

    drawBullet(ctx) {
        ctx.fillStyle = this.colour
        ctx.fillRect(this.x, this.y, this.width, this.height)
    }
}