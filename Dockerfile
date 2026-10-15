# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY package*.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY data ./data
COPY --from=builder /app/dist ./dist
RUN mkdir -p logs data/briefings && chown -R node:node /app

USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/api/health || exit 1
CMD ["node", "server/mock-server.mjs"]
