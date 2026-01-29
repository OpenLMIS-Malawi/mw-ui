FROM nginx:1.24.0

ADD nginx.conf /etc/nginx/conf.d/default.conf

COPY /build/webapp /usr/share/nginx/html
COPY /consul /consul
COPY run.sh /run.sh

RUN chmod +x run.sh
COPY --from=node:12-bullseye /usr/local/bin/node /usr/local/bin/node
COPY --from=node:12-bullseye /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && \
    ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

RUN apt-get update && apt-get install -y gettext
RUN mv consul/package.json package.json
RUN npm install

CMD ["./run.sh"]
