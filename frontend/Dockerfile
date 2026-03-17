FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install

COPY tsconfig.json eslint.config.mjs next.config.mjs tailwind.config.js postcss.config.js ./
COPY src ./src
COPY public ./public

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]

