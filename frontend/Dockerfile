FROM node:18-bookworm-slim AS build

WORKDIR /app

ARG VUE_URL_API
ARG VUE_FACEBOOK_APP_ID

ENV NODE_OPTIONS=--openssl-legacy-provider
ENV VUE_URL_API=$VUE_URL_API
ENV VUE_FACEBOOK_APP_ID=$VUE_FACEBOOK_APP_ID

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx quasar build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html

EXPOSE 8080
