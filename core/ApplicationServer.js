const http = require('http');
const fs = require('fs')
const Server = require('./Server');
const Request = require('./http/Request');
const Response = require('./http/Response');

class ApplicationServer {

    static start(root){

        global.req = (path) => {
            return require(root.concat('/').concat(path.replace(/\./g, '/')));
        }

        let config = JSON.parse(fs.readFileSync(root.concat('/server.json')));
        
        const servers  = config.servers || [];

        for(const config of servers){

            config.enabled = config.hasOwnProperty('enabled') ? config.enabled : true;
            config.root = root;

            if(config.enabled){
                
                let appConfig = ApplicationServer._getAppConfig(config);

                const server = new Server(config, appConfig);

                http.createServer(async(req, res) => {

                    const request = new Request(req);
                    const response = new Response(res);

                    await request.init();

                    await server.dispatch(request, response);

                }).listen(config.port);
            }
        }
    }

    static _getAppConfig(config){

        let appConfigFiles = config.app_configs || [];

        let appConfig  = {};

        for(let file of appConfigFiles){
            file = file
                .replaceAll('$root', config.root)
                .replaceAll('$name', config.name);

            Object.assign(appConfig, JSON.parse(fs.readFileSync(file)));
        }

        return appConfig;
    }
}

module.exports = ApplicationServer;