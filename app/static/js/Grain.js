function Grain(position, color) {
    this.position = position;
    this.color = color || Constants.DEFAULT_GRAIN_COLOR
    this.size = Constants.DEFAULT_GRAIN_SIZE;
    this.dimensions = new THREE.Vector3(this.size, this.size, this.size);
}

Grain.create = function (position, color) {
    return new Grain(position, color);
};

