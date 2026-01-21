# ===== Build stage =====
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY . .

# ===== Production stage =====
FROM node:24-alpine AS production

RUN apk add --no-cache tini

RUN addgroup -g 1001 -S botgroup && \
    adduser -S -u 1001 -G botgroup botuser

# Resten af din Dockerfile...
WORKDIR /app
COPY --from=builder --chown=botuser:botgroup /app /app
USER botuser

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start:prod"]
