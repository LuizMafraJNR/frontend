# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Docker (SSR com multi-stage)

Este projeto usa Nuxt SSR com Docker multi-stage: o build e gerado na etapa de build e o runtime executa apenas os arquivos compilados.

1. Construa a imagem Docker:

```bash
docker build -t cuidados-frontend:runtime .
```

2. Execute o container:

```bash
docker run --rm -p 3000:3000 cuidados-frontend:runtime
```

Variaveis de ambiente suportadas no runtime:

- `HOST` (padrao `0.0.0.0`)
- `PORT` (padrao `3000`)
