function Viewport(width, height, scene, camera) {
    this.width = width;
    this.height = height;
    this.scene = scene;
    this.camera = camera;
    
    this.l = null;
    this.m = null;
    this.n = null;
    this.distance = -1;
    this.focus = null;
}

Viewport.X_AXIS = new THREE.Vector3(1, 0, 0);
Viewport.Y_AXIS = new THREE.Vector3(0, 1, 0);
Viewport.Z_AXIS = new THREE.Vector3(0, 0, 1);

Viewport.CAMERA_FRUSTUM = 5;
Viewport.CANVAS_TO_SPACE_FACTOR = 0.05;

Viewport.DEFAULT_CAMERA_POSITION = new THREE.Vector3(5, 5, 5);
Viewport.DEFAULT_CAMERA_FOCUS = new THREE.Vector3(0, 0, 0);

Viewport.EPSILON_ANGLE = 0.01;
Viewport.EPSILON_LENGTH = 0.01;

Viewport.create = function (width, height, scene, camera) {
    var viewport = new Viewport(width, height, scene, camera)
    viewport.initialize();
    viewport.calibrate();
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
};


Viewport.prototype.calibrate = function () {
    this.distance = this.camera.position.distanceTo(this.focus);
    this.camera.lookAt(this.focus);
    this.l = this.getX().applyEuler(this.camera.getWorldRotation());
    this.m = this.getY().applyEuler(this.camera.getWorldRotation());
    this.n = this.getZ().applyEuler(this.camera.getWorldRotation());
};

Viewport.prototype.reset = function () {
    this.initialize();
    this.calibrate();
};

Viewport.prototype.getX = function (scale) {
    return Viewport.X_AXIS.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.getY = function (scale) {
    return Viewport.Y_AXIS.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.getZ = function (scale) {
    return Viewport.Z_AXIS.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.getL = function (scale) {
    return this.l.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.getM = function (scale) {
    return this.m.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.getN = function (scale) {
    return this.n.clone().multiplyScalar(scale == undefined ? 1 : scale);
};

Viewport.prototype.canvasVectorToSpace = function (vector) {
    return Viewport.combineVectors(this.getL(vector.x),
                                   this.getM(vector.y));
};

Viewport.prototype.panCamera = function (vector) {
    vector.setLength(Viewport.CANVAS_TO_SPACE_FACTOR);
    this.camera.position.add(vector);
    this.focus.add(vector);
    this.calibrate();
};

Viewport.prototype.rotateAxes = function (axis, angle) {
    this.l.applyAxisAngle(axis, angle);
    this.m.applyAxisAngle(axis, angle);
    this.n.applyAxisAngle(axis, angle);
    console.log('l:', this.l);
    console.log('m:', this.m);
    console.log('n:', this.n);
};

Viewport.prototype.orbitCamera = function (vector) {
    var incline = this.getN().angleTo(this.getY());

    var compL = this.getL().dot(vector);
    var compM = this.getM().dot(vector);

    if (Math.abs(incline) < Viewport.EPSILON_ANGLE) {
        compM = Math.min(compM, 0);
    }

    if (Math.abs(Math.PI - incline) < Viewport.EPSILON_ANGLE) {
        compM = Math.max(compM, 0);
    }

    vector = Viewport.combineVectors(this.getL(compL * Math.sin(incline)),
                                     this.getM(compM));

    console.log(vector);

    if (vector.length() > Viewport.EPSILON_LENGTH) {
        var axis = this.getN().clone().cross(vector).normalize();
        var angle = vector.length() / (this.distance / 2)
            * Viewport.CANVAS_TO_SPACE_FACTOR;

        this.camera.rotateOnAxis(axis, angle);
        this.camera.position.applyAxisAngle(axis, angle);
        this.calibrate();
    }
};
