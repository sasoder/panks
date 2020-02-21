
var canvas = document.getElementById("gameCanvas")
canvas.width = 800
canvas.height = 500
const WIDTH = canvas.width
const HEIGHT = canvas.height

const ctx = canvas.getContext("2d");

function draw(){

}

// Generate the terrain for current level
function generateTerrain(amp) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'green';
    ctx.beginPath()
    ctx.moveTo(0, 0)
    for (let x = 0; x <= WIDTH; x++) {
        let y = amp * Math.sin(x * Math.PI / 180) + 3/4 * HEIGHT;
        //Fills the ground with colour
        for (let filler = y; y <= HEIGHT; y++) {
            ctx.lineTo(x, filler)
        }
        ctx.lineTo(x, y)
        console.log("Moved to " + x + ", " + y)
    }
    ctx.stroke()
}
