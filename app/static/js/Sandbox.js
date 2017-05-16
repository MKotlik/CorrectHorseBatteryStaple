function Sandbox(socket, width, height, scene, renderer, drawing, input) {
    this.socket = socket;

    this.width = width;
    this.height = height;

    this.scene = scene;
    this.renderer = renderer;

    this.drawing = drawing;
    this.input = input;
}

Sandbox.create = function (socket, container, canvas) {
    var width = Constants.CANVAS_WIDTH;
    var height = Constants.CANVAS_HEIGHT;

    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    var rendererDOM = renderer.domElement;

    var drawing = Drawing.create(scene);
    var input = Input.create(canvas);

    container.insertBefore(rendererDOM, canvas);
    return new Sandbox(socket, width, height, scene, renderer, drawing, input);
};
