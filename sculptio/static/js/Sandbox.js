/**
 * Class wrapping the entirety of the project environment; contains most listeners,
 * including sockets, and manages tools.
 */

function Sandbox(socket, container, renderer, camera, controls,
                 scene, raycaster, world, substrate) {
    this.socket = socket;
    this.container = container;

    this.renderer = renderer;

    this.camera = camera;
    this.controls = controls;

    this.scene = scene;

    this.raycaster = raycaster;

    this.world = world;

    this.substrate = substrate;
    this.task = null;
    this.tool = null;
    this.tools = {};

    this.active = false;
    this.lastMouse = null;

    this.changes = {};
    this.light = null;
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
    camera.zoom = Constants.DEFAULT_CAMERA_ZOOM;

    var controls = new THREE.OrbitControls(camera, rendererDOM);

    var scene = new THREE.Scene();

    var raycaster = new THREE.Raycaster();

    container.append($(rendererDOM).attr('class', 'renderer'));

    var world = World.create();
    var substrate = new THREE.Object3D();

    var sandbox = new Sandbox(socket, container, renderer, camera, controls,
                              scene, raycaster, world, substrate);

    sandbox.initListeners();
    sandbox.initTools();
    sandbox.initProject();
    sandbox.initUI();

    return sandbox;
};

Sandbox.prototype.initListeners = function () {
    this.controls.addEventListener('change', (e) => {
        this.render();
    });

    var element = $(this.renderer.domElement);

    element.on('contextmenu', (e) => {
        e.preventDefault();
    });

    element.on('mousedown', (e) => {
        if (e.which == 1) {
            this.active = true;
            this.lastMouse.set(e.offsetX, e.offsetY);
            this.getCurrentTool().use(this.lastMouse);
            this.run();
        }
    });

    element.on('mouseup', (e) => {
        if (e.which == 1) {
            this.active = false;
            this.partialPush();
            this.run();
        }
    });

    element.on('mousemove', (e) => {
        if (this.active) {
            var now = (new Date()).getTime();

            var startX = this.lastMouse.x >= 0 ? this.lastMouse.x : e.offsetX;
            var startY = this.lastMouse.y >= 0 ? this.lastMouse.y : e.offsetY;

            var points = interpolate(startX, startY,
                                     e.offsetX, e.offsetY);

            for (var point of points) {
                this.getCurrentTool().use(point);
            }

            this.run();
            this.lastMouse.set(e.offsetX, e.offsetY);
        }
    });

    element.on('wheel', (e) => {
        if (!e.ctrlKey) {
            var value = e.originalEvent.deltaY;
            this.getCurrentTool().change(-sign(value));
            this.run();
            //e.preventDefault();
        }
    });

    window.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
        case 32: //space
            this.reset();
            break;
        //case 66: //b
            //this.tool = 'pull';
            //console.log(this.tool);
            //break;
        //case 67: //c
            //this.tool = 'push';
            //console.log(this.tool);
            //break;
        case 82: //r
            this.completePull();
            break;
        case 83: //s
            this.completePush();
            break;
        }
    });

    this.socket.on('partial_pull', (data) => {
        this.partialPull(data);
    });

    this.socket.on('complete_pull', (data) => {
        this.completePull(data);
    });
};

Sandbox.prototype.partialPush = function () {
    console.log('partial push');
    this.socket.emit('partial_push', this.world.changes);
    this.world.resetChanges();
};

Sandbox.prototype.completePush = function () {
    console.log('complete push');
    this.socket.emit('complete_push', this.world.exportGrains());
};

Sandbox.prototype.partialPull = function (data) {
    console.log('partial pull', data);
    for (var index of data.added) {
        var grainCoords = toGrainCoords(index);
        this.world.addGrain(grainCoords.x, grainCoords.y, grainCoords.z);
    }

    for (var index of data.removed) {
        var grainCoords = toGrainCoords(index);
        this.world.removeGrain(grainCoords.x, grainCoords.y, grainCoords.z);
    }

    this.run();
};

Sandbox.prototype.completePull = function (data) {
    console.log('complete pull');

    this.world.resetGrains();

    console.log(data.grainIndices);
    console.log(data.grainIndices.length);
    
    if (data.grainIndices.length == 0) {
        console.log('test');
        this.addBox(-0.5, -0.5, -0.5, 1, 1, 1);
    }

    for (var index of data.grainIndices) {
        var grainCoords = toGrainCoords(index);
        this.world.addGrain(grainCoords.x, grainCoords.y, grainCoords.z);
    }

    console.log(data.grainIndices);
    console.log(this.world.grains);
    this.run();
};

