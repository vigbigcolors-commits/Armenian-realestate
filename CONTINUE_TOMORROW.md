# SmartEstate Armenia — полный контекст для продолжения

> **Для AI-ассистента:** когда пользователь пишет «продолжим» — прочитай этот файл целиком.
> Обновлено: **9 июля 2026, ~23:56 UTC+4**. Это единственный источник правды о состоянии проекта.

---

## Проект

| | |
|---|---|
| **Название** | SmartEstate Armenia — премиум нативная доска недвижимости |
| **Папка** | `d:\ARMENIAN REALESTATE ++` |
| **Стек** | Docker: frontend `:3001`, API `:8000`, Postgres, Redis, Telegram bot |
| **Парсер** | Остановлен по умолчанию (`profiles: ["scraper"]` в docker-compose) |
| **Лента** | Только `source_origin='native' AND moderation_status='approved'` |
| **Сайт** | http://localhost:3001 |
| **API** | http://localhost:8000 |

### Запуск

```powershell
cd "d:\ARMENIAN REALESTATE ++"
docker compose up -d
docker compose restart api bot   # после изменений backend/bot
# Парсер (если нужен): docker compose --profile scraper up -d parser
```

---

## ГЛАВНОЕ: актуальные стратегические решения

### Видение пользователя

- **Премиум-доска** без хаоса: чистые карточки, реальные фото, без дублей и фейков
- **Нативная публикация** — собственники и риелторы публикуют напрямую на SmartEstate
- **Pro для риелторов** — инструменты, алерты в Telegram, умный поиск
- **Покупателям — всё бесплатно** (поиск, фото, история цен, контакт)
- **Монетизация** — только Pro-подписка **9 000֏/мес** для риелторов
- **Telegram-бот** — строго для риелторов; Pro-агенты получают push о новых объявлениях от собственников
- **Сильный UI/UX** — яркие цвета, контраст, mobile-first
- **Никакого старого формата** на маркетинге: нет 4000֏, нет list.am, нет «площадок»

### Зафиксированные решения

| Вопрос | Решение |
|--------|---------|
| Что в ленте | Только нативные одобренные (`native` + `approved`) |
| Старые parsed-данные | ~9000+ `aggregated` — скрыты из ленты |
| Покупатели | **100% бесплатно** |
| Риелторы | Pro **9 000֏/мес** (демо через PaymentPanel + bot) |
| Парсер | Не запускается без `--profile scraper` |
| Маркетинг | Не упоминать list.am / площадки / 4000֏ |
| Демо-контент | 16 объявлений (8 sale + 8 rent), по 2 фото |
| Git commits | **Только по явной просьбе пользователя** |

---

## Что сделано в сессии 9 июля 2026 (вечер)

### 1. Mobile responsive — весь сайт

**Критический фикс:** убран `min-width: 1300px` с `html`, `body`, `.site-shell` и из `tailwind.config.js`.

| Файл | Изменения |
|------|-----------|
| `frontend/src/index.css` | `site-container` px-4→px-12, mobile nav CSS, search/post/how-track fixes |
| `frontend/src/components/Header.tsx` | Гамбургер + drawer: все ссылки, валюта, кабинет, post, CTA |
| `frontend/src/pages/PostListingPage.tsx` | `grid-cols-1 sm:grid-cols-2` |
| `frontend/src/pages/HomePage.tsx` | Кнопки load-more адаптивные |
| `frontend/src/components/BrokerAnalysis.tsx` | flex-wrap |
| `frontend/src/pro-room-nature.css` | Mobile hero Pro Room |

### 2. Цена Pro → 9 000֏

| Файл | Константа/ключ |
|------|----------------|
| `frontend/src/i18n/content.ts` | `mktProPrice` |
| `frontend/src/utils/clientToken.ts` | `PRO_SUBSCRIPTION_AMD = 9000` |
| `api/main.py` | `PRO_SUBSCRIPTION_AMD = 9_000` |
| `bot/i18n/content.py` | `btn_pay_pro`, `pro_info` |

### 3. Hero-иллюстрации маркетинга

**Папка:** `frontend/public/`

| Файл | Страница |
|------|----------|
| `realtors-hero.webp` (~71 KB) | `/realtors` |
| `buyers-hero.webp` | `/buyers` |
| `hero-yerevan.png` | главная `/` |

