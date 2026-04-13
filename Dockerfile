FROM node:20-alpine

WORKDIR /app

# Runtime puro: o build Nuxt deve existir previamente em .output/
COPY .output/ ./.output/

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]