FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM deps AS prod
COPY src/ ./src/
EXPOSE 3099
CMD ["node", "src/index.js"]
