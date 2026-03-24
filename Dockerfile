FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb .
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Nginx config for Next.js
RUN mkdir -p /var/run/nginx && \
    echo 'server { listen 3000; server_name localhost; location / { proxy_pass http://localhost:3000; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["sh", "-c", "nginx && node server.js"]
