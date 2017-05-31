var socket = io();
var container = $('#container')[0];
var sandbox = Sandbox.create(socket, container);

container.addEventListener('contextmenu', function (e) {
    e.preventDefault();
}, true);

container.addEventListener('wheel', function (e) {
    e.preventDefault();
}, true);

sandbox.initialize(function () {
    //this.addBox(0, 0, 0, 10, 0.1, 0.1, 'red');
    //this.addBox(0, 0, 0, 0.1, 10, 0.1, 'green');
    //this.addBox(0, 0, 0, 0.1, 0.1, 10, 'blue');
    this.addBox(-0.5, -0.5, -0.5, 1, 1, 1, true);
});
