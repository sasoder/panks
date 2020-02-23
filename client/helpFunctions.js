
export function radToAngle(rad) {
    return (rad * 180 / Math.PI)
}

export function degreeToRad(degree) {
    return (degree * Math.PI / 180)
}

export function centerOfObject(obj) {
    return [
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
    ]
}