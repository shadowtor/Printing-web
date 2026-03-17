FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./ 
RUN npm install

COPY tsconfig.json eslint.config.mjs prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/src/api/server.js"]

