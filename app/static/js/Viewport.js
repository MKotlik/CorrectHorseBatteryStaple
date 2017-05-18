function Viewport(width, height, scene, camera) {
    this.width = width;
    this.height = height;
    this.scene = scene;
    this.camera = camera;
    
    this.l = null;
    this.n = null;
    this.m = null;
    this.distance = -1;
    this.focus = null;
}

Viewport.CAMERA_FRUSTUM = 5;
Viewport.CANVAS_TO_SPACE_FACTOR = 0.04;

Viewport.DEFAULT_CAMERA_POSITION = new THREE.Vector3(5, 5, 5);
Viewport.DEFAULT_CAMERA_FOCUS = new THREE.Vector3(0, 0, 0);

Viewport.create = function (width, height, scene, camera) {
    var viewport = new Viewport(width, height, scene, camera)
    viewport.initialize();
    return viewport;
};

Viewport.combineVectors = function () {
    var ret = new THREE.Vector3();

    for (var i = 0; i < arguments.length; i++) {
        ret.add(arguments[i]);
    }

    return ret;
};

Viewport.prototype.initialize = function () {
    this.focus = Viewport.DEFAULT_CAMERA_FOCUS.clone();
    this.camera.position.copy(Viewport.DEFAULT_CAMERA_POSITION);
    this.camera.lookAt(this.focus);
    this.l = this.camera.getWorldDirection().normalize();
    this.n = this.camera.up.clone()
    this.m = this.l.clone().cross(this.n);
    this.distance = this.camera.position.distanceTo(this.focus);
};    


Viewport.prototype.calibrate = function () {
    this.l = this.camera.getWorldDirection().normalize();
    this.n = this.camera.up.clone()
    this.m = this.l.clone().cross(this.n);
    this.distance = this.camera.position.distanceTo(this.focus);
    this.camera.lookAt(this.focus);
};

Viewport.prototype.reset = function () {
    this.initialize();
    this.calibrate();
};

Viewport.prototype.getL = function (scale) {
    var ret = this.l.clone();
    
    if (scale) {
        ret.multiplyScalar(scale);
    }
    
    return ret;
};

Viewport.prototype.getN = function (scale) {
    var ret = this.n.clone();
    
    if (scale) {
        ret.multiplyScalar(scale);
    }
    
    return ret;
};

Viewport.prototype.getM = function (scale) {
    var ret = this.m.clone();
    
    if (scale) {
        ret.multiplyScalar(scale);
    }
    
    return ret;
};

Viewport.prototype.canvasVectorToSpace = function (vector) {
    return Viewport.combineVectors(this.getM(vector.width),
                                   this.getN(vector.height))
        .multiplyScalar(Viewport.CANVAS_TO_SPACE_FACTOR);
};

Viewport.prototype.panCamera = function (vector) {
    this.camera.position.add(vector);
    this.focus.add(vector);
    this.calibrate();
};

Viewport.prototype.rotateCamera = function (vector) {
    var axis = vector.clone().cross(this.getL()).normalize();
    var angle = vector.length() / (this.distance / 2);
    console.log('axis: ', axis);
    console.log('angle: ', angle);
    this.camera.position.applyAxisAngle(axis, angle);
    this.calibrate();
};