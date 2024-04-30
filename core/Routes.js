class Routes{

    constructor(){
        this._routes = [];
    }

    add(path, controller){
        this._routes.push({
            path : path,
            controller : controller,
        });
    }

    *[Symbol.iterator](){
        for(let route of this._routes){
            yield route;
        }
    }
}

module.exports = Routes;