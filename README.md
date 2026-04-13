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

## Docker (runtime com build pronto)

Este projeto usa Nuxt SSR e pode ser executado em container lendo apenas os arquivos ja compilados.

1. Gere o build no ambiente de CI/CD ou local:

```bash
npm run build
```

2. Construa a imagem Docker (o contexto precisa conter a pasta `.output/`):

```bash
docker build -t cuidados-frontend:runtime .
```

3. Execute o container:

```bash
docker run --rm -p 3000:3000 cuidados-frontend:runtime
```

Variaveis de ambiente suportadas no runtime:

- `HOST` (padrao `0.0.0.0`)
- `PORT` (padrao `3000`)
