function Sandbox(socket, width, height, scene, camera, renderer, drawing, viewport) {
    this.socket = socket;

    this.width = width;
    this.height = height;

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.grains = [];
    
    this.drawing = drawing;
    this.viewport = viewport;

    this.lastMouse = [-1, -1];

    this.animationFrameID = -1;
}

Sandbox.create = function (socket, container) {
    var width = Constants.CANVAS_WIDTH;
    var height = Constants.CANVAS_HEIGHT;

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-Viewport.CAMERA_FRUSTUM,
                                              Viewport.CAMERA_FRUSTUM,
                                              Viewport.CAMERA_FRUSTUM,
                                              -Viewport.CAMERA_FRUSTUM,
                                              0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    var rendererDOM = renderer.domElement;

    var drawing = Drawing.create(width, height, scene);
    var viewport = Viewport.create(width, height, scene, camera);
    
    Input.applyEventHandlers(rendererDOM);

    container.appendChild(rendererDOM);
    return new Sandbox(socket, width, height, scene, camera, renderer, drawing, viewport);
};

Sandbox.prototype.addGrain = function (position, color) {
    this.grains.push(Grain.create(position, color));
};

Sandbox.prototype.addBox = function (position, dimensions) {
    var size = Constants.DEFAULT_GRAIN_SIZE;
    console.log(position.x + dimensions.x, dimensions);
    for (var x = position.x; x < position.x + dimensions.x; x += size) {
        for (var y = position.y; y < position.y + dimensions.y; y += size) {
            for (var z = position.z; z < position.z + dimensions.z; z += size) {
                console.log(x, y, z);
                this.addGrain(new THREE.Vector3(x, y, z));
            }
        }
    }
};

Sandbox.prototype.update = function () {
    this.viewport.calibrate();
    
    if (Input.RIGHT_CLICK) {
        if (Input.MOUSE != this.lastMouse) {
            var dragVector = new THREE.Vector2(-Input.MOUSE[0] + this.lastMouse[0],
                                               Input.MOUSE[1] - this.lastMouse[1]);

            var dragVectorSpace = this.viewport.canvasVectorToSpace(dragVector);

            if (dragVectorSpace.length() > 0) {
                if (Input.CONTROL) {
                    this.viewport.orbitCamera(dragVectorSpace);
                } else {
                    this.viewport.panCamera(dragVectorSpace);
                }
            }
        }
    }

    if (Input.WHEEL) {
        this.viewport.zoomCamera(-sign(Input.WHEEL), Input.CONTROL);
    }
    
    if (Input.SPACE) {
        this.viewport.reset();
    }

    this.lastMouse = Input.MOUSE;
    Input.WHEEL = 0;
};

Sandbox.prototype.draw = function () {
    for (var i = 0; i < this.grains.length; i++) {
        this.drawing.renderGrain(this.grains[i]);
    }
    
    this.renderer.render(this.scene, this.camera);
};

Sandbox.prototype.animate = function () {
    var context = this;

    this.animationFrameID = window.requestAnimationFrame(function () {
        context.run();
    });
};

Sandbox.prototype.run = function () {
    this.update();
    this.draw();
    this.animate();
};
