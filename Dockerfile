FROM node:16
WORKDIR /app
ENV BOOTSTRAP=/bin/bash
COPY . .
RUN yarn
CMD ["yarn", "start"]
