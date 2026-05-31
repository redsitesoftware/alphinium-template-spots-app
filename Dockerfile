FROM node:20-alpine AS builder
WORKDIR /app
COPY react-native/package*.json react-native/alphinium-auth-0.1.0.tgz ./
RUN npm install --legacy-peer-deps
COPY react-native/ .
RUN npx expo export --platform web --output-dir dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
