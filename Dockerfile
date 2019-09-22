FROM node:12.10.0-alpine

LABEL author = Jeter Costa e Silva

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3009

CMD ["npm","start"]
