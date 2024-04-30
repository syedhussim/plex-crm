const fs = require('fs/promises');
const http = require(`http`);
const Request = require("./http/Request");
const Response = require("./http/Response");

class Server{

    static start(documentRoot){

        http.createServer(async(req, res) => {

            const app = new (require(documentRoot + '/App.js'))({
                documentRoot : documentRoot
            });

            const request = new Request(req);
            const response = new Response(res);

            await app.load(request, response);

            await app.dispatch(request, response);

            await app.unload(request, response);

        }).listen(30000);
    }
}

module.exports = Server;