FROM node:current-alpine3.15 AS server-build
WORKDIR /app
COPY . .
RUN npm install
EXPOSE ${PORT}
CMD ["node", "./app.js"]