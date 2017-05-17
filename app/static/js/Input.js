function Input(element) {
    this.element = element;
}

Input.create = function (element) {
    return new Input(element);
};
