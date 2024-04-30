const Routes = require('./Routes');

class Application{

    constructor(config){
        this.documentRoot = config.documentRoot;
        this.routes = new Routes();
    }

    async load(request, response){
    }

    async dispatch(request, response){

        for(let route of this.routes){

            if(route.path == request.url().pathname()){

                let controller = new (require(this.documentRoot.concat('/').concat(route.controller)))();
                
                // Object.assign(controller, { 
                //     ...this._dependencies,
                //     root : this.root, 
                //     config : this.config, 
                //     appStorage : this._appStorage, 
                //     request : this.request, 
                //     response : this.response,
                // });

                let output = '';

                // if(await controller.authorize()){
                     output = await controller.execute();
                // }

                if(output instanceof Object){
                    output = JSON.stringify(output);
                    response.contentType('application/json');
                }else{
                    response.contentType('text/html; charset=UTF8');
                }

                response.write(output).flush();
                break;
            }
        }

        this._tryFile(request, response);
    }

    async unload(request, response){
    }

    async error(e){}

    async _tryFile(request, response){

        let path = this.documentRoot.concat('/public').concat(request.url().pathname());
        console.log(path);
            



                console.log(request.url().pathname());
            

                        // try{
                        //     let buffer = await fs.readFile(path);

                        //     response.write(buffer)
                        //         .contentType(response.mimeType(request.url().extension()))
                        //         .flush();

                        // }catch(e){}
                    
                
            
        
    }
}

module.exports = Application;