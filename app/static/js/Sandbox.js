function Sandbox(socket, renderer, camera, controls, scene, raycaster) {
    this.socket = socket;

    this.renderer = renderer;
    
    this.camera = camera;
    this.controls = controls;

    this.scene = scene;
    this.substrate = null;
    
    this.raycaster = raycaster;

    this.lastMouse = null;

    this.task = null;
    this.tool = null;
    this.tools = {};
    
    this.active = false;
    this.lastActionGrain = null;
    this.lastActionPos = null;
    this.lastMouse = null;
    
    this.grains = [];
    this.light = null;
}

Sandbox.ACTION_COOLDOWN = 100;

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

    var light = new THREE.PointLight('#FFFFFF', 1, 20, 2);
    light.position.copy(camera.position);
    camera.add(light);
    scene.add(camera);
    
    light = new THREE.AmbientLight('#FFFFFF', 0.5);
    scene.add(light);

    light = new THREE.DirectionalLight('#FFFFFF', 0.2);
    scene.add(light);

    var raycaster = new THREE.Raycaster();

    container.appendChild(rendererDOM);
    
    var sandbox = new Sandbox(socket, renderer, camera, controls, scene, raycaster);

    sandbox.addListeners();
    return sandbox;
};

Sandbox.prototype.addListeners = function () {
    this.controls.addEventListener('change', (e) => {
        this.render();
    });

    var element = this.renderer.domElement;
    
    element.addEventListener('mousedown', (e) => {
        if (e.which == 1) {
            this.active = true;
            this.lastMouse.set(e.offsetX, e.offsetY);
            this.getCurrentTool().use(this.lastMouse);
            this.run();
        }
    });

    element.addEventListener('mouseup', (e) => {
        if (e.which == 1) {
            this.active = false;
            this.lastActionTime = null;
            this.run();
        }
    });
    
    element.addEventListener('mousemove', (e) => {
        if (this.active) {
            var now = (new Date()).getTime();
            
            if (!this.lastActionTime
                || now - this.lastActionTime > Sandbox.ACTION_COOLDOWN) {
                var startX = this.lastMouse.x >= 0 ? this.lastMouse.x : e.offsetX;
                var startY = this.lastMouse.y >= 0 ? this.lastMouse.y : e.offsetY;
                
                var points = interpolate(startX, startY,
                                         e.offsetX, e.offsetY);

                for (var point of points) {
                    this.getCurrentTool().use(point);
                }

                this.run();

                this.lastActionTime = now;
                this.lastMouse.set(e.offsetX, e.offsetY);
            }
        }
    });

    element.addEventListener('wheel', (e) => {
        if (!e.ctrlKey) {
            var value = e.deltaY;
            this.getCurrentTool().change(-sign(value));
            this.run();
        }
    });
    
    window.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
        case 32: //space
            this.initialize();
            break;
        case 66: //b
            this.tool = 'build';
            console.log(this.tool);
            break;
        case 67: //c
            this.tool = 'carve';
            console.log(this.tool);
            break;
        }
    });
};

Sandbox.prototype.initialize = function (task) {
    if (this.substrate) {
        this.scene.remove(this.substrate);
    }
    
    this.substrate = new THREE.Object3D();
    this.scene.add(this.substrate);
    
    this.controls.reset();

    this.lastMouse = new THREE.Vector2(-1, -1);
    this.lastActionGrain = new THREE.Vector3(-1, -1, -1);
    this.grains = new Array(Math.pow(2 * Constants.MAX_GRAIN_COORD + 1, 3));

    var carve = Tool.create('carve', {
        radius: 1
    });

    var build = Tool.create('build', {
        radius: 1
    });

    carve.use = (point) => {
        var first = this.raycast(point);

        if (first) {
            var gx = toGrainCoord(first.object.position.x);
            var gy = toGrainCoord(first.object.position.y);
            var gz = toGrainCoord(first.object.position.z);
            var gr = carve.options.radius;
            var gr2 = Math.round(gr / 2);
            var i, j, k;

            var sample = this.grainsInRadius(gx, gy, gz, gr2);

            if (sample.length > 0) {
                var center = sumVectorList(sample.map(grain => grain.position))
                        .divideScalar(sample.length);

                var normal;

                if (center.distanceTo(first.object.position) < 0.01) {
                    normal = first.face.normal;
                } else {
                    normal = first.object.position.clone().sub(center).normalize();
                }

                var sphere = this.grainsInRadius(gx, gy, gz, gr);
                var toRemove = [];
                
                for (var base of sphere) {
                    if (this.isOutwardInDirection(base, normal)) {
                        toRemove.push(base);
                    }
                }

                for (var grain of toRemove) {
                    var gp = toGrainVector(grain.position);
                    this.removeGrain(gp.x, gp.y, gp.z);
                }
            }
        }
    };

    carve.change = (value) => {
        carve.options.radius = clamp(carve.options.radius + value, 0, 20);
        console.log(carve.options.radius);
    };

    build.use = (point) => {
        var first = this.raycast(point);

        if (first) {
            var gx = toGrainCoord(first.object.position.x);
            var gy = toGrainCoord(first.object.position.y);
            var gz = toGrainCoord(first.object.position.z);
            var gr = build.options.radius;
            var gr2 = Math.round(gr / 2);

            var sample = this.grainsInRadius(gx, gy, gz, gr2);

            if (sample.length > 0) {
                var center = sumVectorList(sample.map(grain => grain.position))
                        .divideScalar(sample.length);

                var normal;

                if (center.distanceTo(first.object.position) < 0.01) {
                    normal = first.face.normal;
                } else {
                    normal = first.object.position.clone().sub(center).normalize();
                }

                var sphere = this.grainsInRadius(gx, gy, gz, gr);
                
                var startGrain, endGrain, currentGrain;
                
                for (var base of sphere) {
                    if (this.isOutwardInDirection(base, normal)) {
                        var start = toGrainVector(base.position);
                        var end = start.clone().add(normal);
                        this.addGrain(end.x, end.y, end.z)
                    }
                }
            }
        }
    };

    build.change = (value) => {
        build.options.radius = clamp(build.options.radius + value, 0, 20);
        console.log(build.options.radius);
    };
        
    this.tools = {
        'carve': carve,
        'build': build
    };
        
    this.tool = 'build';

    if (task) {
        this.task = task;
    }

    if (this.task) {
        this.task();
    }
    
    this.run();
};

