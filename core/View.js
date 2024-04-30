const fs = require('fs/promises');

class View{

    constructor(dir){
        this._viewDir = dir
        this._params = {};
        this._prependFiles = [];
        this._appendFiles = [];
    }

    prependFile(file){
        this._prependFiles.push(file);
    }

    appendFile(file){
        this._appendFiles.push(file);
    }

    param(name, value){
        this._params[name] = value;
    }

    async render(files, params = {}){

        if(typeof files == 'string'){
            files = [ files ];
        }

        files = this._prependFiles.concat(files);

        files = files.concat(this._appendFiles);

        let data = [];

        for(let file of files){ 
            let buffer = await fs.readFile(this._viewDir.concat(file).concat('.tpl'));
            data.push(buffer.toString('UTF8'));
        }

        return await this._parse(data.join("\n"), params);
    }

    async renderString(string, params = {}){
        return await this._parse(string, params);
    }

    async _parse(string, params = {}){

        let len = string.length;
        let token = '';
        let tokens = [];
        let codeBlock = false;
        let codeType = '';

        for(let i=0; i < len; i++){
            let ch =  string[i];
            let nc = string[i + 1] || false;

            if((ch == '{' && nc == '%') || (ch == '{' && nc == '{')){
                codeType = (ch == '{' && nc == '{') ? 'VARIABLE' : 'CODE';
                tokens.push({
                    type : 'STRING',
                    value : token
                });

                token = '';
                codeBlock = true;
                i++;
                continue;
            }

            if((ch == '%' && nc == '}') || (ch == '}' && nc == '}') && codeBlock){
                tokens.push({
                    type : codeType,
                    value : token
                });

                token = '';
                codeBlock = false;
                i++;
                continue;
            }

            token += ch;
        }

        tokens.push({
            type : 'STRING',
            value : token
        });

        let output = "let out = '';";

        for(let token of tokens){
            switch(token.type){
                case 'STRING':
                    output += "out +=`" + token.value + "`;"
                    break;
                case 'VARIABLE':
                    output += "out +=" + this._parseVariable(token.value) + ";"
                    break;
                case 'CODE': 
                    output += this._processCode(token.value);
                    break;
            }
        }

        output += ' return out;';

        params = {...this._params, ...params };

        params['include'] = async(file) =>{
            let view = new View(this._viewDir);
            return await view.render(file, params);
        };

        params['trim'] = function(item){
            if(Array.isArray(item)){
                return item.map(i =>  i.trim() );
            }

            if (typeof item === 'string'){
                return item.trim();
            }

            return '';
        };

        params['upper'] = function(str){
            return str.toUpperCase();
        };

        params['lower'] = function(str){
            return str.toLowerCase();
        };

        params['split'] = function(str){
            return str.split(/,|_| |\n/);
        };

        params['last'] = function(item){
            if(Array.isArray(item)){
                return item.pop();
            }

            if (typeof item === 'string'){
                return item.substring(item.length -1);
            }

            return '';
        };

        let keys = [];
        let vals = []; 

        for(let key of Object.keys(params)){
            keys.push(key);
            vals.push(params[key]);
        }

        let asyncConstructor = Object.getPrototypeOf(async function(){}).constructor;

        let func = new asyncConstructor(...keys, output);

        return await func(...vals);
    }

    _parseVariable(tokenValue){

        if(tokenValue.indexOf('|') > -1){
            let [variable, ...funcs] = tokenValue.split('|').map(i => i.trim());

            if(funcs.length > 0){

                let func = function(str, funcs, idx){

                    str = funcs[idx] + '(' + str + ')';

                    idx++;

                    if(idx < funcs.length){
                        return func(str, funcs, idx);
                    }

                    return str;
                };

                return func(variable, funcs, 0);
            }
        }

        if(tokenValue[tokenValue.trim().length] == '?'){
            tokenValue = tokenValue.trim() + tokenValue.trim().replace('?', '') + ' : ""';
        }

        return tokenValue;
    }

    _processCode(blockToken){
        let tokens = blockToken.trim().split(' ');

        switch(tokens[0]){
            case 'if':  
                return 'if (' + tokens.splice(1).join(' ') + '){';
            case 'elseif':  
                return '}else if (' + tokens.splice(1).join(' ') + '){';
            case 'else': 
                return '}else{';
            case 'for': 
                return 'for (' + tokens.splice(1).join(' ') + '){';
            case 'foreach': 

                let item = tokens[1];

                if(item.indexOf(':') > -1){
                    let segments = tokens[1].split(':');
                    let key = segments[0];
                    item = segments[1];
                    return 'for (let [' + key + ',' + item + '] of ' + tokens[tokens.length-1] + '){';
                } 

                let capture = false;
                let array = [];

                for(let item of tokens){
                    if(item == 'in'){
                        capture = true;
                        continue;
                    }

                    if(capture){
                        array.push(item);
                    }
                }
                return 'for (let ' + item + ' of ' + array.join('') + '){';
            case '/if': 
            case '/for': 
            case '/foreach': 
                return '}';
            default:
                return blockToken;
        }
    }
}

module.exports = View;