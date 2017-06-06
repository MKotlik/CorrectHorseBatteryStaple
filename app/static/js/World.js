function World(grains, changes) {
    this.grains = grains;
    this.changes = changes;
}

World.create = function () {
    var grains = new Array(Math.pow(2 * Constants.MAX_GRAIN_COORD + 1, 3));
    var changes = {
        added: [],
        removed: []
    };
        
    return new World(grains, changes);
};

World.prototype.resetChanges = function () {
    this.changes.added = [];
    this.changes.removed = [];
};

World.prototype.resetGrains = function () {
    this.grains = new Array(Math.pow(2 * Constants.MAX_GRAIN_COORD + 1, 3));
};

World.prototype.createGrain = function (gx, gy, gz) {
    var mesh = new THREE.Mesh(Constants.GRAIN_GEOMETRY,
                              Constants.GRAIN_MATERIAL);

    mesh.position.x = toWorldCoord(gx);
    mesh.position.y = toWorldCoord(gy);
    mesh.position.z = toWorldCoord(gz);

    return mesh;
};

World.prototype.addGrain = function (gx, gy, gz) {
    gx = Math.round(gx);
    gy = Math.round(gy);
    gz = Math.round(gz);
    var index = toGrainIndex(gx, gy, gz);

    if (!this.grains[index]) {
        var grain = this.createGrain(gx, gy, gz);
        this.grains[index] = grain;
        this.changes.added.push(index);
    }
};

World.prototype.removeGrain = function (gx, gy, gz) {
    gx = Math.round(gx);
    gy = Math.round(gy);
    gz = Math.round(gz);
    var index = toGrainIndex(gx, gy, gz);

    if (this.grains[index]) {
        this.grains[index] = undefined;
        this.changes.removed.push(index);
    }
};    

World.prototype.exportGrains = function () {
    var list = [];
    
    for (var grain of this.grains) {
        if (grain) {
            var grainVector = toGrainVector(grain.position);
            var index = toGrainIndex(grainVector.x, grainVector.y, grainVector.z);
            list.push(index);
        }
    }

    return list;
};

World.prototype.importGrains = function (grainIndices) {
    for (var index of grainIndices) {
        this.addGrain(index);
    }
};

World.prototype.isBoundaryGrain = function (grain) {
    var neighbors = this.grainNeighbors(grain);
    return neighbors.length < 7;
};

World.prototype.getOutwardNormals = function (grain) {
    var normals = [];
    
    if (this.isBoundaryGrain(grain)) {
        for (var i = 0; i < grain.geometry.faces.length; i += 2) {
            var normal = grain.geometry.faces[i].normal;
            var grainVector = toGrainVector(grain.position).add(normal);
            var index = toGrainIndex(grainVector.x,
                                     grainVector.y,
                                     grainVector.z);
            
            if (!this.grains[index]) {
                normals.push(normal);
            }
        }
    }

    return normals;
};    

World.prototype.isOutwardInDirection = function (grain, vector) {
    if (this.isBoundaryGrain(grain)) {
        var normals = this.getOutwardNormals(grain);

        for (var normal of normals) {
            if (normal.angleTo(vector) < Math.PI / 2) {
                return true;
            }
        }
    }

    return false;
};

World.prototype.grainsInRadius = function (gx, gy, gz, gr) {
    var grains = [];
    var coords = pointsInRadius(gx, gy, gz, gr);
    gr = Math.round(gr);
    var i, j, k;

    for ([i, j, k] of coords) {
        var grain = this.grains[toGrainIndex(i, j, k)];

        if (grain) {
            grains.push(grain);
        }
    }

    return grains;
};

World.prototype.grainNeighbors = function (grain) {
    var grainVector = toGrainVector(grain.position);
    return this.grainsInRadius(grainVector.x,
                               grainVector.y,
                               grainVector.z,
                               1);
};
    
