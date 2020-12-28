FROM node:14-buster

RUN mkdir -p /tmp/nodejs
WORKDIR /tmp/nodejs

COPY src .

# RUN npm install ws
RUN npm install express && npm install socket.io

CMD node server-signaling.js