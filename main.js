
let canvas = document.getElementById("gameCanvas")
canvas.width = 800
canvas.height = 500
const WIDTH = canvas.width
const HEIGHT = canvas.height

const hpBarLen = 100
const hpBarHeight = 20
const infoPadding = 30

const skyColor = "aliceblue",
    groundColor = "#ccc"

const gravity = 0.5
let playerList = []
let colourList = ['black', 'green', 'red', 'blue', 'yellow', 'purple', 'brown', 'teal', 'tomato']
let gameScreen = []
let currentPlayer
let bulletList = []

console.log(colourList[Math.floor(Math.random() * colourList.length)])

const ctx = canvas.getContext("2d");


function centerOfObject(obj) {
    return [
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
    ]
}
//spawns a Player at a random x-position in the sky
function spawnPlayer() {
    return new Player()
}

// n = how many players connected
let interval
let gameStarted = false
function init(n) {
    gameStarted = true
    for (let i = 0; i < n; i++) {
        playerList[i] = spawnPlayer()
    }
    currentPlayer = playerList[0]

    generateTerrain(100)
    //temporary
    console.log(interval)
    if (interval) clearInterval(interval)
    interval = setInterval(update, 1000 / 30)

}
function update() {
    updateBullets()
    updatePlayers()
    draw()
}

function draw() {
    drawTerrain()
    drawBullets()
    drawPlayers()
    drawPlayerInfo()


}
// apply gravity to all bullets, check collision
function updateBullets() {
    bulletList.forEach((bullet, i) => {
        if (terrainCollision(bullet) || playerCollision(bullet)) {
            explodeBullet(bullet)
            bulletList.splice(i, 1)
        }
        else {
            bullet.updateBullet()
        }
    });
}

function explodeBullet(bullet) {
    let rad = bullet.bombRadius
    let x = Math.round(bullet.x)
    let y = Math.round(bullet.y)
    for (let col = Math.max(Math.round(x - rad), 0); col < Math.min(Math.round(x + rad), WIDTH); col++) {
        for (let row = Math.max(Math.round(y - rad), 0); row < Math.min(Math.round(y + rad), HEIGHT); row++) {
            let comp1 = col - x
            let comp2 = row - y

            if (comp1 * comp1 + comp2 * comp2 <= rad * rad) {
                gameScreen[col][row] = 0
            }
        }
    }
    damagePlayers([x, y], bullet.bombRadius)
    cleanTerrain()
}

function damagePlayers(coords, rad) {
    playerList.forEach(p => {
        let center = centerOfObject(p)
        let comp1 = coords[0] - center[0]
        let comp2 = coords[1] - center[1]

        if (comp1 * comp1 + comp2 * comp2 < rad * rad * 2) {
            let dmg = Math.sqrt(comp1 * comp1 + comp2 * comp2) / rad * 25
            p.hp -= dmg

            // TODO this gives the player who kills an  "overkill" dmg boost, even when they are dead - maybe move dead players away?
            if (p == currentPlayer)
                currentPlayer.score -= Math.round(dmg)
            else
                currentPlayer.score += Math.round(dmg)
        }
    })
}

function updatePlayers() {
    playerList.forEach(p => {
        p.updatePlayer()
        if (!terrainCollision(p)) {
            p.applyGravity()
        } else {
            p.velY = 0
            p.y = moveToTop(p);
        }

    })

}

// returns the y-val of the entity (to make up for it falling too hard into the terrain)
function moveToTop(entity) {
    let x = Math.round(entity.x + entity.width / 2)
    let y = Math.round(entity.y + entity.height)
    while (gameScreen[x][y]) {
        y--
    }
    return y - entity.height + 1
}

function playerCollision(bullet) {
    let centerBullet = centerOfObject(bullet)
    // returns true when the bullet is within the bounds of the first player it flies through
    return playerList.some(p => {
        if ((centerBullet[0] >= p.x && centerBullet[0] <= p.x + p.width) && (centerBullet[1] >= p.y && centerBullet[1] <= p.y + p.height)) {
            return true
        }
    })
}

function terrainCollision(entity) {
    if (Math.round(entity.x) <= 0 || Math.round(entity.x + entity.width) >= WIDTH)
        return true

    if (Math.round(entity.y) > HEIGHT)
        return true

    // if bullet is above game screen it can still move
    if (Math.round(entity.y) < 0)
        return false

    return gameScreen[Math.round(centerOfObject(entity)[0])][Math.round(entity.y + entity.height)]
}

