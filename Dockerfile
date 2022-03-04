FROM node:16

ARG DEBUG=0

HEALTHCHECK --interval=5s CMD curl -f http://localhost:8085/health || exit 1

ENV DEBUG ${DEBUG}

WORKDIR /app
ENV BOOTSTRAP="tail -f /dev/random"
ENV NETWORK_ID=vm_net
# LABEL traefik.http.routers.vscodehost.entrypoints=web
LABEL traefik.http.routers.vscodehost.rule PathPrefix(`/vm`)
LABEL traefik.http.routers.vscodehost.middlewares auth_then_strip@file,errorcats@docker
LABEL traefik.port=8085
COPY . .
RUN yarn
CMD ["yarn", "prod"]
EXPOSE 8085
