FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=development

FROM base AS deps
COPY package*.json ./
RUN npm install

FROM deps AS dev
COPY . .
CMD ["npm", "run", "start:dev"]

FROM deps AS build
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/main.js"]

