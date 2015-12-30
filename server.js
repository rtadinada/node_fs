var fs = require('fs');
var path = require('path');
var http = require('http');
var args = require('optimist').argv;

// Parse command line arguments
var help = "USAGE: " + args.$0 + " [-f FILES_DIRECTORY] [-p PORT_NO]"
if(args.h || args.help) {
    console.log(help);
    process.exit(0);
}

var files_dir = "./files/";
var port = 8080;
if(args.f) {
    files_dir = args.f + "/";
}
if(args.p) {
    port = +args.p;
}


// Server
var server = http.createServer(function(req, res) {
    console.log("Received request for " + req.url);
    file_path = files_dir + req.url;
    fs.stat(file_path, make_stat_callback(res, req, file_path, false));
});

server.listen(port);
console.log("Serving on http://localhost:" + port + "...");

function make_stat_callback(res, req, file_path, is_indexed) {
    return function(err, stats) {
        if(!err) {
            if(!is_indexed && stats.isDirectory()) {
                file_path += "/index.html";
                fs.stat(file_path, make_stat_callback(res, req, file_path, true));
                return;
            }
            
            if(stats.isFile()) {
                respond_file(res, file_path);
            }
        }
        else {
            respond_404(res, req);
        }
    };
}

function respond_404(res, req) {
    console.log("Unable to find file");
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.end("<h1><center>ERROR 404: File Not Found</center></h1>Unable to find <b>" + req.url.substring(1) + "</b> on server.");
}

function respond_file(res, file_path) {
    fs.readFile(file_path, function(err, content) {
        if(err) {
            console.log("Unable to serve file");
            res.writeHead(500, {'Content-Type': 'text/html'});
            res.end("<h1><center>ERROR 500: Unable to serve file</center></h1>Unable to serve <b>" +
                    req.url.substring(1) + "</b>. Try again later.");
            return;
        }
        console.log("Sending file...");
        res.writeHead(200, {'Content-Type': get_mimetype(file_path)});
        res.end(content, 'utf-8');
    });
}

function get_mimetype(file_path) {
    switch(path.extname(file_path)) {
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

