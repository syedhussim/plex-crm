const { parse } = require('querystring');

class Request{

    constructor(request){
        const protocol = request.socket.encrypted ? 'https' : 'http';
        this._request = request;
        this._url = new Url(new URL(protocol + '://' + request.headers.host + request.url));
        this._method = request.method;
        this._headers = new Map(Object.entries(request.headers));
        this._cookies = new Map();
        this._query = new URLSearchParams(this._url.search());
        this._post = new Post({});

        if(this.headers().has('content-type')){
            let [ contentType, charset ] = this.headers().get('content-type').split(';');
            this.headers().set('content-type', contentType);

            if(charset){
                let [ name, value ] =  charset.split('=');
                this.headers().set(name, value);
            }
        }

        if(this.headers().has('cookie')){
            this._cookies = this._parseCookies(this.headers().get('cookie'));
        }
    }
    
    async init(){
        if(this.method() != 'GET'){
            try{
                let body = await this._parsePostBody();

                if(this.headers().has('content-type') && this.headers().get('content-type') == 'application/json'){

                    let post = {};
        
                    try{
                        post = body ? JSON.parse(body) : {}
                    }catch(e){}

                    this._post = new Post(post);
                }else{
                    this._post = new Post(parse(body));
                }
            }catch(e){ }
        }
    }

    url(){
        return this._url;
    }

    method(){
        return this._method;
    }

    cookies(){
        return this._cookies;
    }

    headers(){
        return this._headers;
    }

    query(){
        return this._query;
    }

    post(){
        return this._post;
    }

    register(fnName, fn){
        this[fnName] = fn;
    }

    _parseCookies(cookie){
        let cookies = new Map();

        if(cookie.length > 0){
            let cookieSections = cookie.split(';');

            for(let idx in cookieSections){
                let cookie = cookieSections[idx].split('=');
                cookies.set(cookie[0].trim(), cookie[1]);
            }
        }
        return cookies;
    }

    _parsePostBody(){
        return new Promise((resolve, reject) => {

            let chunks = [];

            this._request.on('data', data => {
                chunks.push(data);
            });

            this._request.on('end', () => {
                resolve(Buffer.concat(chunks).toString());
            });

            this._request.on('error', err => {
                reject(err);
            });
        });
    }
}

class Url{
    constructor(url){
        this._href = url.href;
        this._origin = url.origin;
        this._protocol = url.protocol;
        this._username = url.username;
        this._password = url.password;
        this._host = url.host;
        this._port = url.port;
        this._host = url.host;
        this._pathname = url.pathname;
        this._extension = '';
        this._search = url.search;
        this._searchParams = url.searchParams;
        this._segments = url.pathname.substring(1).split('/');

        let pos = url.pathname.indexOf('.');

        if(pos > -1){
            this._extension = url.pathname.substring(pos + 1);
        }
    }

    pathname(path = ''){
        if(path){
            this._pathname = path;
        }
        return this._pathname;
    }

    search(){
        return this._search;
    }

    extension(){
        return this._extension;
    }

    segments(index = null){
        if(index != null){
            if(this._segments.length > index){
                return this._segments[index];
            }
            return false;
        }
        return this._segments;
    }
}

class Post{

    constructor(post){
        Object.assign(this, post);
    }

    has(property){
        return this.hasOwnProperty(property);
    }

    get(property, defaultValue = null){
        if(this.hasOwnProperty(property)){
            return this[property];
        }

        if(defaultValue){
            return defaultValue;
        }
        return '';
    }

    *entries(){
        let properties = Object.keys(this);

        for(let property of properties){
            yield { name : property, value : this[property] };
        }
    }
}

module.exports = Request;