Sandbox.prototype.raycast = function (point) {
    var element = this.renderer.domElement;
    var mouse = new THREE.Vector2((point.x / element.width) * 2 - 1,
                                  -(point.y / element.height) * 2 + 1);
    this.raycaster.setFromCamera(mouse, this.camera);
    var intersects = this.raycaster.intersectObjects(this.substrate.children);
    var first = intersects[0];
    return first;
};

Sandbox.prototype.getCurrentTool = function () {
    return this.tools[this.tool];
};
    
Sandbox.prototype.createGrain = function (gx, gy, gz) {
    var mesh = new THREE.Mesh(Constants.GRAIN_GEOMETRY,
                              Constants.GRAIN_MATERIAL);

    mesh.position.x = toWorldCoord(gx);
    mesh.position.y = toWorldCoord(gy);
    mesh.position.z = toWorldCoord(gz);

    return mesh;
};

Sandbox.prototype.addGrain = function (gx, gy, gz) {
    gx = Math.round(gx);
    gy = Math.round(gy);
    gz = Math.round(gz);
    var index = toGrainIndex(gx, gy, gz);

    if (!this.grains[index]) {
        var grain = this.createGrain(gx, gy, gz);
        this.grains[index] = grain;
    }
};

Sandbox.prototype.removeGrain = function (gx, gy, gz) {
    gx = Math.round(gx);
    gy = Math.round(gy);
    gz = Math.round(gz);
    var index = toGrainIndex(gx, gy, gz);
    this.grains[index] = undefined;
};    

Sandbox.prototype.isBoundaryGrain = function (grain) {
    var neighbors = this.grainNeighbors(grain);
    return neighbors.length < 7;
};

Sandbox.prototype.getOutwardNormals = function (grain) {
    var normals = [];
    
    if (this.isBoundaryGrain(grain)) {
        for (var i = 0; i < grain.geometry.faces.length; i += 2) {
            var normal = grain.geometry.faces[i].normal;
            //console.log(toGrainVector(grain.position));
            var grainVector = toGrainVector(grain.position).add(normal);
            var index = toGrainIndex(grainVector.x,
                                     grainVector.y,
                                     grainVector.z);
            
            if (!this.grains[index]) {
                //console.log(grainVector, normal);
                normals.push(normal);
            }
        }
    }

    return normals;
};    

Sandbox.prototype.isOutwardInDirection = function (grain, vector) {
    if (this.isBoundaryGrain(grain)) {
        var normals = this.getOutwardNormals(grain);

        for (var normal of normals) {
            if (normal.angleTo(vector) < Math.PI / 2) {
                return true;
            }
        }
    }

    return false;
};

Sandbox.prototype.addBox = function (x, y, z, l, w, h, solid) {
    var gx = toGrainCoord(x);
    var gy = toGrainCoord(y);
    var gz = toGrainCoord(z);
    var gl = toGrainLength(l);
    var gw = toGrainLength(w);
    var gh = toGrainLength(h);

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

Sandbox.prototype.grainsInRadius = function (gx, gy, gz, gr) {
    var grains = [];
    var coords = pointsInRadius(gx, gy, gz, gr);
    gr = Math.round(gr);
    var i, j, k;

    for ([i, j, k] of coords) {
        var grain = this.grains[toGrainIndex(i, j, k)];

        if (grain) {
            grains.push(grain);
        }
    }

    return grains;
};

Sandbox.prototype.grainNeighbors = function (grain) {
    var grainVector = toGrainVector(grain.position);
    return this.grainsInRadius(grainVector.x,
                               grainVector.y,
                               grainVector.z,
                               1);
};
    
Sandbox.prototype.update = function () {
    while (this.substrate.children.length > 0) {
        this.substrate.remove(this.substrate.children[0]);
    }

    for (var grain of this.grains) {
        if (grain && this.isBoundaryGrain(grain)) {
            this.substrate.add(grain);
        }
    }
};

Sandbox.prototype.render = function () {    
    this.renderer.render(this.scene, this.camera);
};

Sandbox.prototype.run = function () {
    this.update();
    this.render();
};