// moves flying terrain and terrain arches to the ground
function cleanTerrain() {
    for (let col = 0; col < WIDTH; col++) {
        let amtToDrop = 0
        let firstAir = HEIGHT
        let countDrops = false //whether or not we should count floating terrain or not
        for (let row = HEIGHT - 1; row >= 0; row--) {
            if (!gameScreen[col][row]) { // first occurence of air
                countDrops = true
                if (firstAir == HEIGHT)
                    firstAir = row
            }
            if (countDrops && gameScreen[col][row]) {
                amtToDrop++ // add one to amount to drop
            }
        }
        for (let row = 0; row <= firstAir; row++) {
            gameScreen[col][row] = 0 //clean the terrain

        }
        for (let row = firstAir - amtToDrop + 1; row <= firstAir; row++) {
            gameScreen[col][row] = 1 // add the dropped terrain bits

        }

    }
}

const slopeAt = [];
for (let i = 0; i < 10; i++) {
    slopeAt[i] = (Math.random() * 2) - 1;
}
function samplePerlin(x) {
    const lo = Math.floor(x);
    const hi = lo + 1;
    const dist = x - lo;
    loSlope = slopeAt[lo];
    hiSlope = slopeAt[hi];
    loPos = loSlope * dist;
    hiPos = -hiSlope * (1 - dist);
    const u = dist * dist * (3.0 - 2.0 * dist);  // cubic curve
    return (loPos * (1 - u)) + (hiPos * u);  // interpolate
}


// Generate the terrain for current level
function generateTerrain(amp) {
    let randomizer = Math.random()
    const noise = new Perlin()



    for (let x = 0; x < WIDTH; x++) {
        // perlin noise
        let y = noise.getValue(x * Math.min(0.03 * randomizer, 0.02)) * amp + 300

        y = Math.round(y)

        // initialize the array position
        gameScreen[x] = []

        //Fills the ground with colour
        for (let filler = y; filler < HEIGHT; filler++) {
            gameScreen[x][filler] = 1
        }
    }
}


// returns true if the coordinates are the same
function coordsEqual(coord1, coord2) {
    if (coord1[0] === coord2[0] && coord1[1] === coord2[1]) {
        return true
    }
    return false
}

function findHighestNeighbour([x, y]) {

    // TODO can't go all the way down

    if (gameScreen[x + 1][y]) { // there is a pixel beside current to the right
        while (gameScreen[x + 1][y - 1]) {
            y--
        }
        return [x + 1, y] // return the highest one
    }

    //straight down
    if (gameScreen[x][y + 1]) return [x, y + 1]

    if (!gameScreen[x + 1][y + 1]) {
        while (!gameScreen[x + 1][y + 1]) {
            y++
            if (y >= HEIGHT) {
                y--
                break
            }
        }
        return [x + 1, y]
    }


}

// draw functions
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
function drawTerrain() {
    ctx.fillStyle = skyColor
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.fillStyle = groundColor

    let highest = [0, 0]

    // find first terrain occurence in first column
    highest[1] = gameScreen[0].indexOf(1)
    highestFirstX = highest[1] // for the finishing line

    ctx.beginPath()
    ctx.moveTo(highest[0], highest[1])

    // follow the path
    while (highest[0] < WIDTH - 1) {
        highest = findHighestNeighbour(highest)
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
    ctx.lineTo(0, highestFirstX)
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fill()
}

function drawPlayerInfo() {
    playerList.forEach((p, i) => {
        ctx.textAlign = 'right'
        ctx.fillStyle = 'black'
        ctx.fillText(p.name + ' ' + p.score + ' pts', WIDTH - hpBarLen - infoPadding, infoPadding + infoPadding * i)

        ctx.fillStyle = 'grey'
        ctx.fillRect(WIDTH - hpBarLen - infoPadding / 2, infoPadding / 2 + infoPadding * i, hpBarLen, hpBarHeight)

        ctx.fillStyle = p.colour
        ctx.fillRect(WIDTH - hpBarLen - infoPadding / 2 + 5, infoPadding / 2 + infoPadding * i + 5, (hpBarLen - 10) * (p.hp / 100), hpBarHeight - 10)

    });
}

function radToAngle(rad) {
    return (rad * 180 / Math.PI)
}

function degreeToRad(degree) {
    return (degree * Math.PI / 180)
}

// Event listeners

const rect = canvas.getBoundingClientRect();

canvas.addEventListener('mousedown', e => {
    x = e.clientX - rect.left;
    y = e.clientY - rect.top;
    console.log("fire in the hole")
});

window.addEventListener('keydown', e => {

    console.log('key down')
    let keys = {
        left: 37,
        right: 39,
        space: 32
    }

    if (gameStarted) {

        switch (e.keyCode) {
            case keys.left:
                currentPlayer.rotateBarrel('left')
                break
            case keys.right:
                currentPlayer.rotateBarrel('right')
                break
            case keys.space:
                bulletList.push(currentPlayer.shoot())
                break
        }
    }

})
