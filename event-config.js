const primaryDate = {
  id: "2026-08-01",
  label: "1 августа 2026",
  compactLabel: "01·08·2026",
  startsAt: "2026-08-01T10:00:00+03:00",
  price: 2900,
  ticketUrl: "https://price.parkskazka.com/",
  saleStatus: "open",
};

export const eventData = {
  title: "Dream Riders",
  dateLabel: primaryDate.compactLabel,
  startsAt: primaryDate.startsAt,
  venue: "Парк Сказка",
  address: "Москва, ул. Крылатская, 18",
  price: primaryDate.price,
  regularPrice: 5500,
  sold: 0,
  total: 1000,
  ticketUrl: primaryDate.ticketUrl,
  saleStatus: primaryDate.saleStatus,
  dates: [primaryDate],
  defaultDateId: primaryDate.id,
  allowedTrackingParams: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"],
};

export const formatRubles = (value) => `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
