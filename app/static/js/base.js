var socket = io();
var container = $('#container')[0];
var sandbox = Sandbox.create(socket, container);

container.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, true);

container.addEventListener('wheel', function (e) {
    e.preventDefault();
}, true);

sandbox.initialize();

var x = sandbox.drawing.renderBox(0, 0, 0, 1000, 0.05, 0.05, 'red');
var y = sandbox.drawing.renderBox(0, 0, 0, 0.05, 1000, 0.05, 'green');
var z = sandbox.drawing.renderBox(0, 0, 0, 0.05, 0.05, 1000, 'blue');
sandbox.addBox(1, 1, 1, 1, 1, 1);
//sandbox.drawing.renderBox(0, 0, 0, 1, 1, 1), 'white';

sandbox.render();
