var http = require('http');

const PORT = process.env.PORT || 8080;

function handleRequest (request, response) {
    response.end('Hi');
}

var server = http.createServer(handleRequest);
server.listen(PORT, () => {});
