FROM node:10 as builder
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

# FROM wlchn/gostatic
# COPY --from=builder /app/build/ /srv/http
# CMD ["/goStatic"]

FROM mhart/alpine-node
RUN yarn global add serve
WORKDIR /app
COPY --from=builder /app/build .
CMD ["serve", "-p", "8080", "-s", "."]
