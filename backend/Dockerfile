FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev=false

COPY . .

EXPOSE 4000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all || true; node src/server.js"]
