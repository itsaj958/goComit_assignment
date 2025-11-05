// ESM version of server.js for New Relic integration
// To use this file:
// 1. Add "type": "module" to package.json
// 2. Convert all require() to import statements
// 3. Use: npm run start:newrelic:esm

// IMPORTANT: Import New Relic as the FIRST line (before any other imports)
import 'newrelic';

import http from 'http';
import app from './app.js';
import { initializeSocket } from './socket.js';

const port = process.env.PORT || 4000;

const server = http.createServer(app);

initializeSocket(server);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    if (process.env.NEW_RELIC_LICENSE_KEY) {
        console.log(`New Relic monitoring enabled for: ${process.env.NEW_RELIC_APP_NAME || 'GoComet DAW'}`);
    }
});


