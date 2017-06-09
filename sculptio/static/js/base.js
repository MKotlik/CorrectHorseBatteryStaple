var socket = io();
var container = $('.sandbox');
var sandbox = Sandbox.create(socket, container);

container.on('contextmenu', function (e) {
    e.preventDefault();
});

container.on('wheel', function (e) {
    e.preventDefault();
});

sandbox.reset(function () {
    //this.addBox(0, 0, 0, 10, 0.1, 0.1, 'red');
    //this.addBox(0, 0, 0, 0.1, 10, 0.1, 'green');
    //this.addBox(0, 0, 0, 0.1, 0.1, 10, 'blue');
    this.addBox(-0.5, -0.5, -0.5, 1, 1, 1);
});

$(window).on('beforeunload', function(e) {
    if (socket !== undefined && socket !== null) {
        socket.emit('user_disconnect');
    }
});