Sandbox.prototype.initTools = function () {
    var push = Tool.create('push', {
        radius: 1
    });

    var pull = Tool.create('pull', {
        radius: 1
    });

    push.use = (point) => {
        var first = this.raycast(point);

        if (first) {
            var gx = toGrainCoord(first.object.position.x);
            var gy = toGrainCoord(first.object.position.y);
            var gz = toGrainCoord(first.object.position.z);
            var gr = push.options.radius;
            var gr2 = Math.round(gr / 2);

            var sample = this.world.grainsInRadius(gx, gy, gz, gr2);

            if (sample.length > 0) {
                var center = sumVectorList(sample.map(grain => grain.position))
                        .divideScalar(sample.length);

                var normal;

                if (center.distanceTo(first.object.position) < 0.01) {
                    normal = first.face.normal;
                } else {
                    normal = first.object.position.clone().sub(center).normalize();
                }

                var sphere = this.world.grainsInRadius(gx, gy, gz, gr);
                var toRemove = [];

                for (var base of sphere) {
                    if (this.world.isOutwardInDirection(base, normal)) {
                        toRemove.push(base);
                    }
                }

                for (var grain of toRemove) {
                    var gp = toGrainVector(grain.position);
                    this.world.removeGrain(gp.x, gp.y, gp.z);
                }
            }
        }
    };

    push.change = (value) => {
        console.log(value);
        push.options.radius = clamp(push.options.radius + value, 0, 20);
        push.element.find('.tool-slider').val(push.options.radius);
        push.element.find('.tool-radius').text(push.options.radius);
    };

    pull.use = (point) => {
        var first = this.raycast(point);

        if (first) {
            var gx = toGrainCoord(first.object.position.x);
            var gy = toGrainCoord(first.object.position.y);
            var gz = toGrainCoord(first.object.position.z);
            var gr = pull.options.radius;
            var gr2 = Math.round(gr / 2);

            var sample = this.world.grainsInRadius(gx, gy, gz, gr2);

            if (sample.length > 0) {
                var center = sumVectorList(sample.map(grain => grain.position))
                        .divideScalar(sample.length);

                var normal;

                if (center.distanceTo(first.object.position) < 0.01) {
                    normal = first.face.normal;
                } else {
                    normal = first.object.position.clone().sub(center).normalize();
                }

                var sphere = this.world.grainsInRadius(gx, gy, gz, gr);

                var startGrain, endGrain, currentGrain;

                for (var base of sphere) {
                    if (this.world.isOutwardInDirection(base, normal)) {
                        var start = toGrainVector(base.position);
                        var end = start.clone().add(normal);
                        this.world.addGrain(end.x, end.y, end.z)
                    }
                }
            }
        }
    };

    pull.change = (value) => {
        pull.options.radius = clamp(pull.options.radius + value, 0, 20);
        pull.element.find('.tool-slider').val(pull.options.radius);
        pull.element.find('.tool-radius').text(pull.options.radius);
    };

    this.tools = {
        'push': push,
        'pull': pull
    };

    this.tool = 'pull';
};

Sandbox.prototype.initProject = function () {
    var light = new THREE.PointLight('#FFFFFF', 1, 20, 2);
    light.position.copy(this.camera.position);
    this.camera.add(light);
    this.scene.add(this.camera);

    light = new THREE.AmbientLight('#FFFFFF', 0.5);
    this.scene.add(light);

    light = new THREE.DirectionalLight('#FFFFFF', 0.2);
    this.scene.add(light);

    this.scene.add(this.substrate);
    this.lastMouse = new THREE.Vector2(-1, -1);

    // Get projID from url
    var url = window.location.href;
    var projInd = url.indexOf('/project/');
    this.projID = parseInt(url.substring(projInd + 9));
    console.log('projID: ' + this.projID);

    // Emit connect event with projID to server
    this.socket.emit('user_connect', this.projID);
};

Sandbox.prototype.initUI = function () {
    var toolbox = $('<table>').attr('class', 'toolbox');

    for (var tool in this.tools) {
        var row = $('<tr>');

        row.on('click', ((tool) => {
            return (e) => {
                this.tool = tool;

                for (var row of $('.tool-row')) {
                    var row = $(row);

                    if (this.tools[tool].element[0] == row[0]) {
                        row.attr('class', 'tool-row tool-selected');
                    } else {
                        row.attr('class', 'tool-row tool-deselected');
                    }
                }
            };
        })(tool));

        if (tool == this.tool) {
            row.attr('class', 'tool-row tool-selected');
        } else {
            row.attr('class', 'tool-row tool-deselected');
        }

        var icon = $('<img>').attr({
            src: Constants.IMAGE_PATH + tool + '.png',
            'class': 'tool-icon'
        });

        var slider = $('<input>').attr({
            'class': 'tool-slider',
            type: 'range',
            min: 0,
            max: 20,
            step: 1,
            value: this.tools[tool].options.radius
        });

        var label = $('<div>').text(this.tools[tool].options.radius)
            .attr('class', 'tool-radius');

        slider.on('change', ((tool, slider, label) => {
            return (e) => {
                this.tools[tool].options.radius = slider.val();
                label.text(slider.val());
            };
        })(tool, slider, label));

        //slider.hide();

        //icon.hover(((slider) => {
            //return (e) => {
                //console.log('in');
                //slider.show();
            //};
        //})(slider), ((slider) => {
            //return (e) => {
                //console.log('out');
                //slider.hide();
            //};
        //})(slider));

        row.append($('<td>').append(icon));
        row.append($('<td>').append(slider));
        row.append($('<td>').append(label));
        this.tools[tool].element = row;
        toolbox.append(row);
    }

    this.container.append(toolbox);
}

Sandbox.prototype.reset = function (task) {
    this.controls.reset();

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

Sandbox.prototype.addBox = function (x, y, z, l, w, h) {
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
                this.world.addGrain(i, j, k);
            }
        }
    }
};

Sandbox.prototype.update = function () {
    while (this.substrate.children.length > 0) {
        this.substrate.remove(this.substrate.children[0]);
    }

    for (var grain of this.world.grains) {
        if (grain && this.world.isBoundaryGrain(grain)) {
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
