FROM node:22.12.0

WorkDir /socialApp

COPY package*.json .


RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]