/* import Perlin from './perlin.js'
import Player from '/player.js'
import { centerOfObject } from './helpFunctions.js' */

const Perlin = require('./perlin');
const Player = require('./player');
const { centerOfObject } = require('./helpFunctions');
const model = require('../model.js')

class Game {

    constructor(roomID, players, width, height, amp) {

        this.hudBarLen = 100
        this.hudBarHeight = 20
        this.barFillThickness = 3
        this.infoPadding = 30
        this.skyColours = ['#e8ffff', '#d9f1ff', '#bfe6ff', '#8cd3ff']
        this.groundColours = ["#ccc", '#bd9874', '#f9e4b7', '#66a103', '#654321', '#ffffffff']
        this.currentPlayerIndex = 0
        this.gravity = 0.3
        this.bullets = []

        this.width = width
        this.height = height
        this.skyColour = this.skyColours[Math.floor(Math.random() * this.skyColours.length)]
        this.groundColor = this.groundColours[Math.floor(Math.random() * this.groundColours.length)]
        // initialize game with array of room users
        
        // gameState that will be sent at every emission
        // TODO can clean this up (gravity, colors etc don't need to be in here)
        this.initGameState = {
            roomID: roomID,
            width: width,
            height: height,
            gravity: this.gravity,
            
            skyColour: this.skyColour,
            groundColor: this.groundColor,
            bullets: this.bullets,
            
            players: [],
            currentPlayerIndex: this.currentPlayerIndex,
            gameScreen: [],
        }

        d
        
        this.init(players, amp)
        
    }

    init(players, amp) {
        this.players = this.spawnPlayers(players)
        this.gameScreen = this.generateTerrain(amp)
        this.currentPlayerIndex = 0
        this.currentPlayer.canMove = true
        this.interval = setInterval(this.update.bind(this), 1000 / 30)

        // update players
        this.initGameState.players = this.players
        this.initGameState.gameScreen = this.gameScreen
        model.sendInitGameState(this.initGameState)

    }

    destroy() {
        // kill the frickin game!
        clearInterval(this.interval)
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
    }
   

    //spawns a Player at a random x-position in the sky
    spawnPlayers(players) {
        let newPlayers = []
        for (let i = 0; i < players.length; i++) {
            // new player with id as their name
            newPlayers[i] = new Player(this.width, players[i])
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
                    let b = this.currentPlayer.shoot()
                    this.bullets.push(b)
                    model.emitShot(b)
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