**Компонент:** `frontend/src/components/MarketingHeroVisual.tsx`
- `<picture>` + WebP
- Класс `.marketing-hero-image` — **ярко-синяя рамка** `#3B82F6` + glow
- Двухколоночный hero: текст слева, картинка справа (`lg:grid-cols-2`)

### 4. Buyers benefits — bento-мозаика (не карточки!)

**Файл:** `frontend/src/components/marketing/BuyersBenefitsMosaic.tsx`

- Асимметричная сетка 12 колонок
- У каждого пункта свой мини-визуал: стек дублей→1 карточка, фото с ✓, график цен, AI-поиск, точки регионов, «0 ֏»
- Цветные акцентные полосы слева
- CSS: `.buyers-benefits-mosaic`, `.buyers-mosaic-*` в `index.css`

### 5. Сделано ранее в этой ветке (важно помнить)

| Область | Файлы | Статус |
|---------|-------|--------|
| Форма `/post` | `PostListingPage.tsx` | 4 шага, цена AMD/USD/EUR, email, hide phone |
| Кабинет продавца | `SellerAccountPage.tsx`, `/account` | register/login, listings, favorites |
| Auth | `AuthContext.tsx`, `api/seller_routes.py` | PBKDF2 пароли, JWT sessions |
| Pro Room | `ProRoomPage.tsx`, `pro-room-nature.css` | nature palette, без brown gradient |
| Telegram bot | `bot/main.py`, `bot/i18n/content.py` | realtor-only, Pro alerts, /start fix |
| Favorites | `FavoriteButton.tsx`, API sync | гости → modal → `/account` |
| Property gallery | `PropertyGallery.tsx` | слайдер, lightbox |
| Seed | `api/scripts/seed_demo_listings.py` | 16 демо |

---

## Ключевые файлы (актуальные)

```
frontend/public/
  hero-yerevan.png
  realtors-hero.webp
  buyers-hero.webp

frontend/src/
  pages/
    HomePage.tsx
    RealtorsPage.tsx      — hero image + Pro tools + subscribe
    BuyersPage.tsx        — hero image + BuyersBenefitsMosaic
    PostListingPage.tsx
    PropertyPage.tsx
    ProRoomPage.tsx
    SellerAccountPage.tsx — /account
  components/
    Header.tsx            — mobile nav drawer
    MarketingHeroVisual.tsx
    marketing/
      FlowDiagram.tsx
      BuyersBenefitsMosaic.tsx
    PaymentPanel.tsx
    PropertyGallery.tsx
    FavoriteButton.tsx
  i18n/content.ts
  index.css               — ~5300+ строк, mobile + mosaic CSS
  pro-room-nature.css
  utils/clientToken.ts    — PRO_SUBSCRIPTION_AMD=9000

api/
  main.py
  seller_routes.py
  native_listings.py
  bot_routes.py
  notify.py

bot/
  main.py
  i18n/content.py
  api_client.py
  keyboards.py

database/
  migrate_phase6_native.sql
  migrate_phase7_bot.sql
  migrate_phase8_seller.sql
```

---

## API endpoints (важные)

| Метод | URL | Описание |
|-------|-----|----------|
| GET | `/api/properties` | Лента (native approved) |
| GET | `/api/properties/{id}` | Деталь + contact (respect hide_phone) |
| POST | `/api/listings/submit` | Публикация |
| POST | `/api/uploads/photo` | Загрузка фото |
| POST | `/api/seller/register` | Регистрация продавца |
| POST | `/api/seller/login` | Логин |
| GET | `/api/seller/me` | Профиль |
| GET | `/api/seller/my-listings` | Мои объявления |
| GET | `/api/seller/favorites` | Избранное |
| POST | `/api/payments/subscribe-pro` | Pro подписка (demo/idram) |

---

## Что НЕ сделано / осталось на потом

### Приоритет 1 — полировка UI

| Задача | Статус |
|--------|--------|
| Редизайн блока «Почему выгодно покупать у наших продавцов» на `/buyers` | ⏳ пользователь может попросить в стиле mosaic |
| Редизайн аналогичных скучных блоков на `/realtors` | ⏳ |
| SEO meta-теги | ⏳ |
| `hero-yerevan.png` → WebP на главной | ⏳ опционально |
| Проверить mobile на реальном телефоне (~375px) | ⏳ |
| Реальный URL VeloTools | ⏳ placeholder |

