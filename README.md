# Bulir: aplicação web (Desafio 2)

Aplicação web da plataforma de contratação de prestadores de serviços, em Next.js (App Router), React e TypeScript. Consome a API do desafio 1.

## Funcionalidades

| Enunciado | Onde está |
| --- | --- |
| Login com e-mail ou NIF e palavra-passe | `features/auth` |
| Prestador: criar, listar, editar e excluir serviços (título, descrição, preço, imagem) | `features/services` (`MyServicesPage`, `ServiceForm`) |
| Cliente: ver todos os serviços e contratá-los, com verificação de saldo | `features/services` (`ExplorePage`) e `features/bookings` (`HireModal`) |
| Saldo do cliente e do prestador atualizado ao contratar | `features/wallet` e `features/bookings` |
| Histórico de transações: serviço, prestador, cliente e valor | `features/bookings` (`HistoryPage`) |

A sessão vive em cookies `httpOnly` que a API põe: o JavaScript nunca lê o token (o enunciado permite guardá-lo no estado ou no `localStorage`, e isto é mais seguro).

## Requisitos

- Node.js 22 ou superior
- A API a correr (local em `http://localhost:3000`, ou alojada)

## Executar

```bash
npm install
cp .env.example .env     # ajuste API_URL se a API não estiver em localhost:3000
npm run dev              # http://localhost:3000 (se a API usar a 3000, use: npx next dev -p 3150)
```

| Comando | O que faz |
| --- | --- |
| `npm run build` e `npm start` | Compila e serve a versão de produção |
| `npm run typecheck` | Verifica os tipos (TypeScript estrito) |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (`node:test`, sem dependências, em TypeScript) |
| `npm run test:e2e` | Testes de interface (Playwright), contra a aplicação e a API a correr |

## Como fala com a API

O navegador só fala com este site. O Next reencaminha os pedidos a `/v1/*` para a API (`API_URL`, em `next.config.mjs`), mantendo os mesmos caminhos. Por isso:

- os cookies de sessão da API (`httpOnly`, `SameSite=Strict`) são do mesmo site e funcionam;
- a API não precisa de CORS para esta aplicação;
- o token nunca fica em `localStorage`, onde um script o poderia ler.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `app/` | Rotas (App Router): landing, `/cliente`, `/prestador` e `/app` (a aplicação) |
| `features/` | Uma pasta por funcionalidade: `auth`, `services`, `bookings`, `wallet`, `account`, `landing`, `session` e `dashboard` (o menu, o cabeçalho e o que as páginas partilham) |
| `components/` | Peças de interface partilhadas (`Icon`, `Brand`, `FilterSelect`, `Pagination`, `ConfirmDialog`...) |
| `lib/` | Lógica sem React: pedidos à API, conversão de dados, imagens, formatação (com testes ao lado) |
| `types/` | Os tipos do domínio e da API |
| `styles/` | Estilos globais e a fonte de ícones |
| `tests/e2e/` | Testes de interface (Playwright) |

## Alojamento

Está alojada na Vercel (https://bulir-frontend.vercel.app), a falar com a API alojada na Render. A única configuração é a variável `API_URL` (o endereço da API, sem `/v1`). O Next reencaminha `/v1/*` para ela, por isso a sessão por cookies funciona sem CORS.

Atrás de dois proxies (a Vercel e a Render), a API tem de ter `TRUST_PROXY=2` para o limite de pedidos contar cada pessoa e não a Vercel inteira.

## Contas para experimentar

Em https://bulir-frontend.vercel.app há quatro contas de demonstração, com serviços e saldo já criados. Todas usam a senha `Senha-Segura-123`.

| Perfil | E-mail | O que tem |
| --- | --- | --- |
| Cliente | `ana@seed.bulir.dev` | Saldo de 50 000,00 Kz e três contratações (confirmada, cancelada e concluída) |
| Cliente | `bruno@seed.bulir.dev` | Saldo de 2 000,00 Kz, sem contratações |
| Prestador | `barbeiro@seed.bulir.dev` | Seis serviços (beleza, casa, educação e tecnologia) |
| Prestador | `massagista@seed.bulir.dev` | Cinco serviços (saúde, automóvel, eventos, tecnologia e educação) |

A API limita os logins a 5 por minuto: se aparecer um aviso de demasiados pedidos, espere um minuto. Para ver tudo de raiz, crie a sua conta em "Criar conta".

## Testes de interface

`npm run test:e2e` arranca o Next (porta 3150) e corre os testes em Chromium contra a API em `API_URL`. Cada execução cria as suas contas (`e2e-...@teste.dev`) e os seus serviços, e nunca usa contas fixas. A API limita os logins a 5 por minuto, por isso a suite espera por uma vaga quando precisa. O envio de imagens ao Cloudinary é simulado nos testes, para não deixar ficheiros em conta nenhuma.

Os testes deixam as contas de teste na base de dados da API: numa base local, apaga-se com `docker compose down -v` no repositório do backend.
