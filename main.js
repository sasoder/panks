
let canvas = document.getElementById("gameCanvas")
canvas.width = 800
canvas.height = 500
const WIDTH = canvas.width
const HEIGHT = canvas.height

const skyColor = "aliceblue",
    groundColor = "#ccc"

const gravity = 0.5
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

    generateTerrain(15)
    //temporary
    setInterval(update, 1000 / 30)
    window.requestAnimationFrame(draw)
}

function update() {
    updatePlayers()
    updateBullets()
}

// apply gravity to all bullets, check collision
function updateBullets() {
    for (let i = 0; i < bulletList.length; i++) {
        let bullet = bulletList[i]
        if (!terrainCollision(bullet))
            bullet.updateBullet()
        else {
            explodeBullet(bullet)
            bulletList.splice(i, 1)
        }

    }
}

function explodeBullet(bullet) {
    let rad = bullet.bombRadius
    let x = Math.round(bullet.x)
    let y = Math.round(bullet.y)
    console.log(x)
    console.log(y)
    for (let row = Math.max(x - rad, 0); row < Math.min(x + rad, WIDTH); row++) {
        for (let col = Math.max(y - rad, 0); col < Math.min(y + rad, HEIGHT); col++) {
            gameScreen[row][col] = 0
        }

    }
}

function updatePlayers() {
    for (let i = 0; i < playerList.length; i++) {
        let player = playerList[i]
        if (!terrainCollision(player)) {
            player.updatePlayer()
        }
        else {
            player.velX = 0
            player.y = moveToTop(player);
        }

    }
}

// returns the y-val of the entity (to make up for it falling too hard into the terrain)
function moveToTop(entity) {
    let x = Math.round(entity.x + entity.width / 2)
    let y = Math.round(entity.y + entity.height)
    while(gameScreen[x][y]) {
        y--
    }
    return y - entity.height + 1
}

function terrainCollision(entity) {
    if (Math.round(entity.x) < 0 || Math.round(entity.x > WIDTH))
        return true

    if (Math.round(entity.y > HEIGHT))
        return true

    // if bullet is above game screen it can still move
    if (Math.round(entity.y < 0))
        return false

    return gameScreen[Math.round(entity.x + entity.width / 2)][Math.round(entity.y + entity.height)]
}

function draw() {
    drawTerrain()
    drawPlayers()
    drawBullets()

    window.requestAnimationFrame(draw)
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
    let randomizer = Math.random()
    for (let x = 0; x < WIDTH; x++) {
        let y = amp * Math.sin(x * Math.PI / 180) + 3 / 4 * HEIGHT
        y += Math.sin(x * Math.PI / (Math.max(randomizer, 0.2) * 150)) * amp
        y = Math.round(y)


        // initialize the array position
        gameScreen[x] = []

        //Fills the ground with colour
        for (let filler = y; filler < HEIGHT; filler++) {
            gameScreen[x][filler] = 1
        }
    }
}

function drawTerrain() {
    ctx.fillStyle = skyColor
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = groundColor

    let x = 0
    let highest = [0, 0]
    let highestY0 = 0

    // find first terrain occurence in first column
    for (let y = 0; y < HEIGHT; y++) {
        if (gameScreen[x][y]) {
            highestY0 = y
            highest = [x, y]
            break
        }
    }

    ctx.beginPath()
    ctx.moveTo(highest[0], highest[1])

    // follow the path
    while (x < WIDTH - 1) {
        highest = findHighestNeighbour(x, highest[1])
        x = highest[0]
        ctx.lineTo(highest[0], highest[1])
    }

    // edge case
    ctx.lineTo(WIDTH, highest[1])

    // go to bottom
    while (highest[1] < HEIGHT) {
        highest[1]++
    }
    ctx.lineTo(WIDTH, HEIGHT)
    ctx.lineTo(0, HEIGHT)
    ctx.lineTo(0, highestY0)
    ctx.fill()
}


function findHighestNeighbour(x, y) {

    //TODO not remove everything on top of right cav shoot
    //TODO fix left cave shot lineTo correctly
    
    if(gameScreen[x + 1][y]) { // there is a pixel beside current to the right
        while (gameScreen[x + 1][y - 1]) {
            y--
        }
        return [x + 1, y] // return the highest one
    }

    //straight down
    if(gameScreen[x][y + 1])
        return [x, y + 1]


    if(gameScreen[x - 1][y]) { //there is a pixel beside current to the left
        console.log('hehe' + [x, y])
        while(gameScreen[x - 1][y]) {
            console.log('hoho' + y)
            y++
            if(y >= HEIGHT) {
                y--
                break
            }
        }
        return [x - 1, y]
    }

    if(!gameScreen[x + 1][y + 1]) {
        while(!gameScreen[x + 1][y + 1]) {
            y++
            if(y >= HEIGHT) {
                y--
                break
            }
        }
        return [x + 1, y]
    }
    // check if there are pixels top right of the current one
    /*if (gameScreen[x + 1][y - 1]) {
        // case where next pixel is two or more up to the right
        while (gameScreen[x + 1][y - 1]) {
            y--
        }
        return [x + 1, y]
    }

    // check if there are pixels to the right of current one
    if (gameScreen[x + 1][y]) {
            return [x + 1, y]
    }

    // check if there are pixels down right of current one
    if (gameScreen[x + 1][y + 1]) {
        return [x + 1, y + 1]
    }

    // Straight down
    if(gameScreen[x][y + 1]) {
        return [x, y + 1]
    }
    
    // There can be cave-like formations, and therefore we also have to check to the left
    // Straight left and down
    console.log('ha')
    console.log(gameScreen[x - 1][y])
    console.log(gameScreen[x][y])
    if(gameScreen[x - 1][y]) {
        while(gameScreen[x - 1][y]) {
            console.log('going down' + y)
            console.log('and left? x: ' + x)
            y++
            if(y >= HEIGHT)
            y--
            break
        }
        console.log('returning: ' + [x - 1, y])
        return [x - 1, y]
    }
    
    // case where next pixel is two or more down to the right
    while (!gameScreen[x + 1][y + 1]) {
        y++
        console.log('no wY')
        if(y >= HEIGHT)
            return [x + 1, HEIGHT - 1]
    }
    console.log('could not match')*/
    

}

// Event listeners

const rect = canvas.getBoundingClientRect();

canvas.addEventListener('mousedown', e => {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    shoot(currentPlayer)
    console.log("fire in the hole")
});
