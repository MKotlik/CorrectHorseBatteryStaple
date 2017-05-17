function Drawing(width, height, scene) {
    this.width = width;
    this.height = height;
    this.scene = scene;
}

Drawing.create = function (width, height, scene) {
    return new Drawing(width, height, scene);
}

Drawing.prototype.renderBox = function (x, y, z, l, w, h, color) {
    var geometry = new THREE.BoxGeometry(l, w, h);
    
    var material = new THREE.MeshBasicMaterial({
        color: color
    });

    var mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    return mesh;
};
