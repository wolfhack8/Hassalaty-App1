import type { Localized } from "@/lib/localized";
import { loc } from "@/lib/localized";

export type MarketId = "sa" | "us";

export type Stock = {
  symbol: string;
  name: Localized;
  market: MarketId;
  /** Company domain, used to resolve a brand logo. */
  domain: string;
  sector: Localized;
  /** Last price in the market's native currency. */
  price: number;
  /** Day change, percent. */
  change: number;
  /** Market cap in billions of native currency. */
  marketCap: number;
  /** 52-week low / high. */
  low52: number;
  high52: number;
  peRatio: number;
  about: Localized;
  color: string;
  /** ~40-point recent price series for charts. */
  series: number[];
};

export type MarketMeta = {
  id: MarketId;
  label: Localized;
  index: Localized;
  currency: string;
  flag: string;
  indexValue: number;
  indexChange: number;
  series: number[];
};

/** Deterministic random-walk price series ending near `end`. */
function makeSeries(seed: number, end: number, volatility: number, points = 40): number[] {
  const out: number[] = [];
  let v = end * (1 - volatility * 0.6);
  for (let i = 0; i < points; i++) {
    const r = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const noise = (r - Math.floor(r) - 0.5) * 2; // [-1,1]
    const drift = (end - v) * 0.08;
    v = v + drift + noise * end * volatility * 0.12;
    out.push(Math.max(0.01, v));
  }
  out[points - 1] = end;
  return out;
}

const sa: Omit<Stock, "series">[] = [
  { symbol: "2222", name: loc("Saudi Aramco", "أرامكو السعودية"), market: "sa", domain: "aramco.com", sector: loc("Energy", "الطاقة"), price: 28.65, change: 0.82, marketCap: 6930, low52: 24.9, high52: 32.1, peRatio: 16.4, color: "#16a34a", about: loc("The world's largest integrated energy and chemicals company.", "أكبر شركة متكاملة للطاقة والكيماويات في العالم.") },
  { symbol: "1120", name: loc("Al Rajhi Bank", "مصرف الراجحي"), market: "sa", domain: "alrajhibank.com.sa", sector: loc("Banking", "المصارف"), price: 91.2, change: 1.42, marketCap: 365, low52: 68.4, high52: 96.7, peRatio: 18.1, color: "#2f6df0", about: loc("The world's largest Islamic bank by capital.", "أكبر بنك إسلامي في العالم من حيث رأس المال.") },
  { symbol: "7010", name: loc("stc", "إس تي سي"), market: "sa", domain: "stc.com.sa", sector: loc("Telecom", "الاتصالات"), price: 40.05, change: -0.64, marketCap: 200, low52: 36.2, high52: 47.8, peRatio: 15.7, color: "#a855f7", about: loc("The leading digital enabler and telecom operator in the region.", "الممكّن الرقمي ومشغّل الاتصالات الرائد في المنطقة.") },
  { symbol: "2010", name: loc("SABIC", "سابك"), market: "sa", domain: "sabic.com", sector: loc("Materials", "المواد الأساسية"), price: 79.8, change: 0.36, marketCap: 239, low52: 62.1, high52: 89.4, peRatio: 22.3, color: "#f59e0b", about: loc("A global leader in diversified chemicals manufacturing.", "شركة رائدة عالميًا في تصنيع الكيماويات المتنوعة.") },
  { symbol: "2082", name: loc("ACWA Power", "أكوا باور"), market: "sa", domain: "acwapower.com", sector: loc("Utilities", "المرافق"), price: 411.2, change: 2.14, marketCap: 301, low52: 288, high52: 468, peRatio: 41.2, color: "#ec4899", about: loc("A developer of power generation and desalination plants.", "مطوّر لمحطات توليد الكهرباء وتحلية المياه.") },
  { symbol: "1180", name: loc("Saudi National Bank", "البنك الأهلي السعودي"), market: "sa", domain: "alahli.com", sector: loc("Banking", "المصارف"), price: 36.9, change: 0.95, marketCap: 221, low52: 31.5, high52: 40.2, peRatio: 12.6, color: "#0ea5e9", about: loc("The largest bank in Saudi Arabia by assets.", "أكبر بنك في السعودية من حيث الأصول.") },
  { symbol: "1211", name: loc("Ma'aden", "معادن"), market: "sa", domain: "maaden.com.sa", sector: loc("Materials", "المواد الأساسية"), price: 54.3, change: 1.78, marketCap: 208, low52: 41.0, high52: 63.8, peRatio: 35.9, color: "#14b8a6", about: loc("The largest mining and metals company in the Middle East.", "أكبر شركة تعدين ومعادن في الشرق الأوسط.") },
  { symbol: "2280", name: loc("Almarai", "المراعي"), market: "sa", domain: "almarai.com", sector: loc("Consumer", "السلع الاستهلاكية"), price: 58.7, change: -0.32, marketCap: 58.7, low52: 48.9, high52: 64.1, peRatio: 24.5, color: "#22c55e", about: loc("The largest vertically integrated dairy company in the world.", "أكبر شركة ألبان متكاملة رأسيًا في العالم.") },
];

