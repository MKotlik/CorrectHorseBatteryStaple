function Sandbox(socket, renderer, camera, controls, scene, raycaster) {
    this.socket = socket;

    this.renderer = renderer;
    this.camera = camera;
    this.controls = controls;

    this.scene = scene;

    this.raycaster = raycaster;

    this.lastMouse = null;

    this.task = null;
    this.tool = null;
    
    this.active = false;
    this.animationFrameID = -1;
    
    this.grains = [];
    this.light = null;
}

Sandbox.TOOLS = {
    carve: {
        name: 'carve',
        options: {
            radius: 1
        },
        click: function (e) {

        },
        wheel: function (e) {
            
        }
    }
};

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
    camera.zoom = Constants.DEFAULT_CAMERA_ZOOM;

    var controls = new THREE.OrbitControls(camera, rendererDOM);

    var scene = new THREE.Scene();

    var light = new THREE.PointLight('#FFFFFF', 0.6, 0, 3);
    light.position.copy(camera.position);
    camera.add(light);
    scene.add(camera);
    
    light = new THREE.AmbientLight('#888888');
    scene.add(light);

    var raycaster = new THREE.Raycaster();

    container.appendChild(rendererDOM);
    
    var sandbox = new Sandbox(socket, renderer, camera, controls, scene, raycaster);

    sandbox.addListeners();
    return sandbox;
};

Sandbox.prototype.addListeners = function () {
    this.controls.addEventListener('change', (e) => {
        this.run();
    });

    var element = this.renderer.domElement;
    
    element.addEventListener('mousedown', (e) => {
        if (e.which == 1) {
            this.active = true;
            var mouse = new THREE.Vector2((e.offsetX / element.width) * 2 - 1,
                                          -(e.offsetY / element.height) * 2 + 1);
            var first = this.raycast(mouse);

            if (first) {
                var x = first.object.position.x;
                var y = first.object.position.y;
                var z = first.object.position.z;
                var r = 3;

                for (var grain of this.grainsInRadius(x, y, z, r)) {
                    this.scene.remove(grain);
                }
            }

            this.run();
        }
    });

    element.addEventListener('mouseup', (e) => {
        if (e.which == 1) {
            this.active = false;
            this.run();
        }
    });
    
    element.addEventListener('mousemove', (e) => {
        if (this.active) {
            var mouse = new THREE.Vector2((e.offsetX / element.width) * 2 - 1,
                                          -(e.offsetY / element.height) * 2 + 1);
            var first = this.raycast(mouse);

            if (first) {
                var x = first.object.position.x;
                var y = first.object.position.y;
                var z = first.object.position.z;
                var r = 3;

                for (var grain of this.grainsInRadius(x, y, z, r)) {
                    this.scene.remove(grain);
                }
            }

            this.run();
        }
    });

    window.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
        case 32: //space
            for (var grain of this.grains) {
                this.scene.remove(grain);
            }

            this.initialize();
            this.run();
            break;
        }
    });
};

Sandbox.prototype.initialize = function (task) {
    this.controls.reset();
    
    this.grains = new Array(Math.pow(2 * Constants.MAX_GRAIN_COORD + 1, 3));
    this.tool = 'carve';

    if (task) {
        this.task = task;
    }

    if (this.task) {
        this.task();
    }
    
    this.run();
};

Sandbox.prototype.raycast = function (mouse) {    
    this.raycaster.setFromCamera(mouse, this.camera);
    var intersects = this.raycaster.intersectObjects(this.scene.children);
    var first = intersects[0];
    return first;
};

Sandbox.prototype.useTool = function (tool, intersected) {
    
};

Sandbox.prototype.createGrain = function (x, y, z, color) {
    var mesh = new THREE.Mesh(Constants.GRAIN_GEOMETRY,
                              Constants.GRAIN_MATERIAL);

    mesh.position.x = x;
    mesh.position.y = y;
    mesh.position.z = z;

    return mesh;
};

Sandbox.prototype.addGrain = function (gx, gy, gz, color) {
    x = toWorldCoord(gx);
    y = toWorldCoord(gy);
    z = toWorldCoord(gz);
    var grain = this.createGrain(x, y, z, color);
    this.grains[toGrainIndex(gx, gy, gz)] = grain;
    this.scene.add(grain);
};

Sandbox.prototype.addBox = function (x, y, z, l, w, h, solid) {
    gx = toGrainCoord(x);
    gy = toGrainCoord(y);
    gz = toGrainCoord(z);
    gl = toGrainLength(l);
    gw = toGrainLength(w);
    gh = toGrainLength(h);

    var size = Constants.GRAIN_SIZE;
    var grain;

    for (var i = gx; i < gx + gl; i++) {
        for (var j = gy; j < gy + gw; j++) {
            for (var k = gz; k < gz + gh; k++) {
                if (solid
                    || i == gx || i == gx + gl - 1 
                    || j == gy || j == gy + gw - 1
                    || k == gz || k == gz + gh - 1) {
                    this.addGrain(i, j, k);
                }
            }
        }
    }
};

Sandbox.prototype.grainsInRadius = function (x, y, z, r) {
    var grains = [];
    var gx = toGrainCoord(x);
    var gy = toGrainCoord(y);
    var gz = toGrainCoord(z);

    console.log(gx, gy, gz, r);
    
    for (var i = -r; i <= r; i++) {
        for (var j = -r; j <= r; j++) {
            for (var k = -r; k <= r; k++) {
                if (i * i + j * j + k * k <= r * r) {
                    var grain = this.grains[toGrainIndex(gx + i, gy + j, gz + k)];
                    
                    if (grain) {
                        grains.push(grain);
                    }
                }
            }
        }
    }

    return grains;
};

Sandbox.prototype.update = function () {
    for (var grain of this.grains) {
        
    }
};

Sandbox.prototype.render = function () {    
    this.renderer.render(this.scene, this.camera);
};

Sandbox.prototype.run = function () {
    this.update();
    this.render();
};
