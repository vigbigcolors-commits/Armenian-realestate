# Cloudflare Pages — деплой фронтенда

## Подключение через GitHub (рекомендуется)

1. Откройте [Cloudflare Dashboard → Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
2. **Create** → **Pages** → **Connect to Git**
3. Репозиторий: `vigbigcolors-commits/Armenian-realestate`
4. Настройки сборки:

| Параметр | Значение |
|----------|----------|
| Framework preset | Vite |
| Root directory | `frontend` |
| Build command | `npm run build` |
| Build output directory | `dist` |

5. Environment variables (Production):

| Name | Value |
|------|--------|
| `VITE_API_URL` | публичный URL API (например `https://api.yourdomain.com`) |

> Без публичного API сайт откроется, но лента/поиск не заработают — API сейчас только в Docker на localhost.

## SPA routing

В `frontend/wrangler.toml` включено:

```toml
[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

Это нужно для React Router (`/buyers`, `/pro` и т.д.). Файл `_redirects` для Workers **не используем** — конфликтует с assets SPA.

## Важно CLI (как сейчас задеплоено)

```powershell
cd frontend
npm install
npm run build
npx wrangler deploy
```

URL: https://realestate.vigbigcolors.workers.dev
