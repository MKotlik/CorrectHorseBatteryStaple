/**
 * Wrapper class for any tools. Essentially an abstract class (or as abstract as JS gets).
 */

function Tool(name, options, element) {
    this.name = name;
    this.options = options;
    this.element = element;
}

Tool.create = function (name, options, element) {
    var tool = new Tool(name, options, element);
    return tool;
};

Tool.prototype.click = function (e) {

};

Tool.prototype.wheel = function (e) {

};
