import Game from './game.js'

const playersInput = document.getElementById('num-players')
const widthInput = document.getElementById('width')
const heightInput = document.getElementById('height')
const amplitudeInput = document.getElementById('amp')

document.getElementById('start-btn')
    .addEventListener('click', () => {
        if (document.getElementById('screen').childNodes.length === 0) {
            let c = document.createElement('canvas')
            c.id = 'gameCanvas'
            document.getElementById('screen').appendChild(c)
        }
        // don't have start focused anymore
        document.activeElement.blur();
        start(parseInt(playersInput.value), parseInt(widthInput.value), parseInt(heightInput.value), parseInt(amplitudeInput.value))
    }
    )

let game = null

// eslint-disable-next-line no-unused-vars
function start(n, width, height, amp) {
    if (game !== null) game.destroy()
    game = new Game(n, width, height, amp) //TODO 100 is amplitude, change this to input from user
}
