FROM node:16

HEALTHCHECK --interval=30s --timeout=4s CMD curl -f http://localhost:8085/health || exit 1

WORKDIR /app
#ENV BOOTSTRAP=
COPY . .
RUN yarn
CMD ["yarn", "start"]
EXPOSE 8085