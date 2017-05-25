function Drawing(width, height, scene) {
    this.width = width;
    this.height = height;
    this.scene = scene;
}

Drawing.create = function (width, height, scene) {
    return new Drawing(width, height, scene);
};

Drawing.prototype.renderGrain = function (grain) {
    this.renderBox(grain.position, grain.dimensions, grain.color);
};

Drawing.prototype.renderBox = function (position, dimensions, color) {
    var geometry = new THREE.BoxGeometry(dimensions.x,
                                         dimensions.y,
                                         dimensions.z);
    
    var material = new THREE.MeshBasicMaterial({
        color: color
    });
    
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);
    
    this.scene.add(mesh);
    return mesh;
};
