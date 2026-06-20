# Stage 1: Install production dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nodeuser

EXPOSE 4001

CMD ["node", "src/index.js"]
