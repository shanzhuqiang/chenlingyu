var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');

//配置
var config = {
    port: 8093,
    //denyAccess: ['./app.js', './requirecache.js'],
    localIPs: ['10.19.128.116','10.19.135.111']
    //srcpath: '/src'
};

var urlMap = {
   // '/uidemo/module/service/list.json' : '/alarm/page/1/10.action'
   '/uidemo/module/service/user.json' : '/alarm/add.action'
}



//开始HTTP服务器
var app = http.createServer(processRequestRoute);
app.listen(config.port);

console.log("Server has started. port:"+config.port);

//路由URL
function processRequestRoute(request, response) {

    var pathname = url.parse(request.url).pathname;
    if (pathname === '/') {
        pathname = "/index.html"; //默认页面
    }
    var ext = path.extname(pathname);
    var localPath = ''; //本地相对路径
    var staticres = false; //是否是静态资源
    if (ext.length > 0) {
        localPath = '.' + pathname;
        staticRes = true;
    } else {
        localPath = '.' + config.srcpath + pathname + '.js';
        staticRes = false;
    }

    var postData = ""; //POST & GET ： name=zzl&email=zzl@sina.com
    // 数据块接收中

    // 数据接收完毕，执行回调函数


    if(urlMap[pathname]){
        request.addListener("data", function (postDataChunk) {
            postData += postDataChunk;
            var t = http.request({
                hostname: '10.19.135.111',
                port: 8081,
                path: urlMap[pathname],
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                }
            },function(res){
                res.setEncoding('utf8');
                res.on('data', function(body) {
                    response.writeHead(200, { "Content-Type": "text/plain" });
                    response.end(body);
                });

                //res.resume();
            });
            t.on('error', function(){
                console.log('cannot connect 10.19.135.111');
            });
            t.write(postData);
            t.end();
        });

        request.addListener("end", function () {
        });

        return;
    }

    //禁止远程访问
    if (config.denyAccess && config.denyAccess.length > 0) {
        var islocal = false;
        var remoteAddress = request.connection.remoteAddress;
        for (var j = 0; j < config.localIPs.length; j++) {
            if (remoteAddress === config.localIPs[j]) {
                islocal = true;
                break;
            }
        }
        if (!islocal) {
            for (var i = 0; i < config.denyAccess.length; i++) {
                if (localPath === config.denyAccess[i]) {
                     console.log('bbbbbbbbbbbbbbbbbbbbbbbbbb');
                    response.writeHead(403, { 'Content-Type': 'text/plain' });
                    response.end('403:Deny access to this page');
                    return;
                }
            }
        }
    }


    //禁止访问后端js
    if (staticRes && localPath.indexOf(config.srcpath) >= 0) {
        console.log('xxxxxxxxxxxxxxxxxxxx');
        response.writeHead(403, { 'Content-Type': 'text/plain' });
        response.end('403:Deny access to this page');
        return;
    }



    fs.exists(localPath, function (exists) {
        if (exists) {
            if (staticRes) {
                staticResHandler(localPath, ext, response); //静态资源
            } else {
                try {
                    var handler = require(localPath);
                    if (handler.processRequest && typeof handler.processRequest === 'function') {
                        handler.processRequest(request, response); //动态资源
                    } else {
                        response.writeHead(404, { 'Content-Type': 'text/plain' });
                        response.end('404:Handle Not found');
                    }
                } catch (exception) {
                    console.log('error::url:' + request.url + 'msg:' + exception);
                    response.writeHead(500, { "Content-Type": "text/plain" });
                    response.end("Server Error:" + exception);
                }
            }
        } else { //资源不存在
            response.writeHead(404, { 'Content-Type': 'text/plain' });
            response.end('404:File Not found');
        }
    });

}

//处理静态资源
function staticResHandler(localPath, ext, response) {
    fs.readFile(localPath, "binary", function (error, file) {
        if (error) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Server Error:" + error);
        } else {
            response.writeHead(200, { "Content-Type": getContentTypeByExt(ext) });
            response.end(file, "binary");
        }
    });
}

//得到ContentType
function getContentTypeByExt(ext) {
    ext = ext.toLowerCase();
    if (ext === '.htm' || ext === '.html')
        return 'text/html';
    else if (ext === '.js')
        return 'application/x-javascript';
    else if (ext === '.css')
        return 'text/css';
    else if (ext === '.jpe' || ext === '.jpeg' || ext === '.jpg')
        return 'image/jpeg';
    else if (ext === '.png')
        return 'image/png';
    else if (ext === '.ico')
        return 'image/x-icon';
    else if (ext === '.zip')
        return 'application/zip';
    else if (ext === '.doc')
        return 'application/msword';
    else
        return 'text/plain';
}
