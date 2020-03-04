
const radToAngle = (rad) => {
    return (rad * 180 / Math.PI)
}

const degreeToRad = (degree) => {
    return (degree * Math.PI / 180)
}

const centerOfObject = (obj) => {
    return [
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
    ]
}

module.exports = {
    radToAngle,
    degreeToRad,
    centerOfObject
}