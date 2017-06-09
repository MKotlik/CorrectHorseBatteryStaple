/**
 * Contains utility functions, mostly math and grain conversion type functions.
 */

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
    if (max && min > max) {
        return clamp(n, max, min);
    }

    return Math.min(Math.max(n, min), max);
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

function toGrainVector(worldVector) {
    return new THREE.Vector3(toGrainCoord(worldVector.x),
                             toGrainCoord(worldVector.y),
                             toGrainCoord(worldVector.z));
}

function toWorldVector(grainVector) {
    return new THREE.Vector3(toWorldCoord(grainVector.x),
                             toWorldCoord(grainVector.y),
                             toWorldCoord(grainVector.z));
}

function toGrainCoord(worldCoordinate) {
    return toGrainLength(worldCoordinate) + Constants.MAX_GRAIN_COORD;
}

function toWorldCoord(grainCoordinate) {
    return toWorldLength(grainCoordinate - Constants.MAX_GRAIN_COORD);
}

function toGrainIndex(gx, gy, gz) {
    var grainRange = 2 * Constants.MAX_GRAIN_COORD + 1;
    return gx * grainRange * grainRange + gy * grainRange + gz;
}

function toGrainCoords(grainIndex) {
    var grainRange = 2 * Constants.MAX_GRAIN_COORD + 1;
    var gz = grainIndex % grainRange;
    grainIndex = Math.floor(grainIndex / grainRange);
    var gy = grainIndex % grainRange;
    grainIndex = Math.floor(grainIndex / grainRange);
    var gx = grainIndex % grainRange;
    return new THREE.Vector3(gx, gy, gz);
}

function toGrainLength(worldLength) {
    return Math.round(worldLength * Constants.GRAINS_PER_UNIT);
}

function toWorldLength(grainLength) {
    return grainLength / Constants.GRAINS_PER_UNIT;
}

function pointsInRadius(x, y, z, r) {
    if (r < 1) {
        return [[x, y, z]]
    }
    
    var points = [];

    for (var i = -r; i <= r; i++) {
        for (var j = -r; j <= r; j++) {
            for (var k = -r; k <= r; k++) {
                if (i * i + j * j + k * k <= r * r) {
                    points.push([x + i, y + j, z + k]);
                }
            }
        }
    }

    return points;
}

function sumVectorList(list) {
    var ret = new THREE.Vector3();

    for (var vector of list) {
        ret.add(vector);
    }

    return ret;
}
