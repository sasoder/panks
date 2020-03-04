/* import Perlin from './perlin.js'
import Player from '/player.js'
import { centerOfObject } from './helpFunctions.js' */

const Perlin = require('./perlin');
const Player = require('./player');
const { centerOfObject } = require('./helpFunctions');

class Game {

    // TODO: Clear event listeners and instead connect to fetches
    // TODO: Remove references to canvas and instead send game state in update

    constructor(numberOfPlayers, width, height, amp) {
        let canvas = document.getElementById("gameCanvas")
        canvas.width = width
        canvas.height = height
        this.ctx = canvas.getContext("2d");

        this.hudBarLen = 100
        this.hudBarHeight = 20
        this.barFillThickness = 3
        this.infoPadding = 30
        this.skyColours = ['#e8ffff', '#d9f1ff', '#bfe6ff', '#8cd3ff']
        this.groundColours = ["#ccc", '#bd9874', '#f9e4b7', '#66a103', '#654321', '#ffffffff']
        this.currentPlayerIndex = 0
        this.gravity = 0.3
        this.players = []
        this.bullets = []

        this.width = width
        this.height = height
        this.skyColour = this.skyColours[Math.floor(Math.random() * this.skyColours.length)]
        this.groundColor = this.groundColours[Math.floor(Math.random() * this.groundColours.length)]
        this.init(numberOfPlayers, amp)
        // Event listeners
        this.keys = {
            up: 38,
            down: 40,
            left: 37,
            right: 39,
            space: 32,
            o: 79,
            p: 80
        }

        this.keydownListener = this.keydownListener.bind(this)
        this.keyupListener = this.keyupListener.bind(this)

        window.addEventListener('keydown', this.keydownListener)
        window.addEventListener('keyup', this.keyupListener)
    }

    init(numberOfPlayers, amp) {
        this.players = this.spawnPlayers(numberOfPlayers)
        this.gameScreen = this.generateTerrain(amp)
        this.currentPlayerIndex = 0
        this.currentPlayer.canMove = true
        this.currentPlayer.isTurn = true
        this.interval = setInterval(this.update.bind(this), 1000 / 30)

    }

    destroy() {
        // kill the frickin game!
        clearInterval(this.interval)

        window.removeEventListener('keydown', this.keydownListener)
        window.removeEventListener('keyup', this.keyupListener)
    }

    update() {
        this.players.forEach(player => player.update(this.gravity, this.gameScreen, this.width, this.height))
        this.bullets.forEach(bullet => bullet.update(this.gravity, this.height))

        if (this.players.filter(p => p.isAlive).length <= 0) {
            this.destroy()
            return
        }

        this.checkCollisions()

        if ((this.bullets.length === 0 && this.currentPlayer.shots === 0) || !this.currentPlayer.isAlive) {
            this.currentPlayer.resetShots()
            this.changeTurn()
        }
        this.draw()
    }
    draw() {
        this.drawTerrain()
        this.drawBullets()
        this.drawPlayers()
        this.drawHud()
    }

    //spawns a Player at a random x-position in the sky
    spawnPlayers(numberOfPlayers) {
        let newPlayers = []
        for (let i = 0; i < numberOfPlayers; i++) {
            newPlayers[i] = new Player(this.width, i)
        }
        return newPlayers
    }

    checkCollisions() {
        this.players.forEach((p) => {
            p.isGrounded = this.terrainCollision(p)

            this.bullets.forEach((bullet, i) => {
                if (this.terrainCollision(bullet) || this.checkEntityCollision(p, bullet)) {
                    bullet.explode(this.players, this.gameScreen, this.width, this.height)
                    this.bullets.splice(i, 1)
                    this.cleanTerrain()
                }
            });

        })
    }

    checkEntityCollision(entity1, entity2) {
        let cent = centerOfObject(entity2)
        // returns true when the bullet is within the bounds of the player p
        return ((cent[0] >= entity1.x && cent[0] <= entity1.x + entity1.width) && (cent[1] >= entity1.y && cent[1] <= entity1.y + entity1.height))
    }

