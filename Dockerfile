FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3033

CMD [ "node", "server.js" ]
