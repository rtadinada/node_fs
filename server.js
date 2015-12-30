var fs = require('fs');
var path = require('path');
var http = require('http');
var args = require('optimist').argv;

// Parse command line arguments
var help = 'USAGE: ' + args.$0 + ' [-f FILES_DIRECTORY] [-p PORT_NO]'
if(args.h || args.help) {
    console.log(help);
    process.exit(0);
}

var filesDir = './files/';
var port = 8080;
if(args.f) {
    filesDir = args.f + '/';
}
if(args.p) {
    port = +args.p;
}


// Server
var server = http.createServer(function(req, res) {
    console.log('Received request for ' + req.url);
    var filePath = filesDir + req.url;
    fs.stat(filePath, makeStatCallback(res, req, filePath, false));
});

server.listen(port);
console.log('Serving on http://localhost:' + port + '...');

function makeStatCallback(res, req, filePath, isIndexed) {
    return function(err, stats) {
        if(!err) {
            if(!isIndexed && stats.isDirectory()) {
                filePath += '/index.html';
                fs.stat(filePath, makeStatCallback(res, req, filePath, true));
                return;
            }
            
            if(stats.isFile()) {
                respondFile(res, filePath);
            }
        }
        else {
            respond404(res, req);
        }
    };
}

function respond404(res, req) {
    console.log('Unable to find file');
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end('<h1><center>ERROR 404: File Not Found</center></h1>Unable to find <b>' + req.url.substring(1) + '</b> on server.');
}

function respondFile(res, filePath) {
    fs.readFile(filePath, function(err, content) {
        if(err) {
            console.log('Unable to serve file');
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end('<h1><center>ERROR 500: Unable to serve file</center></h1>Unable to serve <b>' +
                    req.url.substring(1) + '</b>. Try again later.');
            return;
        }
        console.log('Sending file...');
        res.writeHead(200, {'Content-Type': getMimetype(filePath)});
        res.end(content, 'utf-8');
    });
}

function getMimetype(filePath) {
    switch(path.extname(filePath)) {
        case '.html':
        case '.html':
            return 'text/html';
        case '.jpeg':
        case '.jpg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.css':
            return 'text/css';
        case '.js':
            return 'application/javascript';
        case '.pdf':
            return 'application/pdf';
        default:
            return 'text/plain';
    }
}

