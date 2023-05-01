FROM node:14-slim

WORKDIR /code
COPY . .

RUN cd client && npm install && cd ../server && npm install
RUN npm install --global cross-env
RUN npm run prepareSettings

ENV NODE_ENV="production"
ENV REACT_APP_CLIENT_HOST="https://charts-web.gro-api.com"
ENV REACT_APP_API_HOST="https://charts-api.gro-api.com"

RUN echo -e "\nBuilding the UI. This might take a couple of minutes...\n"
RUN cd client && npm run build && mkdir -p dist && cp -rf build/* dist/

EXPOSE 4018
EXPOSE 4019

ENTRYPOINT ["./entrypoint.sh"]
