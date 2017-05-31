function sign(n) {
    if (n > 0) {
        return 1;
    } else if (n < 0) {
        return -1;
    } else {
        return 0;
    }
}

function clamp(n, min, max) {
    if (min > max) {
        return clamp(n, max, min);
    }
    
    if (min) {
        if (max) {
            return Math.min(Math.max(n, min), max);
        } else {
            return Math.max(n, min);
        }
    } else {
        if (max) {
            return Math.min(n, max);
        } else {
            return n;
        }
    }
}

function interpolate(x1, y1, x2, y2) {
    var Dx = x2 - x1;
    var Dy = y2 - y1;
    var dx, dy;
    var ret = [];

    if (Dx == 0 && Dy == 0) {
        return [new THREE.Vector2(x1, y1)];
    }

    if (Math.abs(Dy) > Math.abs(Dx)) {
        dx = Dx / Math.abs(Dy);
        dy = sign(Dy);
    } else {
        dx = sign(Dx);
        dy = Dy / Math.abs(Dx);
    }

    for (var x = x1, y = y1; Math.abs(x - x2) > 0 && Math.abs(y - y2) > 0;
         x += dx, y += dy) {
        ret.push(new THREE.Vector2(Math.round(x), Math.round(y)));
    }

    return ret;
}

function toGrainCoord(worldCoordinate) {
    return toGrainLength(worldCoordinate) + Constants.MAX_GRAIN_COORD;
}

function toWorldCoord(grainCoordinate) {
    return toWorldLength(grainCoordinate - Constants.MAX_GRAIN_COORD);
}

function toGrainIndex(gx, gy, gz) {
    var grainRange = 2 * Constants.MAX_GRAIN_COORD;
    return gx * grainRange * grainRange + gy * grainRange + gz;
}

function toGrainLength(worldLength) {
    return Math.round(worldLength * Constants.GRAINS_PER_UNIT);
}

function toWorldLength(grainLength) {
    return grainLength / Constants.GRAINS_PER_UNIT;
}
