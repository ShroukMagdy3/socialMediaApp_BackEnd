FROM node:22.12.0

WorkDir /socialApp

COPY package*.json .


RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]