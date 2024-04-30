class Response{
    constructor(response){
        this._response = response;
        this._httpCode = 200;
        this._headers = {};
        this._cookies = new Map();
        this._output = '';
        this._redirectLocation = '';
        this._flushed = false;
        this._mimeTypes = new Map();
        this._mimeTypes.set('txt', 'text/plain');
        this._mimeTypes.set('html', 'text/html');
        this._mimeTypes.set('js', 'text/javascript');
        this._mimeTypes.set('css', 'text/css');
        this._mimeTypes.set('svg', 'image/svg+xml');
    }

    httpCode(code){
        this._httpCode = code;
        return this;
    }

    cookies(){
        return this._cookies;
    }

    mimeType(type){
        if(this._mimeTypes.has(type)){
            return this._mimeTypes.get(type);
        }
        return this._mimeTypes.get('txt');
    }

    contentType(type){
        if(!this.hasHeader('Content-Type')){
            this.addHeader("Content-Type", type);
        }
        return this;
    }

    addHeader(header, value){
        this._headers[header] = value;
        return this;
    }

    hasHeader(header){
        if(this._headers.hasOwnProperty(header)){
            return true;
        }
        return false;
    }

    write(string){
        this._output = string;
        return this;
    }

    html(string, httpCode = null){
        if(httpCode){
            this.httpCode(httpCode);
        }
        this.contentType('text/html').write(string).flush();
    }

    json(object, httpCode = null){
        if(httpCode){
            this.httpCode(httpCode);
        }
        this.contentType('application/json').write(JSON.stringify(object)).flush();
    }

    redirect(location, code = 302){
        this._redirectLocation = location;
        this.httpCode(code);
        this.flush();
    }

    flushed(){
        return this._flushed;
    }

    flush(){

        if(this._flushed){
            return;
        }

        let cookieHeader = '';

        for(let [cookieName, cookie] of this._cookies){

            if(cookie instanceof Object){
                cookieHeader += `${cookieName}=${cookie.value};path=${cookie.path}; HttpOnly; SameSite=${cookie.samesite};${cookie.secure ? 'Secure' : ''};`;
            }else{
                cookieHeader += `${cookieName}=${cookie}`;
            }
        }

        if(cookieHeader){
            this.addHeader("Set-Cookie", cookieHeader);
        }

        if(this._redirectLocation){
            this.addHeader('Location', this._redirectLocation);
        }

        this._response.writeHead(this._httpCode, this._headers);
        this._response.end(this._output);
        this._flushed = true;
    }
}

module.exports = Response;