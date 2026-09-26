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
CMD ["node", "server/mock-server.mjs"]
