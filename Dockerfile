# Build AutoPilot API from monorepo root (Easypanel: Build Path = /)
FROM node:20-alpine

WORKDIR /app

COPY web/backend/package*.json ./
RUN npm ci --omit=dev

COPY web/backend/src ./src

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/index.js"]
