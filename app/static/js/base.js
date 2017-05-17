var socket = io();
var sandbox = Sandbox.create(socket, $('#container')[0]);
sandbox.animate();

var x = sandbox.drawing.renderBox(0, 0, 0, 1000, 0.05, 0.05, 'green');
var y = sandbox.drawing.renderBox(0, 0, 0, 0.05, 1000, 0.05, 'red');
var z = sandbox.drawing.renderBox(0, 0, 0, 0.05, 0.05, 1000, 'blue');
