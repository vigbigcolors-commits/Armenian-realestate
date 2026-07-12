/**
 * ═══════════════════════════════════════════════════════════════
 *  SMARTESTATE — ЕДИНСТВЕННЫЙ ФАЙЛ ВСЕХ ТЕКСТОВ ИНТЕРФЕЙСА
 * ═══════════════════════════════════════════════════════════════
 *
 *  Правило: каждый ключ содержит три языка — hy (основной), ru, en.
 *  При изменении текста — обновите ВСЕ три строки сразу.
 *
 *  Основной язык платформы: hy (армянский)
 *  Текущий язык по умолчанию: hy (армянский)
 */

export type Locale = "hy" | "ru" | "en";

/** Основной язык платформы */
export const PRIMARY_LOCALE: Locale = "hy";

/** Язык по умолчанию при первом открытии */
export const DEFAULT_LOCALE: Locale = "hy";

export const LOCALE_LABELS: Record<Locale, string> = {
  hy: "Հայ",
  ru: "Рус",
  en: "Eng",
};

type T = Record<Locale, string>;

function tri(hy: string, ru: string, en: string): T {
  return { hy, ru, en };
}

export const content = {
  // ─── Бренд ───────────────────────────────────────────────
  brand: tri("SmartEstate", "SmartEstate", "SmartEstate"),
  brandTagline: tri(
    "Ազնիվ անշարժ գույք",
    "Честная недвижимость",
    "Honest Real Estate"
  ),
  brandSubtitle: tri(
    "Հայաստան · առանց կրկնօրինակների",
    "Армения · без дубликатов",
    "Armenia · no duplicates"
  ),

  // ─── Навигация ───────────────────────────────────────────
  navHome: tri("Գլխավոր", "Главная", "Home"),
  navSearch: tri("Որոնում", "Поиск", "Search"),
  navProperties: tri("Օբյեկտներ", "Объекты", "Properties"),
  navAbout: tri("Մեր մասին", "О нас", "About"),
  navRealtors: tri("Ռիելտորներ", "Риелторам", "For agents"),
  navBuyers: tri("Գնորդներ", "Покупателям", "For buyers"),
  navMap: tri("Քարտեզ", "Карта", "Map"),
  navTelegram: tri("Telegram", "Telegram", "Telegram"),
  ctaGetStarted: tri("Սկսել →", "Начать →", "Get Started →"),

  // ─── Герой (лендинг) ─────────────────────────────────────
  heroEyebrow: tri("Պրեմիում", "Премиум", "Premium"),
  heroHook: tri(
    "Ծանո՞թ խնդիր է․",
    "Знакомая проблема на рынке недвижимости Армении?",
    "A familiar problem in Armenian real estate?"
  ),
  heroPain: tri(
    "Մեկ բնակարան — 2–10 հայտարարություն տարբեր գներով: Չգիտեք ու՞մ վստահել․",
    "Одна квартира — 2–10 объявлений с разными ценами. Покупатель не знает, кому верить, а риелтор узнаёт последним.",
    "One apartment — 2–10 listings at different prices. Buyers don't know who to trust, and agents find out last."
  ),
  heroTitleMain: tri("Մենք ", "Мы ", "We "),
  heroTitleHighlight: tri("ցույց ենք տալիս իրական շուկան", "показываем реальный рынок", "show the real market"),
  heroTitleEnd: tri("", "", ""),
  heroSolution: tri(
    "Միավորում ենք կրկնօրինակները, պահպանում գների պատմությունը և ցույց ենք տալիս իրական պատկերը՝ առանց ֆեյկերի ու թաքնված մարժաների։",
    "Склеиваем дубликаты, сохраняем историю цен и показываем реальную картину рынка — без фейков и скрытых наценок.",
    "We merge duplicates, keep price history, and reveal the true market — no fakes, no hidden markups."
  ),
  heroDesc: tri(
    "Մաքուր հարթակ՝ առանց կրկնօրինակների։ Pro-ռիելտորները ստանում են նոր հայտարարությունների ազդանշաններ րոպեներ անց հրապարակումից։",
    "Чистая платформа без дублей. Pro-риелторы получают алерты о новых объявлениях через минуты после публикации.",
    "A clean platform with no duplicates. Pro agents get alerts on new listings within minutes of publication."
  ),
  heroCtaPrimary: tri("Գտնել բնակարան", "Найти квартиру", "Find property"),
  heroCtaSecondary: tri("Գնորդներին", "Покупателям", "For buyers"),
  heroCtaRealtors: tri("Pro риելտորների համար", "Pro для риелторов", "Pro for agents"),
  heroCtaOwners: tri("Հրապարակել հայտարարություն", "Опубликовать объявление", "Post a listing"),
  heroAdv1Title: tri("Հաստատված օբյեկտներ", "Проверенные объекты", "Verified listings"),
  heroAdv1Desc: tri("Իրական լուսանկարներ և գներ", "Реальные фото и цены", "Real photos and prices"),
  heroAdv2Title: tri("Խելացի որոնում", "Умный поиск", "Smart search"),
  heroAdv2Desc: tri("Ֆիլտրեր և քարտեզ", "Фильтры и карта", "Filters and map"),
  heroAdv3Title: tri("Անթերի համակարգ", "Безупречная система", "Flawless system"),
  heroAdv3Desc: tri(
    "Առանց կրկնօրինակների և կորցրած գների",
    "Без дублей и потерянных цен",
    "No duplicates or lost prices"
  ),
  heroVisualBadge: tri("Հայաստան · Verified", "Армения · Verified", "Armenia · Verified"),
  heroVisualSub: tri("Գին + պլան · առանց կրկնօրինակների", "Цена + план · без дублей", "Price + plan · no duplicates"),

  // ─── «Как мы это делаем» — перехват объявлений ────────────
  howEyebrow: tri("Ինչպե՞ս ենք դա անում", "Как мы это делаем", "How we do it"),
  howTitle: tri(
    "Իմացեք նոր հայտարարությունների մասին առաջինը",
    "Узнавайте о новых объявлениях первыми",
    "Be the first to know about new listings"
  ),
  howLead: tri(
    "Հայտարարության հրապարակումից մինչև Pro-ռիելտորի ծանուցումը՝ ընդամենը րոպեներ։",
    "От публикации объявления до уведомления Pro-риелтору — считанные минуты.",
    "From a listing going live to a Pro agent's alert — just minutes."
  ),
  how1Title: tri("Հրապարակում", "Публикация", "Published"),
  how1Desc: tri(
    "Սեփականատերը կամ ռիելտորը հրապարակում է հայտարարությունը SmartEstate-ում՝ իրական լուսանկարներով և ճշգրիտ տվյալներով։",
    "Собственник или риелтор публикует объявление на SmartEstate — с реальными фото и точными данными.",
    "An owner or agent publishes on SmartEstate — with real photos and accurate details."
  ),
  how2Title: tri("Մանրակրկիտ որոնում", "Обработка", "Processing"),
  how2Desc: tri(
    "Համակարգը ստուգում է հայտարարությունը, հեռացնում կրկնօրինակները և ավելացնում մաքուր լենտայում։",
    "Система проверяет объявление, убирает дубликаты и добавляет в чистую ленту.",
    "The system verifies the listing, removes duplicates, and adds it to the clean feed."
  ),
  how3Title: tri("Մաքրում", "Очистка", "Cleanup"),
  how3Desc: tri(
    "Մեկ օբյեկտ — մեկ քարտ։ Պահպանվում է գների պատմությունը և կապի տվյալները։",
    "Один объект — одна карточка. Сохраняется история цен и контактные данные.",
    "One property — one card. Price history and contact details are preserved."
  ),
  how4Title: tri("Ծանուցում", "Уведомление", "Alert"),
  how4Desc: tri(
    "Pro-ռիելտորները ստանում են push Telegram-ում՝ առաջինը, շուկայից շուտ։",
    "Pro-риелторы получают пуш в Telegram — первыми, раньше рынка.",
    "Pro agents get a Telegram push — first, ahead of the market."
  ),
  how5Title: tri("Գործարք", "Сделка", "Deal"),
  how5Desc: tri(
    "Դուք զանգում եք սեփականատիրոջը առաջինը և փակում գործարքը, մինչ մյուսները դեռ փնտրում են։",
    "Вы звоните собственнику первым и закрываете сделку, пока другие ещё ищут.",
    "You call the owner first and close the deal while others are still searching."
  ),
  howCtaRealtors: tri("Pro ռիելտորների համար", "Стать Pro-риелтором", "Become a Pro agent"),
  howCtaBuyers: tri("Ինչպես է դա օգնում գնորդին", "Чем это помогает покупателю", "How this helps buyers"),
  sectionFeatures: tri("Խելացի հնարավորություններ", "Умные возможности", "Smart Features"),
  sectionFeaturesSubtitle: tri(
    "Այն, ինչ ուրիշները ջնջում են — մենք պահպանում ենք",
    "Всё, что другие стирают — мы сохраняем",
    "Everything others erase — we preserve"
  ),

  // ─── Статистика ──────────────────────────────────────────
  statObjects: tri("Եզակի օբյեկտներ", "Уникальных объектов", "Unique properties"),
  statDuplicates: tri("Կրկնօրինակներ հեռացված", "Дубликатов убрано", "Duplicates removed"),
  statOwners: tri("Հաստատված սեփականատերեր", "Подтверждённых собственников", "Verified owners"),
  statProcessed: tri("Մշակված հայտարարություններ", "Объявлений обработано", "Listings processed"),

  // ─── Поиск ───────────────────────────────────────────────
  dealRent: tri("Վարձակալություն", "Аренда", "Rent"),
  dealSale: tri("Վաճառք", "Продажа", "Sale"),
  dealType: tri("Գործարք", "Сделка", "Deal type"),
  district: tri("Թաղամաս", "Район", "District"),
  photoPending: tri(
    "Լուսանկարները բեռնվում են",
    "Фото загружаются с объявления",
    "Photos loading from listing",
  ),
  searchPlaceholder: tri(
    "Օպերայի մոտ բնակարան, ամենաէժանը Դիլիջանում…",
    "Квартира возле оперы, самые дешёвые в Дилижане…",
    "Flat near the opera, cheapest in Dilijan…"
  ),
  searchQueryLabel: tri("Խելացի որոնում", "Умный поиск", "Smart search"),
  searchHint: tri(
    "Գրեք ազատ՝ «օպերայի մոտ», «շուկայականից ցածր», «էժան վարձով Դիլիջանում»",
    "Пишите свободно: «возле оперы», «ниже рыночного», «дешёвая аренда в Дилижане»",
    "Type freely: “near the opera”, “below market”, “cheap rent in Dilijan”"
  ),
  currency: tri("Արժույթ", "Валюта", "Currency"),
  allDistricts: tri("Ամբողջ Հայաստանը", "Вся Армения", "All Armenia"),
  rooms: tri("Սենյակներ", "Комнаты", "Rooms"),
  roomUnit: tri("սենյ.", "комн.", "rm."),
  searchButton: tri("Գտնել", "Найти", "Search"),
  anyRooms: tri("Բոլորը", "Любое", "Any"),
  priceRange: tri("Գնի միջակայք", "Диапазон цены", "Price range"),
  // ── Фильтр по дате добавления ──
  ratesLabel: tri("Արժույթի փոխարժեք", "Курс валют", "Exchange rates"),
  dateAdded: tri("Ավելացման ամսաթիվ", "Дата добавления", "Date added"),
  dateAny: tri("Ցանկացած ժամանակ", "За всё время", "Any time"),
  dateToday: tri("Այսօր", "Сегодня", "Today"),
  date3Days: tri("3 օր", "3 дня", "3 days"),
  dateWeek: tri("Շաբաթ", "Неделя", "Week"),
  dateMonth: tri("Ամիս", "Месяц", "Month"),
  loadMore: tri("Բեռնել ավելին", "Загрузить ещё", "Load more"),
  showingCount: tri(
    "Ցույց է տրված {shown} / {total}",
    "Показано {shown} из {total}",
    "Showing {shown} of {total}"
  ),
  priceHistoryFirst: tri("Առաջին գին", "Первая цена", "First price"),
  priceHistoryCurrent: tri("Ընթացիկ գին", "Текущая цена", "Current price"),
  externalListing: tri("Արտաքին աղբյուր", "Внешний источник", "External listing"),
  searchGuideEyebrow: tri("Որոնման ալգորիթմ", "Алгоритм поиска", "Search algorithm"),
  searchGuideTitle: tri("Ինչպես է աշխատում որոնումը", "Как работает поиск", "How search works"),
  searchGuideStep1: tri(
    "Գրեք հարցումը, թաղամասը կամ սենյակների քանակը",
    "Введите запрос, район или число комнат",
    "Enter a query, district, or room count"
  ),
  searchGuideStep2: tri(
    "Համակարգը միավորում է կրկնօրինակները մեկ քարտի մեջ",
    "Система объединяет дубли в одну карточку",
    "The system merges duplicates into one card"
  ),
  searchGuideStep3: tri(
    "Համեմատեք գինը, լուսանկարները և գների պատմությունը",
    "Сравнивайте цену, фото и историю изменений",
    "Compare price, photos, and price history"
  ),
  viewGrid: tri("Ցանց", "Сетка", "Grid"),
  viewMap: tri("Քարտեզ", "Карта", "Map"),

  // ─── Фичи (glass cards) ──────────────────────────────────
  featureRent: tri("Վարձակալություն", "Аренда", "Rent"),
  featureSale: tri("Վաճառք", "Продажа", "Sale"),
  featureMap: tri("Քարտեզ", "Карта", "Map"),
  featureHistory: tri("Գների պատմություն", "История цен", "Price History"),
  featureRentDesc: tri(
    "Վարձակալության գները և հայտարարությունները չեն անհետանում",
    "Цены и объявления по аренде не исчезают со временем",
    "Rental prices and listings don't vanish over time"
  ),
  featureSaleDesc: tri(
    "Յուրաքանչյուր գնային փոփոխություն մնում է տեսանելի",
    "Каждое изменение цены остаётся на виду",
    "Every price change stays visible"
  ),
  featureMapDesc: tri("Հայաստանի քարտեզ", "Карта Армении", "Armenia map"),
  featureHistoryDesc: tri(
    "Պահպանված արխիվ՝ առանց ջնջված գների",
    "Архив без стёртых цен и пропавших объявлений",
    "An archive with no erased prices or lost listings"
  ),

  ctaStartSearch: tri("Գտնել բնակարան →", "Найти квартиру →", "Find property →"),
  mockupTitle: tri("Գտեք ձեր տունը", "Найдите свой дом", "Find your home"),
  mockupGrowth: tri("+22 կրկնօրինակ հեռացված", "+22 дубликата убрано", "+22 duplicates removed"),
  footerTags: tri(
    "Թափանցիկ • Արագ • Անվտանգ • Անկեղծ",
    "Прозрачно • Быстро • Безопасно • Честно",
    "Transparent • Fast • Secure • Honest"
  ),
  sectionProperties: tri("Բնակարաններ", "Квартиры", "Properties"),

  // ─── Для риелторов и покупателей ─────────────────────────
  audienceEyebrow: tri("Կարևոր", "Важно знать", "Good to know"),
  audienceTitle: tri(
    "Ինչ պետք է իմանալ մինչև աշխատելը",
    "Что важно до сделки",
    "What matters before you act"
  ),

  realtorsLabel: tri("Ռիելտորներին", "Риелторам", "For agents"),
  realtorsTitle: tri(
    "Ձեր հայտարարությունը արդեն համեմատվում է",
    "Ваше объявление уже сравнивают",
    "Your listing is already being compared"
  ),
  realtorsSubtitle: tri(
    "SmartEstate-ը միավորում է կրկնօրինակները և ցույց է տալիս իրական գինը՝ առանց գեղեցկացման։",
    "SmartEstate объединяет дубли и показывает реальную цену — без косметики.",
    "SmartEstate merges duplicates and shows the real price — no polish."
  ),
  realtorsPoint1: tri(
    "Նույն բնակարանը 2–10 հայտարարություն է՝ տարբեր գներով։ Հաճախ սեփականատիրոջ գինը ցածր է, քան ձերը։",
    "Одна квартира — 2–10 объявлений с разными ценами. Часто цена собственника ниже вашей.",
    "One flat — 2–10 listings at different prices. Often the owner's price is below yours."
  ),
  realtorsPoint2: tri(
    "Գնի պատմությունը հանրային է. հաճախորդը տեսնում է, երբ դուք բարձրացրել եք կամ իջեցրել գինը։",
    "История цен публична: клиент видит, когда вы подняли или снизили цену.",
    "Price history is public: clients see when you raised or lowered the price."
  ),
  realtorsPoint3: tri(
    "Կրկնօրինակ հայտարարությունները նվազեցնում են վստահությունը. մեկ օբյեկտ — մեկ մաքուր քարտ է ավելի արդյունավետ։",
    "Дубли снижают доверие: один объект — одна чистая карточка работает лучше.",
    "Duplicates erode trust: one property — one clean card works better."
  ),
  realtorsPoint4: tri(
    "Մարժան և «գործակալության վճար» տեսանելի են մինչև զանգը. պատրաստ եղեք բացատրելու տարբերությունը։",
    "Наценка и «комиссия агентства» видны до звонка — будьте готовы объяснить разницу.",
    "Markup and agency fee are visible before the call — be ready to explain the gap."
  ),
  realtorsPoint5: tri(
    "Մաքրված նկարագրությունները և լուսանկարների գալերեան հանել են «գեղեցիկ, բայց ոչ իրական» էֆեկտը։",
    "Чистые описания и галерея фото убирают эффект «красиво, но неправда».",
    "Clean copy and photo galleries remove the «pretty but misleading» effect."
  ),
  realtorsPoint6: tri(
    "Որոնումն անվճար է հաճախորդների համար — նրանք համեմատում են նախքան ձեզ զանգելը։",
    "Поиск бесплатен для клиентов — они сравнивают до того, как позвонят вам.",
    "Search is free for clients — they compare before they call you."
  ),

  buyersLabel: tri("Գնորդներին", "Покупателям", "For buyers"),
  buyersTitle: tri(
    "Մի վճարեք ավելի, քան պետք է",
    "Не переплачивайте лишнего",
    "Don't overpay by mistake"
  ),
  buyersSubtitle: tri(
    "Հայաստանի շուկայում նույն բնակարանը հաճախ վաճառվում է մի քանի անգամ՝ տարբեր միջնորդների միջոցով։",
    "На рынке Армении одну квартиру часто продают несколько раз через разных посредников.",
    "In Armenia the same flat is often listed several times through different brokers."
  ),
  buyersPoint1: tri(
    "Ստուգեք, արդյոք նույն հասցեում ավելի էժան հայտարարություն կա սեփականատիրոջից։",
    "Проверьте, нет ли по тому же адресу объявления дешевле от собственника.",
    "Check if the same address has a cheaper listing from the owner."
  ),
  buyersPoint2: tri(
    "Գնի պատմությունը ցույց է տալիս, արդյոք գինը նոր է բարձրացվել նախօրոք բանակցությունից։",
    "История цен покажет, не подняли ли цену специально перед вашим звонком.",
    "Price history reveals if the price was bumped right before your call."
  ),
  buyersPoint3: tri(
    "Տեսեք բոլոր լուսանկարները մեկ տեղում — ոչ մի մթնավոր նախադիտում։",
    "Смотрите все фото в одном месте — не одно тёмное превью.",
    "See all photos in one place — not a single dark thumbnail."
  ),
  buyersPoint4: tri(
    "Համեմատեք մարժան միջնորդի և սեփականատիրոջ գների միջև — զանգեք ուղիղ, եթե տարբերությունը մեծ է։",
    "Сравните наценку между агентом и собственником — звоните напрямую, если разница большая.",
    "Compare agent markup vs owner price — call direct when the gap is large."
  ),
  buyersPoint5: tri(
    "Մաքրված նկարագրությունը առանց CAPS, սպամի և կրկնօրինակ տեքստի — միայն փաստեր։",
    "Чистое описание без КАПСА, спама и копипасты — только факты.",
    "Clean description without CAPS, spam, and copy-paste — facts only."
  ),
  buyersPoint6: tri(
    "Որոնում, քարտեզ և վերլուծություն — անվճար. վճարում չկա թաքնված։",
    "Поиск, карта и аналитика — бесплатно. Скрытых платежей нет.",
    "Search, map, and analytics — free. No hidden fees."
  ),

  propertyDescription: tri("Նկարագրություն", "Описание", "Description"),
  propertyDescriptionNote: tri(
    "Մաքրված և խմբագրված SmartEstate-ի կողմից",
    "Очищено и отредактировано SmartEstate",
    "Cleaned and edited by SmartEstate"
  ),
  propertyPlatformTitle: tri(
    "SmartEstate վերլուծություն",
    "Аналитика SmartEstate",
    "SmartEstate insight"
  ),
  propertyPlatformFocus: tri(
    "Մենք չենք պատճենում գովազդային տեքստը — ցույց ենք տալիս իրական գինը և սեփականատիրոջը",
    "Мы не копируем рекламный текст — показываем реальную цену и собственника",
    "We don't copy ad copy — we surface the real price and the owner"
  ),
  propertyPlatformSummary: tri(
    "Մաքուր պրոֆիլ՝ իրական լուսանկարներով, թափանցիկ գնով և ուղիղ կապով վաճառողի հետ։",
    "Чистый профиль с реальными фото, прозрачной ценой и прямым контактом с продавцом.",
    "A clean profile with real photos, transparent pricing, and direct seller contact."
  ),
  propertyPlatformPoint1: tri(
    "Գտեք սեփականատիրոջ գինը միջնորդների միջից",
    "Найдите цену собственника среди посредников",
    "Find the owner's price among broker listings"
  ),
  propertyPlatformPoint2: tri(
    "Դիտեք գների փոփոխությունները ժամանակի ընթացքում",
    "Смотрите изменения цены во времени",
    "See how the price changed over time"
  ),
  propertyPlatformPoint3: tri(
    "Կապվեք ուղիղ սեփականատիրոջ հետ՝ անվճար",
    "Свяжитесь с собственником напрямую — бесплатно",
    "Contact the owner directly — for free"
  ),

  // ─── Маркетинг: риелторы (нативная платформа, Pro-инструменты) ──
  mktRealtorsEyebrow: tri("SmartEstate · Pro", "SmartEstate · Pro", "SmartEstate · Pro"),
  mktRealtorsHero: tri(
    "Մեկ մաքուր հարթակ՝ պրոֆեսիոնալ риելտորի համար",
    "Одна чистая платформа для профессионального риелтора",
    "One clean platform for the professional agent"
  ),
  mktRealtorsLead: tri(
    "SmartEstate-ը հայտարարությունների խառնաշփոթ չէ։ Մենք միավորում ենք շուկան մեկ հստակ լентայում՝ առանց կրկնօրինակների և ֆեյկերի։ Pro-բաժանորդները ստանում են նոր հայտարարությունների ազդանշաններ Telegram-ում՝ րոպեներ անց նրանց հրապարակումից։",
    "SmartEstate — не хаос объявлений. Мы собираем рынок в одну чёткую ленту без дубликатов и фейков. Pro-подписчики получают уведомления о новых объявлениях в Telegram — через минуты после публикации.",
    "SmartEstate is not listing chaos. We unite the market in one clear feed — no duplicates, no fakes. Pro subscribers get new-listing alerts in Telegram within minutes of publication."
  ),
  mktRealtorsAudienceTitle: tri("Ում համար է", "Для кого мы работаем", "Who we serve"),
  mktRealtorsForProTitle: tri("Pro ռիելտորներին", "Pro-риелторам", "Pro agents"),
  mktRealtorsForProLead: tri(
    "Գործիքներ, որոնք տալիս են առավելություն՝ ավելի արագ գտնել, ավելի ճիշտ գնահատել և ավելի վստահելի աշխատել հաճախորդների հետ։",
    "Инструменты, которые дают преимущество: находить быстрее, оценивать точнее и увереннее работать с клиентами.",
    "Tools that give you an edge: find faster, price smarter, and serve clients with confidence."
  ),
  mktRealtorsForOwnersTitle: tri("Սեփականատերերին", "Собственникам", "Property owners"),
  mktRealtorsForOwnersLead: tri(
    "Հրապարակում են մեկ հստակ պրոֆիլ՝ առանց կրկնօրինակների։ Pro-ռիելտորները տեսնում են նոր հայտարարությունը առաջինը։",
    "Публикуют один чёткий профиль без дублей. Pro-риелторы видят новое объявление первыми.",
    "They publish one clear profile with no duplicates. Pro agents see new listings first."
  ),
  mktRealtorsForBuyersTitle: tri("Գնորդներին", "Покупателям", "Buyers"),
  mktRealtorsForBuyersLead: tri(
    "Անվճար որոնում, իրական լուսանկարներ, գների պատմություն և մաքուր տվյալներ՝ առանց քաոսի։",
    "Бесплатный поиск, реальные фото, история цен и чистые данные — без хаоса.",
    "Free search, real photos, price history, and clean data — without the chaos."
  ),
  mktRealtorsToolsTitle: tri("Pro գործիքներ", "Инструменты Pro", "Pro tools"),
  mktRealtorsToolsSubtitle: tri(
    "Ամեն ինչ, ինչը ձեզ անհրաժեշտ է մեկ վայրում",
    "Всё необходимое — в одном месте",
    "Everything you need — in one place"
  ),
  mktRealtorsTool1Title: tri("Ակնթարթային ազդանշաններ", "Мгновенные алерты", "Instant alerts"),
  mktRealtorsTool1: tri(
    "Նոր հայտարարությունը հրապարակվում է SmartEstate-ում — Pro-ռիելտորը ստանում է Telegram-ազդանշան րոպեներ անց։ Դուք առաջինն եք, ով կարող է զանգել։",
    "Новое объявление публикуется на SmartEstate — Pro-риелтор получает алерт в Telegram через минуты. Вы первый, кто может позвонить.",
    "A new listing goes live on SmartEstate — the Pro agent gets a Telegram alert within minutes. You're first to call."
  ),
  mktRealtorsTool2Title: tri("Խելացի որոնում", "Умный поиск", "Smart search"),
  mktRealtorsTool2: tri(
    "Գրեք բնական լեզվով՝ «3 սենյական Կենտրոնում, արժեքը ցածր շուկայից»։ AI-ը հասկանում է, զտում է և դասավորում արդյունքները։",
    "Пишите на естественном языке: «3-комнатная в Центре, ниже рынка». AI понимает, фильтрует и сортирует результаты.",
    "Write in plain language: «3-room in Center, below market». AI understands, filters, and ranks results."
  ),
  mktRealtorsTool3Title: tri("Գների պատմություն", "История цен", "Price history"),
  mktRealtorsTool3: tri(
    "Տեսեք, թե երբ և ինչքան փոխվել է գինը՝ նախօրոք զանգից։ Պատրաստ եղեք բանակցությանը և ցույց տվեք հաճախորդին թափանցիկություն։",
    "Видите, когда и насколько менялась цена — до звонка. Готовьтесь к торгу и показывайте клиенту прозрачность.",
    "See when and how much the price changed — before you call. Negotiate prepared and show clients transparency."
  ),
  mktRealtorsTool4Title: tri("Մաքուր լենտա", "Чистая лента", "Clean feed"),
  mktRealtorsTool4: tri(
    "Մեկ օբյեկտ — մեկ քարտ։ Առանց կրկնօրինակների, առանց ֆեյկ լուսանկարների, առանց խառնաշփոթի։ Միայն վավերացված հայտարարություններ։",
    "Один объект — одна карточка. Без дублей, без фейковых фото, без хаоса. Только проверенные объявления.",
    "One property — one card. No duplicates, no fake photos, no chaos. Only verified listings."
  ),
  mktRealtorsTool5Title: tri("Սեփականատեր vs միջնորդ", "Собственник vs посредник", "Owner vs intermediary"),
  mktRealtorsTool5: tri(
    "Անմիջապես տեսնում եք՝ հայտարարությունը սեփականատիրոջն է, թե միջնորդի։ Գործեք արագ և ճիշտ թիրախով։",
    "Сразу видно: объявление от собственника или посредника. Действуйте быстро и по правильной цели.",
    "See at once whether the listing is from an owner or intermediary. Act fast on the right target."
  ),
  mktRealtorsTool6Title: tri("Պրոֆեսիոնալ ներկայացում", "Профессиональная подача", "Professional presentation"),
  mktRealtorsTool6: tri(
    "Ցույց տվեք հաճախորդին մաքուր քարտեր, գրաֆիկներ և վերլուծություն — դուք եք պրոֆեսիոնալը, ոչ թե Excel-ի սքրինշոթները։",
    "Показывайте клиенту чистые карточки, графики и аналитику — вы профессионал, а не скриншоты из Excel.",
    "Show clients clean cards, charts, and analytics — you're the professional, not Excel screenshots."
  ),
  mktProTitle: tri("SmartEstate Pro", "SmartEstate Pro", "SmartEstate Pro"),
  mktProPrice: tri("9 000 ֏ / ամիս", "9 000 ֏ / месяц", "9,000 ֏ / month"),
  mktProPriceNote: tri(
    "Ամբողջական մուտք բոլոր Pro գործիքներին",
    "Полный доступ ко всем инструментам Pro",
    "Full access to all Pro tools"
  ),
  mktProSectionEyebrow: tri("Բաժանորդագրություն", "Подписка", "Subscription"),
  mktProSectionTitle: tri(
    "Բացեք Pro և աշխատեք առաջինը",
    "Подключите Pro и работайте первым",
    "Unlock Pro and work first"
  ),
  mktProSectionLead: tri(
    "Pro-բաժանորդագրությունը տալիս է ամբողջական հասանելիություն գործիքներին, որոնք ստեղծված են հենց риելտորների համար։ Մեկ ամսական վճար — առանց թաքնված պայմանների։",
    "Подписка Pro даёт полный доступ к инструментам, созданным именно для риелторов. Одна месячная оплата — без скрытых условий.",
    "Pro subscription gives full access to tools built for agents. One monthly fee — no hidden terms."
  ),
  mktProFeat1: tri(
    "Telegram-ազդանշաններ նոր հայտարարությունների մասին րոպեներ անց հրապարակումից",
    "Telegram-алерты о новых объявлениях через минуты после публикации",
    "Telegram alerts on new listings within minutes of going live"
  ),
  mktProFeat2: tri(
    "Խելացի որոնում բնական լեզվով + զտումներ ամբողջ Հայաստանով",
    "Умный поиск на естественном языке + фильтры по всей Армении",
    "Natural-language smart search + filters across all Armenia"
  ),
  mktProFeat3: tri(
    "Գների պատմություն և վերլուծություն յուրաքանչյուր օբյեկտի համար",
    "История цен и аналитика по каждому объекту",
    "Price history and analytics for every property"
  ),
  mktProFeat4: tri(
    "Մաքուր լենտա առանց կրկնօրինակների և ֆեյկերի",
    "Чистая лента без дубликатов и фейков",
    "Clean feed with no duplicates or fakes"
  ),
  mktProFeat5: tri(
    "Սեփականատիրոջ / միջնորդի նշում յուրաքանչյուր քարտում",
    "Метка «собственник / посредник» на каждой карточке",
    "Owner vs intermediary badge on every card"
  ),
  mktProFeat6: tri(
    "Պահպանված որոնումներ և զտված ազդանշաններ (շուտով)",
    "Сохранённые поиски и точечные алерты (скоро)",
    "Saved searches and targeted alerts (coming soon)"
  ),
  mktProFeat7: tri(
    "Առաջնահերթ աջակցություն Pro բաժանորդներին",
    "Приоритетная поддержка для Pro-подписчиков",
    "Priority support for Pro subscribers"
  ),
  mktProFeat8: tri(
    "Մուտք Telegram-բոտից 24/7",
    "Доступ через Telegram-бот 24/7",
    "24/7 access via Telegram bot"
  ),
  mktProCta: tri("Բաժանորդագրվել Pro-ին", "Подписаться на Pro", "Subscribe to Pro"),
  mktProTelegram: tri("Բացել Telegram բոտը", "Открыть Telegram-бот", "Open Telegram bot"),
  mktRealtorsBuyersLink: tri("Ինչ է ստանում գնորդը →", "Что получает покупатель →", "What buyers get →"),
  mktRealtorsPostLink: tri("Հրապարակել հայտարարություն →", "Опубликовать объявление →", "Post a listing →"),
  mktRealtorsFlagshipTitle: tri("Pro գործիքներ", "Инструменты Pro", "Pro tools"),
  mktRealtorsFlagshipLead: tri(
    "Երեք հզոր գործիք, որոնց համար արժե Pro-բաժանորդագրությունը։ Մուտք գործեք Pro սենյակ՝ մանրամասների համար։",
    "Три мощных инструмента, ради которых стоит Pro-подписка. Зайдите в Pro-комнату за подробностями.",
    "Three power tools worth the Pro subscription. Enter the Pro room for details."
  ),

  // ─── Pro Room (комната риелтора) ─────────────────────────
  navPro: tri("Pro", "Pro", "Pro"),
  proRoomEyebrow: tri("SmartEstate · Pro Command Center", "SmartEstate · Pro Command Center", "SmartEstate · Pro Command Center"),
  proRoomHero: tri("Pro սենյակ риելտորի համար", "Pro-комната для риелтора", "Pro room for agents"),
  proRoomLead: tri(
    "Բոլոր գործիքները, որոնց համար ստեղծվել է Pro-բաժանորդագրությունը։ Արագություն, վերլուծություն, պաշտպանություն — մեկ տեղում։",
    "Все инструменты, ради которых создана Pro-подписка. Скорость, аналитика, защита — в одном месте.",
    "Every tool Pro was built for. Speed, analytics, protection — in one place."
  ),
  proRoomStatSec: tri("վրկ", "сек", "sec"),
  proRoomStatHour: tri("ժ", "ч", "h"),
  proRoomStat1: tri("Telegram ազդանշան", "Telegram-алерт", "Telegram alert"),
  proRoomStat2: tri("կրկնօրինակներ զտված", "дублей отсечено", "duplicates filtered"),
  proRoomStat3: tri("առաջնություն մրցակիցներից", "форы над конкурентами", "head start on rivals"),
  proRoomExplore: tri("Դիտել գործիքները", "Смотреть инструменты", "Explore tools"),
  proRoomEnter: tri("Մուտք Pro սենյակ", "Войти в Pro-комнату", "Enter Pro room"),
  proRoomLearnMore: tri("Մանրամասն", "Подробнее", "Learn more"),
  proRoomToolsEyebrow: tri("ԳԼԽԱՎՈՐ ԳՈՐԾԻՔՆԵՐ", "ГЛАВНЫЕ ИНСТРУМЕНТЫ", "FLAGSHIP TOOLS"),
  proRoomToolsTitle: tri("Ձեր մրցավարային առավելությունը", "Ваше конкурентное преимущество", "Your competitive edge"),
  proRoomToolsLead: tri(
    "Յուրաքանչյուր գործիք լուծում է կոնկրետ риելտորի խնդիր՝ փող աշխատելու և գործարքներ փակելու համար։",
    "Каждый инструмент решает конкретную задачу риелтора — зарабатывать и закрывать сделки.",
    "Each tool solves a specific agent problem — earn and close deals."
  ),
  proRoomSubscribeTitle: tri("Բացեք բոլոր գործիքները", "Откройте все инструменты", "Unlock all tools"),
  proRoomSubscribeLead: tri(
    "Pro-բաժանորդագրությունը տալիս է ամբողջական մուտք «Ոսկե Լիդ», «Արգումենտ Վաճառքի» և «Ռադար Պարազիտների» գործիքներին։",
    "Подписка Pro даёт полный доступ к «Золотому Лиду», «Аргументу Торга» и «Радару Паразитов».",
    "Pro subscription unlocks Golden Lead, Bargain Argument, and Parasite Radar."
  ),
  proRoomBackRealtors: tri("Վերադառնալ риելտորների էջ", "Назад к странице риелторов", "Back to realtors page"),
  proRoomBannerEyebrow: tri("EXCLUSIVE · PRO ONLY", "EXCLUSIVE · PRO ONLY", "EXCLUSIVE · PRO ONLY"),
  proRoomBannerTitle: tri("Մուտք Pro սենյակ", "Войдите в Pro-комнату", "Enter the Pro room"),
  proRoomBannerLead: tri(
    "Երեք հզոր գործիք՝ ազդանշաններ, PDF-վերլուծություն և պարազիտների ռադար։",
    "Три мощных инструмента: алерты, PDF-аналитика и радар паразитов.",
    "Three power tools: alerts, PDF analytics, and parasite radar."
  ),
  proTool1Badge: tri("Արագություն + Զտում", "Скорость + Фильтрация", "Speed + Filtering"),
  proTool1Title: tri("Ինտելեկտուալ դարպաս «Ոսկե Լիդ»", "Интеллектуальный шлюз «Золотой Лид»", "Intelligent gateway «Golden Lead»"),
  proTool1Short: tri(
    "Push 5 վրկ-ում — իրական սեփականատեր, մաքուր օբյեկտ, գինը շուկայից ցածր",
    "Push за 5 сек — реальный собственник, чистый объект, цена ниже рынка",
    "Push in 5 sec — real owner, clean listing, below-market price"
  ),
  proTool1Inside: tri(
    "Կտրողական պարսեր՝ միավորված սքորինգային նեյրոյի հետ։ Համակարգը անընդհատ սկանավորում է հարթակները, ավտոմատ կերպով հեռացնում 99% риելտորական կրկնօրինակները և ստուգում հեղինակների հեռախոսահամարները պատմական բազայի դեմ։",
    "Потоковый парсер, объединённый со скоринговой нейросетью. Система непрерывно сканирует площадки, автоматически отсекает 99% риелторских дубликатов и проверяет номера авторов по исторической базе.",
    "Streaming parser fused with a scoring neural net. The system continuously scans platforms, filters 99% of broker duplicates, and verifies author phones against a historical database."
  ),
  proTool1Why: tri(
    "Ռիելտորը ստանում է push Telegram-ում 5 վրկ անց իրական սեփականատիրոջ հրապարակումից։ 1 ժամ առաջություն՝ զանգահարել առաջինը և փակել գործարքը մրցակիցներից առաջ։",
    "Риелтор получает push в Telegram через 5 секунд после публикации реального собственника. Фора в 1 час — позвонить первым и закрыть сделку до конкурентов.",
    "The agent gets a Telegram push 5 seconds after a real owner publishes. A 1-hour head start to call first and close before competitors."
  ),
  proTool2Badge: tri("Անալիտիկա + PDF", "Аналитика + PDF", "Analytics + PDF"),
  proTool2Title: tri("Հաշվետվությունների գեներատոր «Արգումենտ Վաճառքի»", "Генератор отчётов «Аргумент Торга»", "Report generator «Bargain Argument»"),
  proTool2Short: tri(
    "Բրենդավորված PDF՝ գների գրաֆիկ, միջին վաճառքի ժամկետ, риելտորական նախավճարներ",
    "Брендированный PDF: график цен, средний срок продажи, риелторские накрутки",
    "Branded PDF: price chart, avg time to sell, broker markups"
  ),
  proTool2Inside: tri(
    "Անալիտիկական հաշվիչ՝ կապված մեր փակ գների արխիվի հետ։ Риелторը մուտքագրում է պարամետրերը, ալգորիթմը ակնթարթորեն ստեղծում է PDF-հաշվետվություն՝ իրական գնի անկման գրաֆիկ, միջին վաճառքի ժամկետ և риելտորական նախավճարների ծավալ։",
    "Аналитический калькулятор, привязанный к закрытому архиву цен. Риелтор вводит параметры — алгоритм мгновенно формирует PDF: график падения цен, средний срок продажи аналогов и объём риелторских накруток.",
    "Analytics calculator tied to our closed price archive. The agent enters parameters — the algorithm instantly builds a PDF: price-drop chart, average time to sell, and broker markup volume."
  ),
  proTool2Why: tri(
    "Գործիք «պայմանավորված» սեփականատերերի հետ — մաթեմատիկական փաստարկներով, ոչ թե բառերով։ Ստիպում եք գինը շուկային, ապացուցում կոմպետենտություն և ստորագրում էքսկլյուզիվ։",
    "Инструмент для «приземления» собственников — с математикой, а не словами. Сбиваете цену до рыночной, доказываете компетентность и подписываете эксклюзив.",
    "Tool to ground overpriced owners — with math, not words. Bring price to market, prove expertise, and sign exclusives."
  ),
  proTool3Badge: tri("Պաշտպանություն", "Защита", "Protection"),
  proTool3Title: tri("Ավտոմատ տրեկեր «Ռադար Պարազիտների»", "Автоматический трекер «Радар Паразитов»", "Auto tracker «Parasite Radar»"),
  proTool3Short: tri(
    "Մոնիտորինգ գողացված լուսանկարների — ալերտ Telegram-ում + հղում ֆեյկին",
    "Мониторинг украденных фото — алерт в Telegram + ссылка на фейк",
    "Stolen-photo monitoring — Telegram alert + link to fake"
  ),
  proTool3Inside: tri(
    "Նեյրոյի սկաներ լիստինգների եզակայության համար։ Риелторը բեռնում է իր էքսկլյուզիվի հղումը, ալգորիթմը պիքսելների երկրաչափությամբ անընդհատ մոնիտորինգ է անում ցանցը։",
    "Нейросетевой сканер уникальности листингов. Риелтор загружает ссылку на эксклюзив — алгоритм по геометрии пикселей непрерывно мониторит сеть.",
    "Neural listing-uniqueness scanner. The agent uploads their exclusive link — the algorithm monitors the network by pixel geometry."
  ),
  proTool3Why: tri(
    "Հայաստանում риելտորները գողանում են լուսանկարները և ցույց են տալիս նույն օբյեկտը ավելի էժան։ «Ռադարը» ալերտ է ուղարկում + հղում ֆեյկին և հեռախոս — ձեր հանձնաժողովը պաշտպանված է։",
    "В Армении риелторы воруют фото и выставляют тот же объект дешевле. «Радар» шлёт алерт + ссылку на фейк и номер — ваша комиссия защищена.",
    "In Armenia agents steal photos and list the same property cheaper. Radar alerts you with a link to the fake and the phone — your commission is protected."
  ),

  // Legacy keys (не используются на новой странице риелторов)
  mktRealtorsWhyTitle: tri("Ինչու դա հզոր գործիք է", "Почему это сильный инструмент", "Why this is a power tool"),
  mktRealtorsPain1Title: tri("", "", ""),
  mktRealtorsPain1: tri("", "", ""),
  mktRealtorsPain2Title: tri("", "", ""),
  mktRealtorsPain2: tri("", "", ""),
  mktRealtorsPain3Title: tri("", "", ""),
  mktRealtorsPain3: tri("", "", ""),
  mktRealtorsPain4Title: tri("", "", ""),
  mktRealtorsPain4: tri("", "", ""),
  mktRealtorsPain5Title: tri("", "", ""),
  mktRealtorsPain5: tri("", "", ""),
  mktRealtorsPain6Title: tri("", "", ""),
  mktRealtorsPain6: tri("", "", ""),
  mktOwnersAccessTitle: tri("", "", ""),
  mktOwnersAccessPrice: tri("", "", ""),
  mktOwnersAccessDesc: tri("", "", ""),
  mktOwnersAccessCta: tri("", "", ""),

  // ─── Маркетинг: покупатели ───────────────────────────────
  mktBuyersEyebrow: tri("SmartEstate · Գնորդներ", "SmartEstate · Покупатели", "SmartEstate · Buyers"),
  mktBuyersHero: tri(
    "Մաքուր շուկա՝ առանց կրկնօրինակների և ֆեյկերի",
    "Чистый рынок — без дублей и фейков",
    "A clean market — no duplicates, no fakes"
  ),
  mktBuyersLead: tri(
    "SmartEstate-ը միավորում է բոլոր հայտարարությունները մեկ հստակ լենտայում։ Դուք տեսնում եք իրական գինը, լուսանկարները և պատմությունը՝ ամբողջությամբ անվճար։",
    "SmartEstate объединяет все объявления в одну чёткую ленту. Вы видите реальную цену, фото и историю — полностью бесплатно.",
    "SmartEstate unites all listings in one clear feed. You see the real price, photos, and history — completely free."
  ),
  mktFlowTitle: tri("Ինչպես է աշխատում համակարգը", "Как работает система", "How the system works"),
  mktFlow1: tri("Հրապարակում", "Публикация", "Publication"),
  mktFlow1d: tri(
    "Սեփականատերը կամ ռիելտորը հրապարակում է SmartEstate-ում՝ իրական լուսանկարներով։",
    "Собственник или риелтор публикует на SmartEstate с реальными фотографиями.",
    "Owner or agent publishes on SmartEstate with real photos."
  ),
  mktFlow2: tri("Ստուգում", "Проверка", "Verification"),
  mktFlow2d: tri(
    "Համակարգը ստուգում է տվյալները, հեռացնում կրկնօրինակները և ֆեյկերը։",
    "Система проверяет данные, убирает дубликаты и фейки.",
    "The system verifies data, removes duplicates and fakes."
  ),
  mktFlow3: tri("Մեկ քարտ", "Одна карточка", "One card"),
  mktFlow3d: tri(
    "Մեկ օբյեկտ — մեկ պրոֆիլ։ Առանց խառնաշփոթի և կրկնօրինակների։",
    "Один объект — один профиль. Без хаоса и повторов.",
    "One property — one profile. No chaos or repeats."
  ),
  mktFlow4: tri("Թափանցիկություն", "Прозрачность", "Transparency"),
  mktFlow4d: tri(
    "Գների պատմություն, իրական լուսանկարներ և սեփականատիրոջ նշում։",
    "История цен, реальные фото и метка собственника.",
    "Price history, real photos, and owner badge."
  ),
  mktFlow5: tri("Դուք ընտրում եք", "Вы выбираете", "You choose"),
  mktFlow5d: tri(
    "Գտեք իդեալական տարբերակը և կապվեք ուղղակիորեն՝ առանց թաքնված վճարների։",
    "Найдите идеальный вариант и свяжитесь напрямую — без скрытых платежей.",
    "Find the perfect match and connect directly — no hidden fees."
  ),
  mktBuyersSystemTitle: tri("Ինչու SmartEstate-ը տարբերվում է", "Почему SmartEstate другой", "Why SmartEstate is different"),
  mktBuyersBenefit1Title: tri("Մաքուր լենտա", "Чистая лента", "Clean feed"),
  mktBuyersBenefit1: tri("Մեկ օբյեկտ — մեկ քարտ։ Առանց 10 կրկնօրինակների տարբեր գներով։", "Один объект — одна карточка. Без 10 дублей с разными ценами.", "One property — one card. No 10 duplicates at different prices."),
  mktBuyersBenefit2Title: tri("Իրական լուսանկարներ", "Реальные фото", "Real photos"),
  mktBuyersBenefit2: tri("Միայն ստուգված լուսանկարներ։ Ոչ մի ֆեյկ և ոչ մի պլեյսհոլդեր։", "Only verified photos. No fakes, no placeholders.", "Only verified photos. No fakes, no placeholders."),
  mktBuyersBenefit3Title: tri("Գների պատմություն", "История цен", "Price history"),
  mktBuyersBenefit3: tri("Տեսեք, թե ինչպես է փոխվել գինը ժամանակի ընթացքում։", "See how the price changed over time.", "See how the price changed over time."),
  mktBuyersBenefit4Title: tri("Խելացի որոնում", "Умный поиск", "Smart search"),
  mktBuyersBenefit4: tri("Գրեք բնական լեզվով՝ «3 սենյական Կենտրոնում» — AI-ը հասկանում է։", "Write naturally: «3-room in Center» — AI understands.", "Write naturally: «3-room in Center» — AI understands."),
  mktBuyersBenefit5Title: tri("Ամբողջ Հայաստան", "Вся Армения", "All Armenia"),
  mktBuyersBenefit5: tri("Երևան և բոլոր մարզերը՝ մեկ որոնման մեջ։", "Yerevan and all regions in one search.", "Yerevan and all regions in one search."),
  mktBuyersBenefit6Title: tri("100% անվճար", "100% бесплатно", "100% free"),
  mktBuyersBenefit6: tri("Որոնում, ֆիլտրեր, լուսանկարներ, պատմություն — ամեն ինչ անվճար։", "Search, filters, photos, history — everything free.", "Search, filters, photos, history — everything free."),
  mktBuyersSellerTitle: tri("Ինչու գնել մեր վաճառողներից", "Почему выгодно покупать у наших продавцов", "Why buy from our sellers"),
  mktBuyersSellerLead: tri(
    "SmartEstate-ում հրապարակում են միայն ստուգված վաճառողներ՝ իրական լուսանկարներով և թափանցիկ գներով։",
    "На SmartEstate публикуют только проверенные продавцы с реальными фото и прозрачными ценами.",
    "Only verified sellers publish on SmartEstate — with real photos and transparent prices."
  ),
  mktBuyersSeller1: tri("Ուղիղ կապ վաճառողի հետ — առանց 10 միջնորդների", "Прямой контакт с продавцом — без 10 посредников", "Direct contact with seller — no 10 intermediaries"),
  mktBuyersSeller2: tri("Գինը հստակ է և տեսանելի է պատմության մեջ", "Цена чёткая и видна в истории", "Price is clear and visible in history"),
  mktBuyersSeller3: tri("Լուսանկարները 100% իրական են", "Фотографии на 100% реальные", "Photos are 100% real"),
  mktBuyersSeller4: tri("Չկան կրկնօրինակներ և կեղծ հայտարարություններ", "Нет дублей и фейковых объявлений", "No duplicates or fake listings"),
  mktBuyersFreeBanner: tri("Ամեն ինչ անվճար է", "Всё бесплатно", "Everything is free"),
  mktBuyersFreeDesc: tri(
    "Որոնում, ֆիլտրեր, լուսանկարներ, գների պատմություն — առանց բաժանորդագրության և թաքնված վճարների։",
    "Поиск, фильтры, фото, история цен — без подписки и скрытых платежей.",
    "Search, filters, photos, price history — no subscription, no hidden fees."
  ),
  mktBuyersCta: tri("Սկսել որոնում", "Начать поиск", "Start search"),
  postVeloTools: tri(
    "VeloTools — անվճար սեղմել լուսանկարները",
    "VeloTools — бесплатно сжать фото",
    "VeloTools — compress photos for free"
  ),
  postStep1: tri("Տեսակ", "Тип", "Type"),
  postStep2: tri("Տեղադրություն", "Локация", "Location"),
  postStep3: tri("Նկարներ", "Фото", "Photos"),
  postStep4: tri("Կապ", "Контакт", "Contact"),
  postNext: tri("Հաջորդ →", "Далее →", "Next →"),
  postBack: tri("← Նախորդ", "← Назад", "← Back"),
  postDistrictPlaceholder: tri("Ընտրեք շրջանը", "Выберите район", "Select district"),
  postStreetPlaceholder: tri("Օր.՝ Աբովյան 12", "Напр. ул. Абовяна 12", "e.g. Abovyan 12"),
  postTitlePlaceholder: tri("3 սենյական բնակարան, Կենտրոն", "3-комн. квартира, Центр", "3-room apartment, Center"),
  postDescriptionPlaceholder: tri(
    "Նկարագրեք օբյեկտը, վիճակը, հարմարավետությունները…",
    "Опишите объект, состояние, преимущества…",
    "Describe the property, condition, advantages…"
  ),
  postLocationHint: tri("Նշեք ճշգրիտ տեղադրությունը — գնորդները գտնում են ավելի արագ", "Укажите точную локацию — покупатели находят быстрее", "Pin the exact location — buyers find you faster"),
  postPhotosStepHint: tri("Ավելացրեք իրական լուսանկարներ — առանց դրանց հայտարարությունը չի հրապարակվի", "Добавьте реальные фото — без них объявление не публикуется", "Add real photos — listing won't publish without them"),
  postPhotosAdd: tri("Ավելացնել", "Добавить", "Add"),
  postPhotosDrop: tri("Կամ քաշեք ֆայլերը այստեղ", "Или перетащите файлы сюда", "Or drag files here"),
  postUploading: tri("Բեռնվում է…", "Загрузка…", "Uploading…"),
  postContactHint: tri("Կապի տվյալները տեսանելի են միայն հաստատված գնորդներին", "Контакт виден проверенным покупателям", "Contact is visible to verified buyers"),
  postContactNamePlaceholder: tri("Ձեր անունը", "Ваше имя", "Your name"),
  postPreview: tri("Նախադիտում", "Предпросмотр", "Preview"),

  // ─── Платежи ─────────────────────────────────────────────
  payUnlockTitle: tri("Բացել սեփականատիրոջ համարը", "Открыть номер собственника", "Unlock owner phone"),
  payUnlockAmount: tri("4 000 ֏", "4 000 ֏", "4,000 ֏"),
  payUnlockWhy: tri(
    "Դուք ստանում եք արդեն մաքուր տվյալ՝ սեփականատիրոջ ուղիղ համարը՝ առանց ֆեյկերի ու սպեկուլյացիայի։",
    "Вы получаете уже чистые данные — прямой номер собственника, без фейков и спекуляций.",
    "You get clean data — the owner's direct number, with no fakes or speculation."
  ),
  payUnlockBtn: tri("Վճարել և բացել", "Оплатить и открыть", "Pay and unlock"),
  payUnlockDemo: tri("Demo (մշակում)", "Demo (разработка)", "Demo (dev)"),
  payUnlockSuccess: tri("Համարը բացված է", "Номер открыт", "Number unlocked"),
  payUnlockIdram: tri("Idram — շուտով", "Idram — скоро", "Idram — coming soon"),
  payUnlockLoading: tri("Մշակվում է…", "Обработка…", "Processing…"),
  payUnlockError: tri("Վճարման սխալ", "Ошибка оплаты", "Payment error"),
  payNoPhone: tri(
    "Այս օբյեկտի հեռախոսահամարը դեռ հասանելի չէ։ Այն կհայտնվի տվյալների հավաքումից հետո։",
    "Номер по этому объекту пока недоступен. Он появится после сбора данных.",
    "The phone for this property isn't available yet. It will appear after data collection."
  ),
  payProSuccess: tri("Pro ակտիվացված է", "Pro активирован", "Pro activated"),
  payProPending: tri("Սպասում ենք Idram հաստատման", "Ожидаем подтверждение Idram", "Awaiting Idram confirmation"),
  payProBtn: tri("Բաժանորդագրվել Pro-ին", "Подписаться на Pro", "Subscribe to Pro"),
  payProHint: tri(
    "Ամբողջական մուտք բոլոր Pro գործիքներին՝ մեկ ամսով",
    "Полный доступ ко всем инструментам Pro на месяц",
    "Full access to all Pro tools for one month"
  ),

  currentPrice: tri("Ընթացիկ գին", "Текущая цена", "Current price"),
  galleryPrev: tri("Նախորդ", "Назад", "Previous"),
  galleryNext: tri("Հաջորդ", "Вперёд", "Next"),
  galleryClose: tri("Փակել", "Закрыть", "Close"),
  galleryEnlarge: tri("Մեծացնել", "Увеличить", "Enlarge"),
  galleryThumbs: tri("Լուսանկարներ", "Фотографии", "Photos"),
  favoriteAdd: tri("Ավելացնել ընտրյալներին", "Добавить в избранное", "Add to favorites"),
  favoriteRemove: tri("Հեռացնել ընտրյալներից", "Убрать из избранного", "Remove from favorites"),
  favoriteAuthTitle: tri(
    "Գրանցվեք՝ ընտրյալներին ավելացնելու համար",
    "Войдите, чтобы добавить в избранное",
    "Sign in to add to favorites"
  ),
  favoriteAuthBody: tri(
    "Ընտրյալներին ավելացնելու համար պետք է գրանցվել կամ մուտք գործել SmartEstate-ում։",
    "Для добавления в избранное нужно зарегистрироваться или войти в SmartEstate.",
    "You need to register or sign in to SmartEstate to save favorites."
  ),
  favoriteAuthLogin: tri("Մուտք Telegram-ով", "Войти через Telegram", "Sign in via Telegram"),
  favoriteAuthClose: tri("Փակել", "Закрыть", "Close"),
  photosLabel: tri("լուսանկար", "фото", "photos"),

  // ─── Карточка объекта ────────────────────────────────────
  verifiedOwner: tri("Սեփականատեր", "Собственник", "Owner"),
  verifiedBadge: tri("Սեփականատեր", "Собственник", "Owner"),
  ownerListingHint: tri(
    "Գտնվել է սեփականատիրոջ հայտարարություն",
    "Найдено объявление собственника",
    "Owner listing found"
  ),
  duplicatesRemoved: tri("կրկնօրինակ հեռացված", "дублей убрано", "duplicates removed"),
  perMonth: tri("/ամիս", "/мес", "/mo"),
  perSqm: tri("/մ²", "/м²", "/m²"),
  ownerPrice: tri("Սեփականատիրոջ գին", "Цена собственника", "Owner price"),
  floor: tri("հարկ", "этаж", "floor"),
  area: tri("մ²", "м²", "m²"),

  // ─── Состояния ───────────────────────────────────────────
  loading: tri("Բեռնվում է…", "Загрузка…", "Loading…"),
  notFound: tri("Չի գտնվել", "Не найдено", "Not found"),
  notFoundHint: tri(
    "Փորձեք փոխել ֆիլտրերը",
    "Попробуйте изменить фильтры",
    "Try changing filters"
  ),
  relaxedNote: tri(
    "Ճշգրիտ համընկնումներ չկան — ցույց ենք տալիս ամենամոտ տարբերակները",
    "Точных совпадений нет — показываем ближайшие подходящие варианты",
    "No exact matches — showing the closest options"
  ),
  backToSearch: tri("← Վերադառնալ որոնման", "← Назад к поиску", "← Back to search"),

  // ─── Детальная страница ────────────────────────────────────
  priceHistory: tri("Գնի պատմություն", "История цены", "Price history"),
  priceHistoryDesc: tri(
    "Գների փոփոխությունները պահպանվում են՝ թափանցիկ բանակցությունների համար",
    "Изменения цен сохраняются — для прозрачных переговоров",
    "Price changes are preserved — for transparent negotiations"
  ),
  brokerAnalysis: tri("Առաջարկների համեմատություն", "Сравнение предложений", "Offer comparison"),
  brokerAnalysisDesc: tri(
    "Բոլոր գները այս օբյեկտի համար՝ մեկ տեղում, առանց անունների։",
    "Все цены по этому объекту в одном месте, без имён.",
    "All prices for this property in one place, without names."
  ),
  directContact: tri("Ուղիղ կապ սեփականատիրոջ հետ", "Прямой контакт собственника", "Direct owner contact"),
  directContactDesc: tri(
    "Հեռախոսահամարը հասանելի է անմիջապես՝ առանց վճարումների և թաքնված պայմանների։",
    "Телефон доступен сразу — без оплаты и скрытых условий.",
    "Phone is available instantly — no payment, no hidden fees."
  ),
  callOwner: tri("Զանգահարել", "Позвонить", "Call"),
  markup: tri("Գնահատակ", "Наценка", "Markup"),
  agency: tri("Գործակալություն", "Агентство", "Agency"),
  offerLabel: tri("Առաջարկ", "Предложение", "Offer"),
  noBrokerData: tri(
    "Միջնորդների մասին տվյալներ չկան",
    "Нет данных о посредниках",
    "No broker data available"
  ),
  noPriceHistory: tri(
    "Գնի պատմությունը կհայտնվի տվյալների հավաքումից հետո",
    "История цен появится после сбора данных",
    "Price history will appear after data collection"
  ),
  cleanedFrom: tri("մաքրված է", "очищено от", "cleaned from"),
  duplicatesWord: tri("կրկնօրինակներից", "дубликатов", "duplicates"),

  // ─── Футер ───────────────────────────────────────────────
  footer: tri(
    "SmartEstate Armenia — Ազնիվ անշարժ գույք առանց կրկնօրինակների",
    "SmartEstate Armenia — честная недвижимость без дубликатов",
    "SmartEstate Armenia — honest real estate without duplicates"
  ),

  // ─── Атрибуция источника и партнёрство с площадками ──────
  sourceOriginal: tri("Բնօրինակը", "Оригинал", "Original"),
  sourceViewOn: tri("Դիտել {site}-ում", "Смотреть на {site}", "View on {site}"),
  sourceLabel: tri("Աղբյուր", "Источник", "Source"),
  partnerTitle: tri(
    "Կրկնօրինակների (դուպլիկատների) միավորում",
    "Объединение дубликатов",
    "Merging duplicates"
  ),
  partnerBody: tri(
    "Միևնույն օբյեկտի վերաբերյալ տասնյակ կրկնվող հայտարարությունները վերածվում են մեկ հստակ պրոֆիլի։ Օգտատերը տեսնում է միայն մաքուր, վավերացված ինֆորմացիա՝ առանց քաոսի և կրկնությունների։",
    "Десятки повторяющихся объявлений об одном и том же объекте превращаются в один чёткий профиль. Пользователь видит только чистую, проверенную информацию — без хаоса и повторов.",
    "Dozens of repeated listings about the same property turn into a single clear profile. Users see only clean, verified information — without chaos and duplicates."
  ),

  navPost: tri("Ավելացնել", "Добавить", "Post"),
  feedEmptyTitle: tri(
    "Դեռ հայտարարություններ չկան",
    "Пока нет объявлений",
    "No listings yet"
  ),
  feedEmptyBody: tri(
    "SmartEstate-ը նոր, մաքուր հարթակ է։ Դուք կարող եք լինել առաջինը, ով կհրապարակի իր օբյեկտը՝ առանց կրկնօրինակների և ֆեյքերի։",
    "SmartEstate — новая чистая платформа. Станьте первым, кто опубликует объект — без дублей и фейков.",
    "SmartEstate is a new clean platform. Be the first to publish your property — no duplicates or fakes."
  ),
  feedEmptyCta: tri("Հրապարակել հայտարարություն →", "Опубликовать объявление →", "Post a listing →"),

  postTitle: tri("Հրապարակել հայտարարություն", "Опубликовать объявление", "Post a listing"),
  postSubtitle: tri(
    "Մաքուր հարթակ՝ առանց կրկնօրինակների։ Լրացրեք տվյալները և ավելացրեք իրական լուսանկարներ։",
    "Чистая платформа без дублей. Заполните данные и добавьте реальные фотографии.",
    "A clean platform without duplicates. Fill in the details and add real photos."
  ),
  postDealType: tri("Գործարքի տեսակ", "Тип сделки", "Deal type"),
  postPropertyType: tri("Տեսակ", "Тип недвижимости", "Property type"),
  postDistrict: tri("Շրջան / քաղաք", "Район / город", "District / city"),
  postStreet: tri("Փողոց, հասցե", "Улица, адрес", "Street, address"),
  postRooms: tri("Սենյակներ", "Комнаты", "Rooms"),
  postFloor: tri("Հարկ", "Этаж", "Floor"),
  postTotalFloors: tri("Հարկերի քանակ", "Этажей в доме", "Total floors"),
  postArea: tri("Մակերես, քմ", "Площадь, м²", "Area, m²"),
  postPrice: tri("Գին", "Цена", "Price"),
  postPriceAmd: tri("֏ AMD", "֏ AMD", "֏ AMD"),
  postPriceUsd: tri("$ USD", "$ USD", "$ USD"),
  postPriceEur: tri("€ EUR", "€ EUR", "€ EUR"),
  postPriceHintSale: tri("Օր.՝ 150 000 000", "Напр. 150 000 000", "e.g. 150,000,000"),
  postPriceHintRent: tri("Օր.՝ 350 000 / ամիս", "Напр. 350 000 / мес", "e.g. 350,000 / mo"),
  postPricePerMonth: tri("/ամիս", "/мес", "/mo"),
  postErrPrice: tri("Նշեք գինը", "Укажите цену", "Enter price"),
  postErrPriceInvalid: tri("Գինը սխալ է", "Некорректная цена", "Invalid price"),
  postErrRooms: tri("Նշեք սենյակների քանակը", "Укажите количество комнат", "Enter number of rooms"),
  postErrDistrict: tri("Ընտրեք շրջանը", "Выберите район", "Select district"),
  postErrTitle: tri("Վերնագիր՝ առնվազն 5 նիշ", "Заголовок — минимум 5 символов", "Title — at least 5 characters"),
  postErrDescription: tri("Նկարագրություն՝ առնվազն 20 նիշ", "Описание — минимум 20 символов", "Description — at least 20 characters"),
  postErrPhotos: tri("Ավելացրեք առնվազն 1 լուսանկար", "Добавьте минимум 1 фото", "Add at least 1 photo"),
  postErrContactName: tri("Նշեք անունը", "Укажите имя", "Enter your name"),
  postErrContactPhone: tri("Նշեք հեռախոսը", "Укажите телефон", "Enter phone number"),
  postErrContactEmail: tri("Նշեք email", "Укажите email", "Enter email"),
  postContactEmail: tri("Էլ. փոստ", "Email", "Email"),
  postHidePhone: tri(
    "Թաքցնել հեռախոսը — ցույց տալ միայն email",
    "Скрыть телефон — показывать только email",
    "Hide phone — show email only",
  ),
  sellerLoginPrompt: tri(
    "Մուտք գործեք՝ ձեր հայտարարությունները կառավարելու համար",
    "Войдите, чтобы управлять объявлениями",
    "Sign in to manage your listings",
  ),

  navAccount: tri("Իմ հաշիվը", "Мой кабинет", "My account"),
  sellerEyebrow: tri("ՎԱՃԱՌՈՂ", "ПРОДАВЕЦ", "SELLER"),
  sellerAuthTitle: tri("Հաշիվ վաճառողի", "Кабинет продавца", "Seller account"),
  sellerAuthLead: tri(
    "Գրանցվեք և կառավարեք ձեր հայտարարությունները, ընտրյալները",
    "Регистрация и управление объявлениями и избранным",
    "Register and manage your listings and favorites",
  ),
  sellerLogin: tri("Մուտք", "Войти", "Sign in"),
  sellerRegister: tri("Գրանցում", "Регистрация", "Register"),
  sellerPassword: tri("Գաղտնաբառ", "Пароль", "Password"),
  sellerCabinet: tri("Իմ հաշիվը", "Личный кабинет", "My cabinet"),
  sellerLogout: tri("Ելք", "Выйти", "Log out"),
  sellerMyListings: tri("Իմ հայտարարությունները", "Мои объявления", "My listings"),
  sellerFavorites: tri("Ընտրյալներ", "Избранное", "Favorites"),
  sellerProfile: tri("Պրոֆիլ", "Профиль", "Profile"),
  sellerLoading: tri("Բեռնվում է…", "Загрузка…", "Loading…"),
  sellerNoListings: tri("Դեռ հայտարարություն չկա", "Пока нет объявлений", "No listings yet"),
  sellerPostFirst: tri("Հրապարակել առաջինը", "Опубликовать первое", "Post your first"),
  sellerNoFavorites: tri("Ընտրյալներ չկան", "Нет избранного", "No favorites yet"),
  sellerError: tri("Սխալ", "Ошибка", "Error"),
  postTitleField: tri("Վերնագիր", "Заголовок", "Title"),
  postDescription: tri("Նկարագրություն", "Описание", "Description"),
  postPhotos: tri("Լուսանկարներ", "Фотографии", "Photos"),
  postPhotosHint: tri(
    "Ավելացրեք առնվազն 1 իրական լուսանկար (մինչև 10)",
    "Добавьте минимум 1 реальное фото (до 10)",
    "Add at least 1 real photo (up to 10)"
  ),
  postContactName: tri("Անուն", "Имя", "Name"),
  postContactPhone: tri("Հեռախոս", "Телефон", "Phone"),
  postSubmit: tri("Հրապարակել →", "Опубликовать →", "Publish →"),
  postSubmitting: tri("Հրապարակվում է…", "Публикуется…", "Publishing…"),
  postSuccess: tri("Հայտարարությունը հրապարակված է", "Объявление опубликовано", "Listing published"),
  postError: tri("Սխալ։ Ստուգեք տվյալները", "Ошибка. Проверьте данные", "Error. Check your input"),
  postTypeApartment: tri("Բնակարան", "Квартира", "Apartment"),
  postTypeHouse: tri("Տուն", "Дом", "House"),
  postTypeCommercial: tri("Կոմերցիոն", "Коммерческая", "Commercial"),
  postTypeLand: tri("Հողամաս", "Участок", "Land"),
  postSale: tri("Վաճառք", "Продажа", "Sale"),
  postRent: tri("Վարձակալություն", "Аренда", "Rent"),

  // ─── Локации (ключ → перевод для UI; значение API остаётся на русском) ──
  districts: {
    // Ереван
    Арабкир: tri("Արաբկիր", "Арабкир", "Arabkir"),
    Центр: tri("Կենտրոն", "Центр", "Center"),
    Аван: tri("Ավան", "Аван", "Avan"),
    "Нор Норк": tri("Նոր Նորք", "Нор Норк", "Nor Nork"),
    "Канакер-Зейтун": tri("Քանաքեռ-Զեյթուն", "Канакер-Зейтун", "Kanaker-Zeytun"),
    Аджапняк: tri("Աջափնյակ", "Аджапняк", "Ajapnyak"),
    Давидашен: tri("Դավթաշեն", "Давидашен", "Davtashen"),
    Еребуни: tri("Էրեբունի", "Еребуни", "Erebuni"),
    "Малатия-Себастия": tri("Մալաթիա-Սեբաստիա", "Малатия-Себастия", "Malatia-Sebastia"),
    Шенгавит: tri("Շենգավիթ", "Шенгавит", "Shengavit"),
    "Норк-Мараш": tri("Նորք-Մարաշ", "Норк-Мараш", "Nork-Marash"),
    Нубарашен: tri("Նուբարաշեն", "Нубарашен", "Nubarashen"),
    // Котайк
    Абовян: tri("Աբովյան", "Абовян", "Abovyan"),
    Раздан: tri("Հրազդան", "Раздан", "Hrazdan"),
    Цахкадзор: tri("Ծաղկաձոր", "Цахкадзор", "Tsaghkadzor"),
    Чаренцаван: tri("Չարենցավան", "Чаренцаван", "Charentsavan"),
    Егвард: tri("Եղվարդ", "Егвард", "Yeghvard"),
    // Ширак
    Гюмри: tri("Գյումրի", "Гюмри", "Gyumri"),
    Артик: tri("Արթիկ", "Артик", "Artik"),
    // Лори
    Ванадзор: tri("Վանաձոր", "Ванадзор", "Vanadzor"),
    Степанаван: tri("Ստեփանավան", "Степанаван", "Stepanavan"),
    Алаверди: tri("Ալավերդի", "Алаверди", "Alaverdi"),
    Спитак: tri("Սպիտակ", "Спитак", "Spitak"),
    // Тавуш
    Дилижан: tri("Դիլիջան", "Дилижан", "Dilijan"),
    Иджеван: tri("Իջևան", "Иджеван", "Ijevan"),
    Берд: tri("Բերդ", "Берд", "Berd"),
    Ноемберян: tri("Նոյեմբերյան", "Ноемберян", "Noyemberyan"),
    // Гегаркуник
    Севан: tri("Սևան", "Севан", "Sevan"),
    Гавар: tri("Գավառ", "Гавар", "Gavar"),
    Мартуни: tri("Մարտունի", "Мартуни", "Martuni"),
    Варденис: tri("Վարդենիս", "Варденис", "Vardenis"),
    // Армавир
    Армавир: tri("Արմավիր", "Армавир", "Armavir"),
    Эчмиадзин: tri("Էջմիածին", "Эчмиадзин", "Ejmiatsin"),
    Метсамор: tri("Մեծամոր", "Метсамор", "Metsamor"),
    // Арарат
    Арташат: tri("Արտաշատ", "Арташат", "Artashat"),
    Масис: tri("Մասիս", "Масис", "Masis"),
    Арарат: tri("Արարատ", "Арарат", "Ararat"),
    Веди: tri("Վեդի", "Веди", "Vedi"),
    // Арагацотн
    Аштарак: tri("Աշտարակ", "Аштарак", "Ashtarak"),
    Апаран: tri("Ապարան", "Апаран", "Aparan"),
    Талин: tri("Թալին", "Талин", "Talin"),
    // Вайоц Дзор
    Джермук: tri("Ջերմուկ", "Джермук", "Jermuk"),
    Ехегнадзор: tri("Եղեգնաձոր", "Ехегнадзор", "Yeghegnadzor"),
    Вайк: tri("Վայք", "Вайк", "Vayk"),
    // Сюник
    Капан: tri("Կապան", "Капан", "Kapan"),
    Горис: tri("Գորիս", "Горис", "Goris"),
    Сисиан: tri("Սիսիան", "Сисиан", "Sisian"),
    Мегри: tri("Մեղրի", "Мегри", "Meghri"),
    Каджаран: tri("Քաջարան", "Каджаран", "Kajaran"),
  } as Record<string, T>,
} as const;

