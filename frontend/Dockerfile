FROM nginx:1.29-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
COPY config.docker.js /usr/share/nginx/html/config.js

RUN rm -f /usr/share/nginx/html/Dockerfile \
    /usr/share/nginx/html/.dockerignore \
    /usr/share/nginx/html/nginx.conf \
    /usr/share/nginx/html/config.docker.js

EXPOSE 80