const us: Omit<Stock, "series">[] = [
  { symbol: "AAPL", name: loc("Apple", "آبل"), market: "us", domain: "apple.com", sector: loc("Technology", "التقنية"), price: 244.6, change: 1.08, marketCap: 3720, low52: 164, high52: 260, peRatio: 37.2, color: "#64748b", about: loc("Designs the iPhone, Mac, and a world-leading services ecosystem.", "تصمّم آيفون وماك ومنظومة خدمات رائدة عالميًا.") },
  { symbol: "NVDA", name: loc("NVIDIA", "إنفيديا"), market: "us", domain: "nvidia.com", sector: loc("Semiconductors", "أشباه الموصلات"), price: 138.4, change: 3.21, marketCap: 3390, low52: 66.2, high52: 153, peRatio: 54.1, color: "#22c55e", about: loc("The leading designer of AI and graphics processors.", "المصمّم الرائد لمعالجات الذكاء الاصطناعي والرسوميات.") },
  { symbol: "MSFT", name: loc("Microsoft", "مايكروسوفت"), market: "us", domain: "microsoft.com", sector: loc("Technology", "التقنية"), price: 438.2, change: 0.74, marketCap: 3260, low52: 366, high52: 468, peRatio: 35.6, color: "#2f6df0", about: loc("Cloud, software, and AI platforms powering the enterprise.", "منصّات السحابة والبرمجيات والذكاء الاصطناعي للمؤسسات.") },
  { symbol: "AMZN", name: loc("Amazon", "أمازون"), market: "us", domain: "amazon.com", sector: loc("E-commerce", "التجارة الإلكترونية"), price: 224.9, change: 1.52, marketCap: 2360, low52: 151, high52: 233, peRatio: 44.8, color: "#f59e0b", about: loc("Global e-commerce and the world's largest cloud provider (AWS).", "التجارة الإلكترونية العالمية وأكبر مزوّد سحابي في العالم (AWS).") },
  { symbol: "GOOGL", name: loc("Alphabet", "ألفابت"), market: "us", domain: "google.com", sector: loc("Technology", "التقنية"), price: 191.3, change: 0.91, marketCap: 2340, low52: 130, high52: 202, peRatio: 25.4, color: "#ec4899", about: loc("The parent of Google, YouTube, and DeepMind.", "الشركة الأم لجوجل ويوتيوب وديب مايند.") },
  { symbol: "META", name: loc("Meta", "ميتا"), market: "us", domain: "meta.com", sector: loc("Technology", "التقنية"), price: 604.5, change: 2.06, marketCap: 1530, low52: 414, high52: 638, peRatio: 28.9, color: "#0ea5e9", about: loc("The company behind Facebook, Instagram, and WhatsApp.", "الشركة صاحبة فيسبوك وإنستغرام وواتساب.") },
  { symbol: "TSLA", name: loc("Tesla", "تسلا"), market: "us", domain: "tesla.com", sector: loc("Automotive", "السيارات"), price: 421.1, change: -1.44, marketCap: 1350, low52: 138, high52: 488, peRatio: 112, color: "#e5484d", about: loc("Electric vehicles, energy storage, and autonomy.", "المركبات الكهربائية وتخزين الطاقة والقيادة الذاتية.") },
  { symbol: "NFLX", name: loc("Netflix", "نتفليكس"), market: "us", domain: "netflix.com", sector: loc("Entertainment", "الترفيه"), price: 888.4, change: 0.58, marketCap: 380, low52: 588, high52: 941, peRatio: 48.7, color: "#d9820a", about: loc("The world's leading streaming entertainment service.", "خدمة البث الترفيهي الرائدة عالميًا.") },
];

export const stocks: Stock[] = [...sa, ...us].map((s, i) => ({
  ...s,
  series: makeSeries(i + 1, s.price, s.market === "us" ? 0.22 : 0.16),
}));

export const markets: Record<MarketId, MarketMeta> = {
  sa: {
    id: "sa",
    label: loc("Saudi Arabia", "السعودية"),
    index: loc("TASI", "تاسي"),
    currency: "SAR",
    flag: "🇸🇦",
    indexValue: 12184.3,
    indexChange: 0.74,
    series: makeSeries(101, 12184.3, 0.05),
  },
  us: {
    id: "us",
    label: loc("United States", "الولايات المتحدة"),
    index: loc("S&P 500", "إس آند بي ٥٠٠"),
    currency: "USD",
    flag: "🇺🇸",
    indexValue: 6087.2,
    indexChange: 0.42,
    series: makeSeries(202, 6087.2, 0.04),
  },
};

export function stocksFor(market: MarketId): Stock[] {
  return stocks.filter((s) => s.market === market);
}

export function stockBySymbol(symbol: string): Stock | undefined {
  return stocks.find((s) => s.symbol === symbol);
}
