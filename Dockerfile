FROM store/oracle/database-instantclient:12.2.0.1

LABEL author = Jeter Costa e Silva

WORKDIR /usr/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3009

CMD ["npm","start"]
