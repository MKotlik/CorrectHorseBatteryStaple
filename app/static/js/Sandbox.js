function Sandbox(socket, renderer, camera, controls, drawing) {
    this.socket = socket;

    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;

    this.drawing = drawing;
    
    this.grains = [];
    
    this.lastMouse = [-1, -1];

    this.animationFrameID = -1;
}

Sandbox.create = function (socket, container) {
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(Constants.CANVAS_WIDTH, Constants.CANVAS_HEIGHT);
    var rendererDOM = renderer.domElement;

    var camera = new THREE.OrthographicCamera(-Constants.CAMERA_FRUSTUM,
                                              Constants.CAMERA_FRUSTUM,
                                              Constants.CAMERA_FRUSTUM,
                                              -Constants.CAMERA_FRUSTUM,
                                              Constants.NEAR_PLANE,
                                              Constants.FAR_PLANE);
    camera.position.copy(Constants.DEFAULT_CAMERA_POSITION);
    camera.lookAt(Constants.DEFAULT_CAMERA_FOCUS);

    var controls = new THREE.OrbitControls(camera, rendererDOM);

    var drawing = Drawing.create();

    Input.applyEventHandlers(rendererDOM);

    container.appendChild(rendererDOM);
    
    var sandbox = new Sandbox(socket, renderer, camera, controls, drawing);
    sandbox.controls.addEventListener('change', function (e) {
        sandbox.render();
    });
    return sandbox;
};

Sandbox.prototype.addGrain = function (position, color) {
    var grain = Grain.create(position, color);
    this.grains.push(grain);
    return grain;
};

Sandbox.prototype.addBox = function (position, dimensions) {
    var size = Constants.DEFAULT_GRAIN_SIZE;
    for (var x = position.x; x < position.x + dimensions.x; x += size) {
        for (var y = position.y; y < position.y + dimensions.y; y += size) {
            for (var z = position.z; z < position.z + dimensions.z; z += size) {
                var grain = this.addGrain(new THREE.Vector3(x, y, z));
                this.drawing.renderGrain(grain);
            }
        }
    }
};

Sandbox.prototype.render = function () {    
    this.renderer.render(this.drawing.scene, this.camera);
};

Sandbox.prototype.animate = function () {
    var context = this;

    this.animationFrameID = window.requestAnimationFrame(function () {
        context.run();
    });
};

Sandbox.prototype.run = function () {
    this.render();
    this.animate();
};
