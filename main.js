
let canvas = document.getElementById("gameCanvas")
canvas.width = 800
canvas.height = 500
const WIDTH = canvas.width
const HEIGHT = canvas.height


const gravity = 1
let playerList = []
let colourList = ['black', 'green', 'red', 'blue', 'yellow']
let gameScreen = []
let currentPlayer
let bulletList = []

console.log(colourList[Math.floor(Math.random() * colourList.length)])


const ctx = canvas.getContext("2d");





function shoot(player) {
    let center = centerOfObject(player)
    bulletList.push(new Bullet(center[0], center[1], currentPlayer.shootAngle, currentPlayer.shootSpeed))
}

function centerOfObject(player) {
    return [
        player.x + player.width / 2,
        player.y + player.height / 2
    ]
}
//spawns a Player at a random x-position in the sky
function spawnPlayer() {
    return new Player()
}

// n = how many players connected
function init(n) {
    for (let i = 0; i < n; i++) {
        playerList[i] = spawnPlayer()
    }
    currentPlayer = playerList[0]

    generateTerrain(50)
    update()
}

function update() {
    //temporary
    setInterval(() => {
        updatePlayers()
        updateBullets()


        draw()

    }, 30)
}

// apply gravity to all bullets, check collision
function updateBullets() {
    for (let i = 0; i < bulletList.length; i++) {
        let bullet = bulletList[i]
        if (!terrainCollision(bullet))
            bullet.updateBullet()
        else
            explodeBullet(bullet)

    }
}

function explodeBullet(bullet) {

}

function updatePlayers() {
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        if (!terrainCollision(player)) {
            player.updatePlayer()
        }
        else
            player.velX = 0

    }
}

function terrainCollision(entity) {
    if (Math.round(entity.x) < 0 || Math.round(entity.x > WIDTH))
        return true


    if (Math.round(entity.y > HEIGHT))
        return true

    // if bullet is above game screen it can still move
    if (Math.round(entity.y < 0))
        return false


    return gameScreen[Math.round(entity.x)][Math.round(entity.y + entity.height)]
}

function draw() {
    drawTerrain()
    drawPlayers()
    drawBullets()
}

function drawPlayers() {
    for (let i = 0; i < playerList.length; i++) {
        playerList[i].drawPlayer()
    }
}

function drawBullets() {
    for (let i = 0; i < bulletList.length; i++) {
        bulletList[i].drawBullet()
    }
}

// Generate the terrain for current level
function generateTerrain(amp) {
    for (let x = 0; x < WIDTH; x++) {
        let y = amp * Math.sin(x * Math.PI / 180) + 3 / 4 * HEIGHT
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
            if (gameScreen[x][y]) {
                ctx.fillStyle = 'green'
                ctx.fillRect(x, y, 1, 1)
            }
        }

    }
}


// Event listeners

const rect = canvas.getBoundingClientRect();

canvas.addEventListener('mousedown', e => {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    shoot(currentPlayer)
    console.log("fire in the hole")
});