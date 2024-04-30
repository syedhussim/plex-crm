const Application = require('./core/Application');

class App extends Application {

    async load(){
        this.routes.add('/home', 'app/module/home/Index');
    }
}

module.exports = App;