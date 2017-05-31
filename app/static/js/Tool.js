function Tool(name, options) {
    this.name = name;
    this.options = options;
}

Tool.create = function (name, options, functions) {
    var tool = new Tool(name, options);
};

Tool.prototype.click = function (e) {

};

Tool.prototype.wheel = function (e) {

};
