FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY . .

RUN npm install

RUN npm run build --workspace=shared

RUN cd backend && npx prisma generate
RUN npm run build --workspace=backend

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "start:prod"]