    terrainCollision(entity) {
        if (Math.round(entity.x) <= 0 || Math.round(entity.x + entity.width) >= this.width)
            return true

        if (Math.round(entity.y) > this.height)
            return true

        // if bullet is above game screen it can still move
        if (Math.round(entity.y) < 0)
            return false

        return this.gameScreen[Math.round(centerOfObject(entity)[0])][Math.round(entity.y + entity.height)]
    }

    changeTurn() {
        this.currentPlayer.stopMoving()
        do {
            this.nextPlayer()
        } while (!this.currentPlayer.isAlive)
        this.currentPlayer.canMove = true
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex]
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length
    }

    // draw functions
    drawPlayers() {
        this.players.forEach(p => {
            p.drawPlayer(this.ctx)
        })
    }

    drawBullets() {
        this.bullets.forEach(b => {
            b.drawBullet(this.ctx)
        })
    }
    drawTerrain() {
        this.ctx.fillStyle = this.skyColour
        this.ctx.fillRect(0, 0, this.width, this.height)
        this.ctx.fillStyle = this.groundColor

        let highest = [0, 0]

        // find first terrain occurence in first column
        highest[1] = this.gameScreen[0].indexOf(1)
        let highestFirstX = highest[1] // for the finishing line

        this.ctx.beginPath()
        this.ctx.moveTo(highest[0], highest[1])

        // follow the path
        while (highest[0] < this.width - 1) {
            highest = this.findNextCoords(highest)
            this.ctx.lineTo(highest[0], highest[1])
        }

        // edge case
        this.ctx.lineTo(this.width, highest[1])

        // go to bottom
        while (highest[1] < this.height) {
            highest[1]++
        }
        this.ctx.lineTo(this.width, this.height)
        this.ctx.lineTo(0, this.height)
        this.ctx.lineTo(0, highestFirstX)
        this.ctx.lineWidth = 2
        this.ctx.stroke()
        this.ctx.fill()
    }

    drawHud() {
        this.players.forEach((p, i) => {
            this.ctx.textAlign = 'right'
            this.ctx.font = '15px Arial'
            if (p == this.currentPlayer) this.ctx.fillStyle = 'red'
            else this.ctx.fillStyle = 'black'

            this.ctx.fillText((p.id == this.currentPlayer.id ? '> ' : '') + p.name + ' ' + Math.round(p.score) + ' pts', this.width - this.hudBarLen - this.infoPadding, this.infoPadding + this.infoPadding * i)

            this.ctx.fillStyle = 'grey'
            this.ctx.fillRect(this.width - this.hudBarLen - this.infoPadding / 2, this.infoPadding / 2 + this.infoPadding * i, this.hudBarLen, this.hudBarHeight)

            this.ctx.fillStyle = p.colour
            this.ctx.fillRect(this.width - this.hudBarLen - this.infoPadding / 2 + this.barFillThickness, this.infoPadding / 2 + this.infoPadding * i + this.barFillThickness, (this.hudBarLen - this.barFillThickness * 2) * (p.hp / 100), this.hudBarHeight - this.barFillThickness * 2)



        });

        // Fuel
        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(this.infoPadding * 2, this.infoPadding / 2, this.hudBarLen, this.hudBarHeight)

        this.ctx.textAlign = 'left'
        this.ctx.fillText('Fuel', this.infoPadding / 2, this.infoPadding)

        this.ctx.fillStyle = 'green'
        this.ctx.fillRect(this.infoPadding * 2 + this.barFillThickness, this.infoPadding / 2 + this.barFillThickness, (this.hudBarLen - this.barFillThickness * 2) * (this.currentPlayer.fuel / this.currentPlayer.maxFuel), this.hudBarHeight - this.barFillThickness * 2)

        // Shoot power
        this.ctx.fillStyle = 'black'
        this.ctx.fillRect(this.infoPadding * 2, this.infoPadding / 2 + this.infoPadding, this.hudBarLen, this.hudBarHeight)

        this.ctx.textAlign = 'left'
        this.ctx.fillText('Pwr', this.infoPadding / 2, this.infoPadding + this.infoPadding)
        this.ctx.fillText(this.currentPlayer.shootPower, this.infoPadding * 5 / 2 + this.hudBarLen, this.infoPadding * 2)

        this.ctx.fillStyle = 'red'
        this.ctx.fillRect(this.infoPadding * 2 + this.barFillThickness, this.infoPadding / 2 + this.barFillThickness + this.infoPadding, (this.hudBarLen - this.barFillThickness * 2) * (this.currentPlayer.shootPower / this.currentPlayer.maxShootPower), this.hudBarHeight - this.barFillThickness * 2)

    }

    findNextCoords([x, y]) {

        // up right
        if (y == this.height) y-- // if last draw was at height 800, we need to decrement it for gameScreen's 0-799 indices

        if (this.gameScreen[x + 1][y]) { // there is a pixel beside current to the right
            while (this.gameScreen[x + 1][y - 1]) {
                y--
            }
            return [x + 1, y] // return the highest one
        }

        // down right
        if (!this.gameScreen[x + 1][y]) {
            while (!this.gameScreen[x + 1][y]) {
                y++
                if (y >= this.height) {
                    return [x + 1, this.height]
                }
            }
            return [x + 1, y]
        }

    }

    // moves flying terrain and terrain arches to the ground
    cleanTerrain() {
        for (let col = 0; col < this.width; col++) {
            let amtToDrop = 0
            let firstAir = this.height
            let countDrops = false //whether or not we should count floating terrain or not
            for (let row = this.height - 1; row >= 0; row--) {
                if (!this.gameScreen[col][row]) { // first occurence of air
                    countDrops = true
                    if (firstAir == this.height)
                        firstAir = row
                }
                if (countDrops && this.gameScreen[col][row]) {
                    amtToDrop++ // add one to amount to drop
                }
            }
            for (let row = 0; row <= firstAir; row++) {
                this.gameScreen[col][row] = 0 //clean the terrain

            }
            for (let row = firstAir - amtToDrop + 1; row <= firstAir; row++) {
                this.gameScreen[col][row] = 1 // add the dropped terrain bits

            }

        }
    }

    // Generate the terrain for current level
    generateTerrain(amp) {
        let randomizer = Math.random() * 500
        const noise = new Perlin()
        let gameScreen = []
        let hillPeriodMult = Math.random() + 0.2

        for (let x = 0; x < this.width; x++) {
            // perlin noise
            let y = 2 / 3 * this.height // base val
            y += noise.getValue(x / 80 * hillPeriodMult + randomizer) * amp
            y += noise.getValue(x / 400 + randomizer * 2) * 1 / 4 * this.height

            y = Math.round(y)

            // initialize the array position
            gameScreen[x] = []

            //Fills the underground with terrain
            for (let filler = y; filler < this.height; filler++) {
                gameScreen[x][filler] = 1
            }
        }
        return gameScreen
    }

    keydownListener(e) {
        let mT = this.currentPlayer.moveTank
        switch (e.keyCode) {
            case this.keys.down:
                mT.barrelLeft = true
                break
            case this.keys.up:
                mT.barrelRight = true
                break
            case this.keys.left:
                mT.tankLeft = true
                mT.tankRight = false
                break
            case this.keys.right:
                mT.tankRight = true
                mT.tankLeft = false
                break
            case this.keys.space:
                if (this.bullets.length == 0) {
                    this.bullets.push(this.currentPlayer.shoot())
                }
                break
            case this.keys.o:
                this.currentPlayer.powerDir.down = true
                this.currentPlayer.powerDir.up = false
                break
            case this.keys.p:
                this.currentPlayer.powerDir.down = false
                this.currentPlayer.powerDir.up = true
        }
    }

    keyupListener(e) {
        let mT = this.currentPlayer.moveTank
        switch (e.keyCode) {
            case this.keys.down:
                mT.barrelLeft = false
                break
            case this.keys.up:
                mT.barrelRight = false
                break
            case this.keys.left:
                mT.tankLeft = false
                break
            case this.keys.right:
                mT.tankRight = false
                break
            case this.keys.o:
                this.currentPlayer.powerDir.down = false
                break
            case this.keys.p:
                this.currentPlayer.powerDir.up = false
        }
    }
}

module.exports = Game;