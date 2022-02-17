FROM node:16
WORKDIR /app
#ENV BOOTSTRAP=
COPY . .
RUN yarn
CMD ["yarn", "start"]
EXPOSE 8085
