# Bulir: aplicação web (Desafio 2)

Aplicação web da plataforma de contratação de prestadores de serviços, em Next.js (App Router) e React. Consome a API do desafio 1.

## Requisitos

- Node.js 22 ou superior
- A API a correr (local em `http://localhost:3000`, ou alojada)

## Executar

```bash
npm install
cp .env.example .env     # ajuste API_URL se a API não estiver em localhost:3000
npm run dev              # http://localhost:3000 (se a API usar a 3000, o Next passa para a 3001)
```

Outros comandos: `npm run build`, `npm start`, `npm run lint` e `npm test` (testes do Node, sem dependências, para a lógica em `core/`).

## Como fala com a API

O navegador só fala com este site. O Next reencaminha os pedidos a `/v1/*` para a API (`API_URL`, em `next.config.mjs`), mantendo os mesmos caminhos. Por isso:

- os cookies de sessão da API (`httpOnly`, `SameSite=Strict`) são do mesmo site e funcionam;
- a API não precisa de CORS para esta aplicação;
- o token nunca fica em `localStorage`, onde um script o poderia ler.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `app/` | Rotas (App Router): landing, `/cliente`, `/prestador` e `/app` (o painel) |
| `modules/` | Ecrãs por funcionalidade: `auth`, `dashboard`, `landing`, `settings` |
| `core/` | Peças partilhadas: pedidos à API, componentes de base, formatação e estilos |
| `assets/` | Imagens |
