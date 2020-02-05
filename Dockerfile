FROM node:10 as builder
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM wlchn/gostatic
COPY --from=builder /app/build/ /srv/http
CMD ["/goStatic"]
