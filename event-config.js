export const eventData = {
  title: "Dream Riders",
  dateLabel: "01·08·2026",
  startsAt: "2026-08-01T10:00:00+03:00",
  venue: "Парк Сказка",
  address: "Москва, ул. Крылатская, 18",
  price: 2900,
  regularPrice: 5500,
  sold: 0,
  total: 1000,
  ticketUrl: "https://price.parkskazka.com/",
  saleStatus: "open",
  allowedTrackingParams: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"],
};

export const formatRubles = (value) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
