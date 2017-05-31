function Grain(x, y, z, color) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color || Constants.DEFAULT_GRAIN_COLOR;
    this.size = Constants.GRAIN_SIZE;
}

Grain.create = function (x, y, z, color) {
    return new Grain(x, y, z, color);
};

