@echo off
REM Windows batch script to start server with New Relic (ESM)
set NEW_RELIC_APP_NAME=Anuj2
set NEW_RELIC_LICENSE_KEY=7224a8ee0d182f2dcc1cee0eadfa43aeFFFFNRAL
node --experimental-loader=newrelic/esm-loader.mjs server.js


