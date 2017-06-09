var socket = io();
var container = $('.sandbox');
var sandbox = Sandbox.create(socket, container);
var button = $("#save-button");
console.log('======= GET READY FOR DA BIGGER BUTT ======');
console.log(button.text());

button.on("click", function(e) {
  console.log('save button clicked');
  sandbox.completePush();
});

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

var statusBubbles = {};

socket.on('user_join', function (data) {
    var username = data;

    if (statusBubbles[username]) {
        setContributorOnline(username);
    } else {
        addContributor(username);
    }
});

socket.on('user_leave', function (data) {
    var username = data;

    if (statusBubbles[username]) {
        setContributorOffline(username);
    }
});

socket.on('saved', function (data) {
    var timestamp = data;
    $('.saved-timestamp').text(timestamp);
});

function addContributor(username) {
    var contributor = $('<li>').attr('class', 'list-group-item').text(username);
    var status = $('<li>').attr('class', 'list-group-item text-center');
    var statusBubble = $('<i>').attr('class', 'glyphicon glyphicon-ok')
        .css('color', 'green');
    status.append(statusBubble);
    $('.contributors').append(contributor);
    $('.statuses').append(status);
    contributors[username] = statusBubble;
}

function setContributorOnline(username) {
    statusBubbles[username].attr('class', 'glyphicon glyphicon-ok').css('color', 'green');
}

function setContributorOffline(username) {
    statusBubbles[username].attr('class', 'glyphicon glyphicon-remove').css('color', 'red');
}

$(window).on('beforeunload', function(e) {
    if (socket !== undefined && socket !== null) {
        socket.emit('user_disconnect');
    }
});
