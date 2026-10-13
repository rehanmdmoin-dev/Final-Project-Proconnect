const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

asyncHandler.bindController = (controller) => {
    const prototype = Object.getPrototypeOf(controller);
    for (const name of Object.getOwnPropertyNames(prototype)) {
        if (name === 'constructor') continue;
        controller[name] = asyncHandler(prototype[name].bind(controller));
    }
    return controller;
};

module.exports = asyncHandler;
