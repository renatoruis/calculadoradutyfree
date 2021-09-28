FROM node:alpine

COPY . .

RUN npm install -g npm; npm i

ENTRYPOINT [ "node", "index.js" ]