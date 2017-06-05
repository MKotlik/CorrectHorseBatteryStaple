function Constants() {
    throw new Error('Constants should not be instantiated!');
}

Constants.CANVAS_WIDTH = 800;
Constants.CANVAS_HEIGHT = 800;
Constants.WORLD_LIMIT = 2.5;

Constants.DEFAULT_GRAIN_COLOR = '#FFFFFF';
Constants.GRAINS_PER_UNIT = 20;
Constants.GRAIN_SIZE = 1 / Constants.GRAINS_PER_UNIT;
Constants.MAX_GRAIN_COORD = Constants.GRAINS_PER_UNIT * Constants.WORLD_LIMIT;

Constants.CAMERA_FRUSTUM = 5;
Constants.NEAR_PLANE = 0.1;
Constants.FAR_PLANE = 1000;

Constants.DEFAULT_CAMERA_POSITION = new THREE.Vector3(1, 2, 3);
Constants.DEFAULT_CAMERA_FOCUS = new THREE.Vector3(0, 0, 0);
Constants.DEFAULT_CAMERA_ZOOM = 2;

Constants.GRAIN_GEOMETRY = new THREE.BoxGeometry(Constants.GRAIN_SIZE,
                                                 Constants.GRAIN_SIZE,
                                                 Constants.GRAIN_SIZE);

Constants.GRAIN_MATERIAL = new THREE.MeshLambertMaterial({
    color: Constants.DEFAULT_GRAIN_COLOR
});
