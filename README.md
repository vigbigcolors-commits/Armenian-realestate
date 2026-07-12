# SmartEstate Armenia

Премиум-доска недвижимости для Армении. Чистая лента без дублей, Pro-инструменты для риелторов, бесплатный поиск для покупателей.

## Стек

- **Frontend:** React + Vite + Tailwind (`frontend/`)
- **API:** FastAPI + Postgres + Redis (`api/`)
- **Bot:** Telegram (`bot/`)
- **Deploy frontend:** Cloudflare Pages

## Локальный запуск

```powershell
cd "d:\ARMENIAN REALESTATE ++"
copy .env.example .env   # заполните секреты
docker compose up -d
```

- Сайт: http://localhost:3001  
- API: http://localhost:8000  

## Cloudflare Pages

1. Подключите этот репозиторий в [Cloudflare Pages](https://dash.cloudflare.com/)
2. Настройки билда:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output:** `dist`
3. Environment variable (Production):
   - `VITE_API_URL` = публичный URL вашего API (например `https://api.example.com`)

Без публичного API фронт на Pages откроется, но данные/поиск не заработают.

## Важно

Файл `.env` **не коммитится**. Используйте `.env.example` как шаблон.
