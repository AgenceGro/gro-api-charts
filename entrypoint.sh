#!/bin/bash

# all env vars used in the client app need to be set here as well
export REACT_APP_API_HOST=${REACT_APP_API_HOST}
export REACT_APP_CLIENT_HOST=${REACT_APP_CLIENT_HOST}
export REACT_APP_ONE_ACCOUNT_EXTERNAL_ID=${REACT_APP_ONE_ACCOUNT_EXTERNAL_ID}

cd client
mkdir -p dist
npx serve -s -p 4018 dist
npm run build && cp -rf build/* dist/ &

cd ../server
NODE_ENV=production nohup node index.js &

