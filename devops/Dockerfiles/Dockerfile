FROM node:22.14.0-alpine

#fd_secret_ignore
ARG APP_USER=app_user
#fd_secret_ignore
ARG APP_GROUP=app_group

WORKDIR /app

COPY package*.json ./

RUN apk update && apk add curl \
    && apk add --no-cache \
    build-base cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev pkgconfig python3 py3-pip \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    tar \
    brotli \
    qpdf \
    libreoffice \
    p7zip \
    && rm -rf /var/cache/apk/*

RUN addgroup -S ${APP_GROUP} && adduser -S ${APP_USER} -G ${APP_GROUP} \
    && chown -R ${APP_USER}:${APP_GROUP} /app

USER ${APP_USER}

# Setup a user-owned directory for global npm packages

ENV NPM_CONFIG_PREFIX=/home/${APP_USER}/.npm-global

ENV PATH=$PATH:/home/${APP_USER}/.npm-global/bin

# Create that directory so global installs work

RUN mkdir -p /home/${APP_USER}/.npm-global

RUN npm i --legacy-peer-deps \
    && npm i nx@20.6.1 -g \
    && npm i pm2 -g \
    && npm i @aws-sdk/client-ses