export type ContentKey = Exclude<keyof typeof content, "districts">;

/** Группировка локаций для выпадающего списка (optgroup). */
export const LOCATION_GROUPS: { label: T; keys: string[] }[] = [
  {
    label: tri("Երևան", "Ереван", "Yerevan"),
    keys: [
      "Центр", "Арабкир", "Аван", "Нор Норк", "Канакер-Зейтун", "Аджапняк",
      "Давидашен", "Еребуни", "Малатия-Себастия", "Шенгавит", "Норк-Мараш", "Нубарашен",
    ],
  },
  { label: tri("Կոտայք", "Котайк", "Kotayk"), keys: ["Абовян", "Раздан", "Цахкадзор", "Чаренцаван", "Егвард"] },
  { label: tri("Շիրակ", "Ширак", "Shirak"), keys: ["Гюмри", "Артик"] },
  { label: tri("Լոռի", "Лори", "Lori"), keys: ["Ванадзор", "Степанаван", "Алаверди", "Спитак"] },
  { label: tri("Տավուշ", "Тавуш", "Tavush"), keys: ["Дилижан", "Иджеван", "Берд", "Ноемберян"] },
  { label: tri("Գեղարքունիք", "Гегаркуник", "Gegharkunik"), keys: ["Севан", "Гавар", "Мартуни", "Варденис"] },
  { label: tri("Արմավիր", "Армавир", "Armavir"), keys: ["Армавир", "Эчмиадзин", "Метсамор"] },
  { label: tri("Արարատ", "Арарат", "Ararat"), keys: ["Арташат", "Масис", "Арарат", "Веди"] },
  { label: tri("Արագածոտն", "Арагацотн", "Aragatsotn"), keys: ["Аштарак", "Апаран", "Талин"] },
  { label: tri("Վայոց Ձոր", "Вайоц Дзор", "Vayots Dzor"), keys: ["Джермук", "Ехегнадзор", "Вайк"] },
  { label: tri("Սյունիք", "Сюник", "Syunik"), keys: ["Капан", "Горис", "Сисиан", "Мегри", "Каджаран"] },
];
