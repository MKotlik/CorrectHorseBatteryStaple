function Drawing(scene) {
    this.scene = scene;
}

Drawing.create = function () {
    var scene = new THREE.Scene();
    return new Drawing(scene);
};

Drawing.prototype.renderGrain = function (grain) {
    this.renderBox(grain.x, grain.y, grain.z,
                   grain.size, grain.size, grain.size,
                   grain.color);
};

Drawing.prototype.renderBox = function (x, y, z, l, w, h, color) {
    var geometry = new THREE.BoxGeometry(l, w, h);
    
    var material = new THREE.MeshBasicMaterial({
        color: color
    });
    
    var mesh = new THREE.Mesh(geometry, material);

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;
    
    this.scene.add(mesh);
    return mesh;
};
