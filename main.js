
let canvas = document.getElementById("gameCanvas")
canvas.width = 800
canvas.height = 500
const WIDTH = canvas.width
const HEIGHT = canvas.height

const DEFAULT_SHOOT_ANGLE = Math.PI / 2 // straight up
const gravity = 1
const shootSpeed = 10
let playerList = []
let colourList = ['black', 'green', 'red', 'blue', 'yellow']
let gameScreen = []

console.log(colourList[Math.floor(Math.random() * colourList.length)])


const ctx = canvas.getContext("2d");

// Player character
class Player {
    constructor() {
        this.width = 20
        this.height = 10
        this.x = Math.floor((Math.random() * WIDTH) + 1)
        this.y = 100
        this.velX = 0
        this.velY = 0
        this.hp = 100
        this.shootAngle = DEFAULT_SHOOT_ANGLE
        this.colour = colourList[Math.floor(Math.random() * colourList.length)]
    }
}

// bullet
class Bullet {
    constructor(x, y, shootAngle) {
        this.x = x
        this.y = y
        this.velX = Math.cos(shootAngle) * shootSpeed
        this.velY = Math.sin(shootAngle) * shootSpeed
    }
}

function shoot() {

}

//spawns a Player at a random x-position in the sky
function spawnPlayer() {
    /*return {
        x: Math.floor((Math.random() * WIDTH) + 1),
        y: 100,
        velY
        hp: 100
    }*/
    return new Player()
}

// n = how many players connected
function init(n) {
    for (let i = 0; i < n; i++) {
        playerList[i] = spawnPlayer()
        console.log(JSON.stringify(playerList[i]))
    }
    generateTerrain(50)
    update()
}

function update() {
    //temporary
setInterval(() => {
    updatePlayers()


    draw()
    drawPlayers()
    
}, 30)
}

// apply gravity to players
function updatePlayers() {
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        player.velY += gravity
        player.y += player.velY
        console.log('Moved Player to: (' + player.x + ', ' + player.y + ')')
    }
}

function draw(){
    drawPlayers()
    drawTerrain()
}

function drawPlayers() {
    for (let i = 0; i < playerList.length; i++) {
        //ctx.strokeStyle = playerList[i].colour
        let player = playerList[i]
        ctx.fillStyle = player.colour
        ctx.fillRect(player.x, player.y, player.width, player.height)
    }
}

// Generate the terrain for current level
function generateTerrain(amp) {
    for (let x = 0; x < WIDTH; x++) {
        let y = amp * Math.sin(x * Math.PI / 180) + 3/4 * HEIGHT
        y += Math.sin(x * Math.PI / 360) * amp
        y = Math.round(y)

        // initialize the array position
        gameScreen[x] = []

        //Fills the ground with colour
        for (let filler = y; filler < HEIGHT; filler++) {
            gameScreen[x][filler] = 1
        }
    }
    console.log(gameScreen[0])
    drawTerrain()
}

function drawTerrain() {
    ctx.fillStyle = 'cyan'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    for (let x = 0; x < WIDTH; x++) {
        for (let y = 0; y < HEIGHT; y++) {
            if(gameScreen[x][y]) {
                ctx.fillStyle = 'green'
                ctx.fillRect(x, y, 1, 1)
            }
        }

    }
}

