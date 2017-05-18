function Sandbox(socket, width, height, scene, camera, renderer, drawing, viewport) {
    this.socket = socket;

    this.width = width;
    this.height = height;

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

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

Sandbox.prototype.update = function () {
    if (Input.MOUSE != this.lastMouse) {
        if (Input.LEFT_CLICK) {
            var dragVector = new THREE.Vector2(Input.MOUSE[0] - this.lastMouse[0],
                                               Input.MOUSE[1] - this.lastMouse[1]);
            var dragVectorSpace = this.viewport.canvasVectorToSpace(dragVector);

            dragVectorSpace.x *= -1;
            dragVectorSpace.z *= -1;

            if (Input.CONTROL) {
                this.viewport.rotateCamera(dragVectorSpace);
            } else {
                this.viewport.panCamera(dragVectorSpace);
            }
        }
    }

    if (Input.SPACE) {
        this.viewport.reset();
    }

    this.lastMouse = Input.MOUSE;
};

Sandbox.prototype.draw = function () {
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
