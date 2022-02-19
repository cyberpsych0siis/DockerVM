FROM node:16

HEALTHCHECK --interval=30s --timeout=4s CMD curl -f http://localhost:8085/health || exit 1

WORKDIR /app
ENV BOOTSTRAP="tail -f /dev/random"
COPY . .
RUN yarn
CMD ["yarn", "prod"]
EXPOSE 8085
