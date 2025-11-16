FROM nginx:alpine

WORKDIR /usr/share/nginx/html

COPY . .

COPY main/main.html ./index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]