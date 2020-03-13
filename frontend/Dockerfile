FROM node:10 as builder
ENV REACT_APP_K8S_API_PERFIX /proxy
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build

FROM nginx:alpine
WORKDIR /app
COPY --from=builder /app/build /build
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/kapp.conf
CMD ["nginx", "-g", "daemon off;"]
