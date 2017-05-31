function Constants() {
    throw new Error('Constants should not be instantiated!');
}

Constants.CANVAS_WIDTH = 800;
Constants.CANVAS_HEIGHT = 800;

Constants.DEFAULT_GRAIN_COLOR = '#FFFFFF';
Constants.GRAIN_SIZE = 0.05;
Constants.GRAINS_PER_UNIT = Math.round(1 / Constants.GRAIN_SIZE);
Constants.MAX_GRAIN_COORDINATE = 10;
Constants.MAX_GRAINS = Constants.GRAINS_PER_UNIT * Constants.MAX_GRAIN_COORDINATE;

Constants.CAMERA_FRUSTUM = 5;
Constants.NEAR_PLANE = 0.1;
Constants.FAR_PLANE = 1000;

Constants.DEFAULT_CAMERA_POSITION = new THREE.Vector3(5, 5, 5);
Constants.DEFAULT_CAMERA_FOCUS = new THREE.Vector3(0, 0, 0);
