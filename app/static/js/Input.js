function Input() {
    throw new Error('Input should not be instantiated!');
}

Input.LEFT_CLICK = false;
Input.RIGHT_CLICK = false;
Input.MOUSE = [-1, -1];
Input.LAST_MOUSE = [-1, -1];
Input.SHIFT = false;
Input.CONTROL = false;
Input.ALT = false;
Input.SPACE = false;
Input.MISC_KEYS = {};

Input.onMouseDown = function (e) {
    if (e.which == 1) {
        Input.LEFT_CLICK = true;
    } else if (e.which == 3) {
        Input.RIGHT_CLICK = true;
    }
};

Input.onMouseUp = function (e) {
    if (e.which == 1) {
        Input.LEFT_CLICK = false;
    } else if (e.which == 3) {
        Input.RIGHT_CLICK = false;
    }
};

Input.onMouseMove = function (e) {
    Input.LAST_MOUSE = Input.MOUSE;
    Input.MOUSE = [e.offsetX, e.offsetY];
};

Input.onKeyDown = function (e) {
    switch (e.keyCode) {
    case 16:
        Input.SHIFT = true;
        break;

    case 17:
        Input.CONTROL = true;
        break;

    case 18:
        Input.ALT = true;
        break;

    case 32:
        Input.SPACE = true;
        break;
        
    default:
        Input.MISC_KEYS[e.keyCode] = true;
        break;
    }
};

Input.onKeyUp = function (e) {
    switch (e.keyCode) {
    case 16:
        Input.SHIFT = false;
        break;

    case 17:
        Input.CONTROL = false;
        break;

    case 18:
        Input.ALT = false;
        break;

    case 32:
        Input.SPACE = false;
        break;
        
    default:
        Input.MISC_KEYS[e.keyCode] = false;
        break;
    }
};

Input.applyEventHandlers = function (element) {
    element.addEventListener('mousedown', Input.onMouseDown);
    element.addEventListener('mouseup', Input.onMouseUp);
    element.addEventListener('mousemove', Input.onMouseMove);
    window.addEventListener('keyup', Input.onKeyUp);
    window.addEventListener('keydown', Input.onKeyDown);
    element.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    }, true);
};
