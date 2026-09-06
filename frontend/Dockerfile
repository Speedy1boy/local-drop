FROM node:22-alpine AS build
WORKDIR /app

COPY . .
RUN npm install
RUN npm run build --workspace=shared
RUN npm run build --workspace=frontend

FROM nginx:alpine
COPY --from=build /app/frontend/dist/frontend/browser /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80