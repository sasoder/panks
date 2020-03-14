/* import Perlin from './perlin.js'
import Player from '/player.js'
import { centerOfObject } from './helpFunctions.js' */

const Perlin = require('./perlin');
const Player = require('./player');
const { centerOfObject } = require('./helpFunctions');
const model = require('../model.js')

class Game {

    constructor(roomID, players, width, height, amp) {
        this.roomID = roomID
        this.hudBarLen = 100
        this.hudBarHeight = 20
        this.infoPadding = 30
        this.skyColours = ['#e8ffff', '#d9f1ff', '#bfe6ff', '#8cd3ff']
        this.groundColours = ["#ccc", '#bd9874', '#f9e4b7', '#66a103', '#654321', '#ffffffff']
        this.currentPlayerIndex = 0
        this.gravity = 0.3
        this.bullets = []

        this.turnLength = 30
        // the decrement currentplayer timeLeft variable is 0 to start off
        this.decInt = null
        this.gameEndInt = null
        this.gameEndTimer = 5
        this.interval = null

        this.width = width
        this.height = height
        this.skyColour = this.skyColours[Math.floor(Math.random() * this.skyColours.length)]
        this.groundColor = this.groundColours[Math.floor(Math.random() * this.groundColours.length)]
        this.over = false

        // gameState that will be sent at every emission
        this.initGameState = {
            roomID: roomID,
            width: width,
            height: height,
            gravity: this.gravity,
            turnLength: this.turnLength,
            gameEndTimer: this.gameEndTimer,

            skyColour: this.skyColour,
            groundColor: this.groundColor,
            hudBarHeight: this.hudBarHeight,
            hudBarLen: this.hudBarLen,
            infoPadding: this.infoPadding,

            bullets: this.bullets,
            players: [],
            currentPlayerIndex: this.currentPlayerIndex,
            gameScreen: [],
        }

        this.init(players, amp)

    }

    init(players, amp) {
        this.players = this.spawnPlayers(players)
        this.gameScreen = this.generateTerrain(amp)
        this.currentPlayerIndex = 0
        this.currentPlayer.canMove = true
        this.currentPlayer.timeLeft = this.currentPlayer.turnLength
        this.countDownCurrentPlayerTurn()
        this.interval = setInterval(this.update.bind(this), 1000 / 30)

        // update players
        this.initGameState.players = this.players
        this.initGameState.gameScreen = this.gameScreen
        // model.sendInitGameState(this.initGameState)

    }

    destroy() {
        console.log('destroy time')
        // Update database new player stats of the winner
        console.log('winner:', this.currentPlayer)
        model.updatePlayerStats(this.currentPlayer)
        // kill the frickin game!
        clearInterval(this.decInt)
        clearInterval(this.interval)
        clearInterval(this.gameEndInt)
        model.destroyGame(this.roomID)
    }

    // Called from model.js whenever a player leaves the room
    leaveGame(userID) {
        let beforeAmt = this.players.length
        this.players = this.players.filter(p => p.id !== userID)
        // if the person who left wasn't in the game, you shouldn't change players
        if (beforeAmt === this.players.length) return;
        // Change turn if the player whose turn it is, leaves
        // if(this.players.length == 0) this.destroy()
        console.log('players:', this.players)
        switch (this.players.length) {
            case 1:
                // without changing CPI to 0, the game may think that CPI is still > 0, meaning checking attributes of an undefined player
                this.currentPlayerIndex = 0
                this.checkWin()
                break
            case 0:
                this.destroy()
                break
            default:
                clearInterval(this.decInt)
                this.changeTurn()
                break
        }
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
            this.changeTurn()
        }

        if (this.checkWin()) {
            if (this.gameEndInt == null) {
                console.log('setting gameEnd')
                this.gameEndInt = setInterval(() => {
                    this.gameEndTimer--
                    if (this.gameEndTimer <= 0) {
                        this.destroy()
                    }
                    console.log('destroying the game...', this.gameEndTimer)
                }, 1000);
            }
        }

    }

    checkWin() {
        let alivePlayers = this.players.filter(p => p.isAlive)
        if (alivePlayers.length == 1) {
            if (!this.over) {
                this.over = true
                model.gameEnd(this.roomID, alivePlayers[0].id)
            }
            clearInterval(this.decInt)
            return true
        }
        return false
    }


    //spawns a Player at a random x-position in the sky
    spawnPlayers(players) {
        let newPlayers = []
        for (let i = 0; i < players.length; i++) {
            // new player with id as their name
            newPlayers[i] = new Player(this.roomID, this.width, players[i], this.turnLength)
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
                    model.bulletExplosion(this.roomID, this.gameScreen)
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
        this.currentPlayer.resetShots()
        this.currentPlayer.stopMoving()
        do {
            this.nextPlayer()
        } while (!this.currentPlayer.isAlive)
        this.currentPlayer.canMove = true
        this.currentPlayer.addFuel();
        this.currentPlayer.timeLeft = this.currentPlayer.turnLength
        clearInterval(this.decInt)
        this.countDownCurrentPlayerTurn()
        model.updatePlayer(this.roomID, this.currentPlayer.getData())
        model.changeTurn(this.roomID, this.currentPlayerIndex)
    }



    countDownCurrentPlayerTurn() {
        this.decInt = setInterval(() => {
            if (--this.currentPlayer.timeLeft <= 0) {
                clearInterval(this.decInt)
                // don't change turn if the player has already shot
                if (this.bullets.length === 0)
                    this.changeTurn()
            }
        }, 1000);
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

    findPlayerById(id) {
        return this.players.find(player => player.id === id)
    }


    /**
            barrelRight: false,
            barrelLeft: false,
            tankLeft: false,
            tankRight: false,
            pwrUp: false,
            pwrDown: false,
            space: false
     */
    changeBools(id, dirs) {
        let movingPlayer = this.findPlayerById(id)
        if (this.currentPlayer.id != movingPlayer.id) {
            // The client didn't yet get the memo that the turn has changed
            return
        }
        let mT = movingPlayer.moveTank
        let pD = movingPlayer.powerDir
        switch (true) {
            case dirs.barrelLeft:
                mT.barrelLeft = true
                break
            case dirs.barrelRight:
                mT.barrelRight = true
                break
            case dirs.tankLeft:
                mT.tankLeft = true
                mT.tankRight = false
                break
            case dirs.tankRight:
                mT.tankRight = true
                mT.tankLeft = false
                break
            case dirs.space:
                if (this.bullets.length == 0) {
                    let b = this.currentPlayer.shoot()
                    this.bullets.push(b)
                    model.emitShot(this.roomID, b.getData())
                }
                break
            case dirs.pwrDown:
                pD.down = true
                pD.up = false
                break
            case dirs.pwrUp:
                pD.down = false
                pD.up = true
                break
            default:
                // reset if everything is false
                Object.keys(mT).forEach(v => mT[v] = false)
                Object.keys(pD).forEach(v => pD[v] = false)
                break
        }
    }
}

module.exports = Game;