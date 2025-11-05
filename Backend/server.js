// Load New Relic monitoring first (before any other modules)
// This is required for accurate performance monitoring
if (process.env.NEW_RELIC_LICENSE_KEY) {
  require('newrelic');
}

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const port = process.env.PORT || 4000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    if (process.env.NEW_RELIC_LICENSE_KEY) {
        console.log(`New Relic monitoring enabled for: ${process.env.NEW_RELIC_APP_NAME || 'GoComet DAW'}`);
    }
});