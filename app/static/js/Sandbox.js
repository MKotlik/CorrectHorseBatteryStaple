function Sandbox(socket, renderer, camera, controls, drawing, raycaster) {
    this.socket = socket;

    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;

    this.drawing = drawing;

    this.raycaster = raycaster;

    this.tool = '';

    this.grains = null;
}

Sandbox.TOOLS = ['test'];

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

    var raycaster = new THREE.Raycaster();

    Input.applyEventHandlers(rendererDOM);
    container.appendChild(rendererDOM);
    
    return new Sandbox(socket, renderer, camera, controls, drawing, raycaster);
};

Sandbox.prototype.initialize = function () {
    this.controls.addEventListener('change', (e) => {
        this.render();
    });

    var element = this.renderer.domElement;
    
    element.addEventListener('mousedown', (e) => {
        if (e.which == 1) {
            var mouse = new THREE.Vector2((e.offsetX / element.width) * 2 - 1,
                                          -(e.offsetY / element.height) * 2 + 1);
            console.log(mouse);
            this.raycaster.setFromCamera(mouse, this.camera);
            var intersects = this.raycaster.intersectObjects(this.drawing.scene.children);

            intersects[0].object.material.color.set('red');
        }

        this.render();
    });

    window.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
        case 32: //space
            this.controls.reset();
            break;
        }

        this.render();
    });

    this.grains = new Array(Math.pow(Constants.MAX_GRAINS, 3));
    
    this.render();
};

Sandbox.prototype.useTool = function (tool, point) {
    
};

Sandbox.prototype.addGrain = function (gx, gy, gz, color) {
    x = gx / Constants.GRAINS_PER_UNIT;
    y = gy / Constants.GRAINS_PER_UNIT;
    z = gz / Constants.GRAINS_PER_UNIT;
    var grain = Grain.create(x, y, z, color);
    this.grains[gx * Constants.MAX_GRAINS * Constants.MAX_GRAINS
                + gy * Constants.MAX_GRAINS + gz] = grain;
    return grain;
};

Sandbox.prototype.addBox = function (x, y, z, l, w, h) {
    gx = Math.round(x * Constants.GRAINS_PER_UNIT);
    gy = Math.round(y * Constants.GRAINS_PER_UNIT);
    gz = Math.round(z * Constants.GRAINS_PER_UNIT);
    gl = Math.round(l * Constants.GRAINS_PER_UNIT);
    gw = Math.round(w * Constants.GRAINS_PER_UNIT);
    gh = Math.round(h * Constants.GRAINS_PER_UNIT);

    var size = Constants.GRAIN_SIZE;
    var grain;

    for (var i = gx; i < gx + gl; i++) {
        for (var j = gy; j < gy + gw; j++) {
            for (var k = gz; k < gz + gh; k++) {
                if (i == gx || i == gx + gl - 1 
                    || j == gy || j == gy + gw - 1
                    || k == gz || k == gz + gh - 1) {
                    grain = this.addGrain(i, j, k);
                    this.drawing.renderGrain(grain);
                }
            }
        }
    }
};

Sandbox.prototype.render = function () {    
    this.renderer.render(this.drawing.scene, this.camera);
};
