FROM nginx:1.24.0

ADD  nginx.conf /etc/nginx/conf.d/default.conf

COPY /build/webapp /usr/share/nginx/html
COPY /consul /consul
COPY run.sh /run.sh

RUN apt-get update && apt-get install -y curl xz-utils \
    && curl -fsSL https://nodejs.org/dist/v12.22.12/node-v12.22.12-linux-x64.tar.xz | tar -xJ --strip-components=1 -C /usr/local \
    && apt-get install -y gettext \
    && mv consul/package.json package.json \
    && npm install

CMD ./run.sh
