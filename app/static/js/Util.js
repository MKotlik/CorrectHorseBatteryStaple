function sign(n) {
    if (n > 0) {
        return 1;
    } else if (n < 0) {
        return -1;
    } else {
        return 0;
    }
}

function clamp(n, min, max) {
    if (min > max) {
        return clamp(n, max, min);
    }
    
    if (min) {
        if (max) {
            return Math.min(Math.max(n, min), max);
        } else {
            return Math.max(n, min);
        }
    } else {
        if (max) {
            return Math.min(n, max);
        } else {
            return n;
        }
    }
}
