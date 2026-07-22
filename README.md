# Dream Riders landing

Статический лендинг для Dream Riders / «Дрим Райдерс» в Парке Сказка.

## Смысл страницы

Dream Riders — не отдельный билет на три аттракциона. Это билет в Парк Сказка, где главный акцент 1 августа — открытие новой экстрим-зоны с «Вихрем», «Бумерангом» и «Смерчем».

## Структура

- `index.html` - hero, scroll-маршрут, три аттракциона, FAQ, билет и structured data.
- `styles.css` - визуальная система, адаптив, signature-сцена и reduced-motion fallback.
- `script.js` - тема, poster-first video, reveal, счетчики и scroll-progress траектории.
- `assets/` - логотип, фото и видео.
- `tests/` - Playwright smoke- и accessibility-проверки.
- `robots.txt`, `sitemap.xml`, `lighthouse-budget.json` - SEO и performance-контур.

## Ассеты

- `assets/skazka-logo.png` - исходный логотип.
- `assets/skazka-logo-cropped.png` - обрезанная версия для шапки.
- `assets/hero-video-desktop.mp4`, `assets/hero-video-desktop.webm` - оптимизированное desktop-видео.
- `assets/hero-video-mobile.mp4`, `assets/hero-video-mobile.webm` - отдельное mobile-видео.
- `assets/hero-poster.webp`, `assets/hero-poster-mobile.webp` - быстрые LCP-постеры.
- `assets/hero-poster.jpg` - JPEG fallback.
- `assets/boomerang-wide.webp`, `assets/boomerang-loop.webp`, `assets/boomerang-track.webp` - фото «Бумеранга».
- `assets/smerch-close.webp`, `assets/smerch-wide.webp` - фото «Смерча».
- `assets/vortex-action.webp`, `assets/vortex-wide.webp` - фото «Вихря».
- `assets/og-dream-riders.jpg` - картинка для соцсетей.

## Локальная проверка

```bash
npm install
npm run check
npm run lighthouse
```

## Что подтвердить перед публикацией

- Канонический путь `/dream-riders/` на боевом сервере.
- Финальные цену, возрастные/ростовые ограничения и расписание открытия.
- Отдельный вход или маршрут к зоне, если он понадобится.
