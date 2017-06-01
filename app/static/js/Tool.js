function Tool(name, options) {
    this.name = name;
    this.options = options;
}

Tool.create = function (name, options) {
    var tool = new Tool(name, options);
    return tool;
};

Tool.prototype.click = function (e) {

};

Tool.prototype.wheel = function (e) {

};
