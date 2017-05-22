var socket = io();
var container = $('#container')[0];
var sandbox = Sandbox.create(socket, container);

container.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, true);

container.addEventListener('wheel', function (e) {
    e.preventDefault();
}, true);

sandbox.animate();

var x = sandbox.drawing.renderBox(0, 0, 0, 1000, 0.05, 0.05, 'red');
var y = sandbox.drawing.renderBox(0, 0, 0, 0.05, 1000, 0.05, 'green');
var z = sandbox.drawing.renderBox(0, 0, 0, 0.05, 0.05, 1000, 'blue');
var box = sandbox.drawing.renderBox(1, 1, 1, 1, 1, 1, 'white');
