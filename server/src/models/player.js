/* import Entity from './entity.js.js'
import Bullet from './bullet.js.js'
import { degreeToRad, centerOfObject } from './helpFunctions.js.js' */

const Entity = require('./entity');
const Bullet = require('./bullet');
const { degreeToRad, centerOfObject } = require('./helpFunctions');

const model = require('../model.js')

class Player extends Entity {
    // Player character
    constructor(roomID, gameWidth, id) {
        super();
        this.roomID = roomID
        this.defaultShootAngle = 45
        this.maxShootPower = 100
        this.defaultshootPower = 60
        this.barrelLen = 15
        this.barrelThickness = 4
        this.steepNessAbility = 3
        let colourList = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#e6beff', '#fffac8', '#800000', '#aaffc3', '#ffd8b1', '#000075']

        this.x = Math.floor((Math.random() * 8 / 10 * gameWidth) + gameWidth / 10)
        this.width = 20
        this.height = 10
        this.y = 100
        this.velX = 0
        this.velY = 0
        this.colour = colourList[Math.floor(Math.random() * colourList.length)]
        this.maxShots = 1
        this.shots = this.maxShots

        this.hp = 100
        this.shootAngle = this.defaultShootAngle
        this.shootPower = this.defaultshootPower
        this.id = id
        this.score = 0
        this.maxFuel = 500
        this.fuel = this.maxFuel
        this.moveTank = {
            barrelRight: false,
            barrelLeft: false,
            tankLeft: false,
            tankRight: false
        }
        this.powerDir = {
            up: false,
            down: false
        }
        this.canMove = false
        this.isAlive = true
        this.isGrounded = false
    }

    update(gravity, gameScreen, gameWidth, gameHeight) {
        if (!this.isGrounded) {
            model.updatePlayer(this.roomID, this.getData())
            this.applyGravity(gravity)
        } else {
            let tempY = this.y
            this.velY = 0
            this.moveToTop(gameScreen)
            // see if moveToTop has done anything. If it has, emit
            if (tempY !== this.y) {
                model.updatePlayer(this.roomID, this.getData())
            }
        }
        this.inputMove(gameScreen, gameWidth)
        this.changePower()
        if (this.hp <= 0) {
            this.isAlive = false
        }
        if (this.y >= gameHeight) {
            this.hp = 0
        }
        if (this.shootAngle > 180) {
            this.shootAngle = 180
        }
        if (this.shootAngle < 0) {
            this.shootAngle = 0
        }

    }

    damage(dmg) {
        this.hp -= dmg
        if (this.hp < 0) {
            this.hp = 0
        }
        model.updatePlayer(this.roomID, this.getData())
    }

    addScore(dmg) {
        this.score += dmg
        model.updatePlayer(this.roomID, this.getData())
    }

    applyGravity(gravity) {
        // apply gravity and velocity to player
        this.velY += gravity
        this.y += this.velY
    }

    getData() {
        return {
            id: this.id,
            pos: {
                x: this.x,
                y: this.y,
            },
            shootAngle: this.shootAngle,
            shootPower: this.shootPower,
            hp: this.hp,
            score: this.score,
            fuel: this.fuel
        }
    }

    canClimbLeft(gameScreen) {
        let cent = centerOfObject(this)
        return !gameScreen[Math.max(cent[0] - 1, 0)][this.y + this.height - this.steepNessAbility]
    }
    canClimbRight(gameScreen, gameWidth) {
        let cent = centerOfObject(this)
        return !gameScreen[Math.min(cent[0] + 1, gameWidth - 1)][this.y + this.height - this.steepNessAbility]
    }

    stopMoving() {
        this.canMove = false
        this.moveTank.barrelRight = false
        this.moveTank.barrelLeft = false
        this.moveTank.tankRight = false
        this.moveTank.tankLeft = false
    }

    addFuel() {
        this.fuel += Math.round(this.maxFuel / 10)
        if(this.fuel > this.maxFuel) {
            this.fuel = this.maxFuel
        }
    }

    inputMove(gameScreen, gameWidth) {
        if (this.canMove) {
            if (this.moveTank.barrelRight) {
                this.shootAngle -= 1
                model.updatePlayer(this.roomID, this.getData())
            }
            if (this.moveTank.barrelLeft) {
                this.shootAngle += 1
                model.updatePlayer(this.roomID, this.getData())
            }

            if (this.moveTank.tankRight && this.canMoveRight(gameWidth) && this.canClimbRight(gameScreen, gameWidth) && this.fuel > 0) {
                this.x++
                this.fuel--
                if (this.fuel < 0) {
                    this.fuel = 0
                }
                model.updatePlayer(this.roomID, this.getData())
            }
            if (this.moveTank.tankLeft && this.canMoveLeft() && this.canClimbLeft(gameScreen) && this.fuel > 0) {
                this.x--
                this.fuel--
                if (this.fuel < 0) {
                    this.fuel = 0
                }
                model.updatePlayer(this.roomID, this.getData())
            }
        }

    }

    resetShots() {
        this.shots = this.maxShots
    }


    changePower() {
        if (this.powerDir.up) {
            this.increasePower()
            model.updatePlayer(this.roomID, this.getData())
        }

        if (this.powerDir.down) {
            this.decreasePower()
            model.updatePlayer(this.roomID, this.getData())
        }

    }
    increasePower() {
        this.shootPower += 1
        if (this.shootPower > this.maxShootPower) this.shootPower = this.maxShootPower
    }

    decreasePower() {
        this.shootPower -= 1
        if (this.shootPower < 0) this.shootPower = 0
    }



    shoot() {
        this.shots--
        if (this.shots <= 0) this.stopMoving()
        let barrelEnd = this.getBarrelEnd()
        return (new Bullet(this.roomID, barrelEnd[0], barrelEnd[1] + 2, this.shootAngle, this.shootPower / 7, this))
    }

    getBarrelEnd() {
        return [this.x + this.width / 2 + Math.cos(degreeToRad(this.shootAngle)) * this.barrelLen / 2, this.y - Math.sin(degreeToRad(this.shootAngle)) * this.barrelLen / 2 - 5]
    }
}

module.exports = Player;