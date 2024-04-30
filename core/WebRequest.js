class WebRequest{

    static async request(options = {}, postData = null){

        let client = options.https ? require('https') : require('http');

        let response = await new Promise((resolve, reject) => {
            
            const req = client.request(options, (response) => {

                let chuncks = [];

                response.on('data', (data) => {
                    chuncks.push(data);
                });

                response.on('end', () => {
                    resolve({ 
                        statusCode: response.statusCode, 
                        headers : response.headers, 
                        data : Buffer.concat(chuncks).toString()
                    });
                });
            });

            req.on('error', function(err){
                reject(err);
            });

            if(postData){
                req.write(postData);
            }
            
            req.end();
        });

        return response;
    }
}

module.exports = WebRequest;