### Приоритет 2 — функционал

| Задача | Статус |
|--------|--------|
| Legal: `/terms`, `/privacy`, `/safety`, `/listing-rules` | ⏳ |
| Модерация объявлений (UI pending → approved) | ⏳ схема есть |
| Реальные платежи Idram (web + bot с `telegram_id`) | ⏳ demo only |
| `SITE_URL` HTTPS для Telegram URL-кнопок | ⏳ localhost → callback |
| Price alert delivery worker для bot filters | ⏳ |
| Saved searches | ⏳ |

### Приоритет 3 — техдолг

| Задача | Статус |
|--------|--------|
| Убрать `CONTACT_UNLOCK_AMD` / contact mode из PaymentPanel | ⏳ |
| Merge `pro-room-nature.css` в main block | ⏳ |
| Migration runner автоматический | ⏳ |
| Геокодинг / карта | ⏳ UI есть, данных мало |

---

## Страницы для проверки в браузере

| URL | Что смотреть |
|-----|--------------|
| http://localhost:3001/ | Лента, поиск, mobile menu |
| http://localhost:3001/realtors | Hero webp, синяя рамка, Pro subscribe 9 000֏ |
| http://localhost:3001/buyers | Hero webp, bento benefits mosaic |
| http://localhost:3001/pro | Nature palette, mobile |
| http://localhost:3001/post | 4 шага, цена, контакт |
| http://localhost:3001/account | Кабинет продавца |
| http://localhost:3001/property/{id} | Галерея, избранное |

**Mobile:** DevTools 375px — меню ☰, без горизонтального скролла.

---

## Команды для проверки

```powershell
cd "d:\ARMENIAN REALESTATE ++"

docker compose ps
docker compose up -d
docker compose restart api bot frontend

# Демо-объявления
docker compose exec api python scripts/seed_demo_listings.py

# Статистика
Invoke-RestMethod http://localhost:8000/api/stats

# Поиск старого формата
rg "4000|20.?000|list\.am|площадк" frontend/src bot/
```

---

## История запросов пользователя (важные нюансы)

1. **Mobile всё ломалось** — убран min-width 1300px, добавлен mobile nav
2. **Pro цена 9 000֏** — везде (сайт, API, бот)
3. **Hero картинки** — realtors + buyers webp в public, синяя рамка
4. **Buyers benefits скучные** — bento mosaic, не карточки
5. **Не коммитить** без явной просьбы
6. **Бот только для риелторов** — не для покупателей
7. **Покупателям бесплатно** — без 4000֏

---

## Как продолжить после рестарта

1. Прочитать **этот файл**
2. `docker compose up -d`
3. Открыть страницы выше — desktop + mobile
4. Спросить пользователя приоритет:
   - **A)** Полировка UI (seller block на buyers, другие скучные секции)
   - **B)** SEO + meta
   - **C)** Модерация + admin UI
   - **D)** Idram реальные платежи
   - **E)** Legal-страницы

### Фраза пользователя для старта

> «продолжим» / «поехали» / «читай CONTINUE_TOMORROW»

---

## Transcript сессии

`C:\Users\Vigen\.cursor\projects\d-ARMENIAN-REALESTATE\agent-transcripts\3dc6016d-9ebe-4e49-9fd1-744ead3f617b\3dc6016d-9ebe-4e49-9fd1-744ead3f617b.jsonl`

---

## Changelog последней сессии (9 июля, вечер)

```
✅ Mobile responsive — min-width убран, Header drawer, search/post/how CSS
✅ Pro цена 9 000֏ — frontend, API, bot, i18n
✅ realtors-hero.webp + buyers-hero.webp — MarketingHeroVisual, 2-col hero
✅ Синяя рамка .marketing-hero-image на маркетинговых hero
✅ BuyersBenefitsMosaic — bento вместо 6 одинаковых карточек
⏳ Seller block на /buyers — редизайн по запросу
⏳ SEO meta
⏳ Idram реальные платежи
⏳ Модерация UI
⏳ Legal pages
```
