FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Vite inlines this at build time; pass --build-arg to point at another API.
ARG VITE_API_BASE_URL=http://localhost/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm test && npm run build

FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
