import type {
  Beneficiary,
  Bill,
  Insight,
  InvestmentProduct,
  Notification,
} from "./types";
import { loc } from "@/lib/localized";

export const notifications: Notification[] = [
  {
    id: "n_01",
    type: "transaction",
    title: loc("Payment to Apple Store", "دفعة إلى متجر آبل"),
    body: loc(
      "SAR 999.00 paid with Apple Pay on your naqd Virtual card.",
      "تم دفع ٩٩٩٫٠٠ ر.س عبر أبل باي من بطاقتك الرقمية نقد.",
    ),
    date: "2026-06-30T08:12:00+03:00",
    read: false,
  },
  {
    id: "n_02",
    type: "security",
    title: loc("New sign-in approved", "تمت الموافقة على تسجيل دخول جديد"),
    body: loc(
      "A sign-in from iPhone 17 Pro in Riyadh was approved with Face ID.",
      "تمت الموافقة على تسجيل الدخول من آيفون ١٧ برو في الرياض ببصمة الوجه.",
    ),
    date: "2026-06-30T07:02:00+03:00",
    read: false,
  },
  {
    id: "n_03",
    type: "investment",
    title: loc("Dividend received", "تم استلام توزيعات أرباح"),
    body: loc(
      "Saudi Aramco paid SAR 312.40 into your investment account.",
      "أودعت أرامكو السعودية ٣١٢٫٤٠ ر.س في حساب الاستثمار.",
    ),
    date: "2026-06-28T10:00:00+03:00",
    read: false,
  },
  {
    id: "n_04",
    type: "insight",
    title: loc("You're under budget on dining", "أنت ضمن ميزانية المطاعم"),
    body: loc(
      "Dining spend is down 18% vs last month. Nice work.",
      "انخفض إنفاق المطاعم ١٨٪ مقارنة بالشهر الماضي. أحسنت.",
    ),
    date: "2026-06-27T09:30:00+03:00",
    read: true,
  },
  {
    id: "n_05",
    type: "system",
    title: loc("Salary deposited", "تم إيداع الراتب"),
    body: loc(
      "Your monthly salary of SAR 22,500.00 has arrived.",
      "وصل راتبك الشهري بمبلغ ٢٢٬٥٠٠٫٠٠ ر.س.",
    ),
    date: "2026-06-25T00:05:00+03:00",
    read: true,
  },
  {
    id: "n_06",
    type: "investment",
    title: loc("Auto-invest executed", "تم تنفيذ الاستثمار التلقائي"),
    body: loc(
      "SAR 2,000.00 was invested into your index fund as scheduled.",
      "تم استثمار ٢٬٠٠٠٫٠٠ ر.س في صندوق المؤشر حسب الجدول.",
    ),
    date: "2026-06-21T06:00:00+03:00",
    read: true,
  },
];

export const insights: Insight[] = [
  {
    id: "i_01",
    kind: "saving",
    title: loc("You could save SAR 640/month", "يمكنك توفير ٦٤٠ ر.س شهريًا"),
    body: loc(
      "Three subscriptions overlap. Cancelling the unused two frees up SAR 640 every month.",
      "ثلاثة اشتراكات متداخلة. إلغاء غير المستخدم منها يوفّر ٦٤٠ ر.س شهريًا.",
    ),
    metric: 640,
    metricKind: "currency",
    tone: "positive",
  },
  {
    id: "i_02",
    kind: "spending",
    title: loc("Shopping is over budget", "التسوق تجاوز الميزانية"),
    body: loc(
      "You've spent 125% of your shopping budget with 1 day left in the month.",
      "أنفقت ١٢٥٪ من ميزانية التسوق وتبقّى يوم واحد على نهاية الشهر.",
    ),
    metric: 25,
    metricKind: "percent",
    tone: "warning",
  },
  {
    id: "i_03",
    kind: "investment",
    title: loc("Your portfolio beat the index", "محفظتك تفوّقت على المؤشر"),
    body: loc(
      "Up 11.5% this year — about 2.3% ahead of the TASI benchmark.",
      "ارتفاع ١١٫٥٪ هذا العام — بنحو ٢٫٣٪ فوق مؤشر تاسي.",
    ),
    metric: 11.5,
    metricKind: "percent",
    tone: "positive",
  },
  {
    id: "i_04",
    kind: "goal",
    title: loc("Emergency fund almost there", "صندوق الطوارئ يقترب"),
    body: loc(
      "You're 81% to your SAR 60,000 goal. At this pace you'll finish in 3 months.",
      "أنجزت ٨١٪ من هدف ٦٠٬٠٠٠ ر.س. بهذا المعدل ستكمله خلال ٣ أشهر.",
    ),
    metric: 81,
    metricKind: "percent",
    tone: "neutral",
  },
  {
    id: "i_05",
    kind: "alert",
    title: loc("Unusual transport spend", "إنفاق غير معتاد على النقل"),
    body: loc(
      "Ride-hailing is up 34% this week. Mostly early-morning airport trips.",
      "ارتفع إنفاق سيارات الأجرة ٣٤٪ هذا الأسبوع، غالبًا رحلات المطار الصباحية.",
    ),
    metric: 34,
    metricKind: "percent",
    tone: "warning",
  },
];

export const investmentProducts: InvestmentProduct[] = [
  {
    id: "p_index",
    name: loc("naqd Saudi Index Fund", "صندوق نقد للمؤشر السعودي"),
    category: loc("Equity · TASI", "أسهم · تاسي"),
    expectedReturn: 9.2,
    risk: "medium",
    minInvestment: 500,
    shariah: true,
    description: loc(
      "Track the largest 50 Saudi companies with a single, low-fee fund.",
      "تتبّع أكبر ٥٠ شركة سعودية عبر صندوق واحد منخفض الرسوم.",
    ),
    color: "#52d400",
  },
  {
    id: "p_sukuk",
    name: loc("Sukuk Income Fund", "صندوق دخل الصكوك"),
    category: loc("Fixed income · Shariah", "دخل ثابت · شرعي"),
    expectedReturn: 5.1,
    risk: "low",
    minInvestment: 1000,
    shariah: true,
    description: loc(
      "Stable, Shariah-compliant income from government and corporate sukuk.",
      "دخل مستقر ومتوافق مع الشريعة من صكوك حكومية وشركات.",
    ),
    color: "#14b8a6",
  },
  {
    id: "p_global",
    name: loc("Global Tech Portfolio", "محفظة التقنية العالمية"),
    category: loc("Equity · Global", "أسهم · عالمية"),
    expectedReturn: 12.6,
    risk: "high",
    minInvestment: 750,
    shariah: false,
    description: loc(
      "Exposure to the world's leading technology companies, fully managed.",
      "استثمار في كبرى شركات التقنية العالمية، بإدارة كاملة.",
    ),
    color: "#2f6df0",
  },
  {
    id: "p_gold",
    name: loc("Gold Reserve", "احتياطي الذهب"),
    category: loc("Commodity", "سلعة"),
    expectedReturn: 6.4,
    risk: "medium",
    minInvestment: 250,
    shariah: true,
    description: loc(
      "Hedge against inflation with vaulted, physically-backed gold.",
      "تحوّط ضد التضخم عبر ذهب مادي محفوظ في خزائن آمنة.",
    ),
    color: "#eab308",
  },
];

export const beneficiaries: Beneficiary[] = [
  {
    id: "b_01",
    name: loc("Sara Al-Otaibi", "سارة العتيبي"),
    bank: loc("Al Rajhi Bank", "مصرف الراجحي"),
    iban: "SA•• 3320",
    favorite: true,
  },
  {
    id: "b_02",
    name: loc("Mohammed Al-Qahtani", "محمد القحطاني"),
    bank: loc("Saudi National Bank", "البنك الأهلي السعودي"),
    iban: "SA•• 7741",
    favorite: true,
  },
  {
    id: "b_03",
    name: loc("Riyadh Rent — Villa", "إيجار الرياض — الفيلا"),
    bank: loc("Riyad Bank", "بنك الرياض"),
    iban: "SA•• 1052",
    favorite: false,
  },
  {
    id: "b_04",
    name: loc("Noura Al-Harbi", "نورة الحربي"),
    bank: loc("Alinma Bank", "مصرف الإنماء"),
    iban: "SA•• 6638",
    favorite: false,
  },
];

export const bills: Bill[] = [
  {
    id: "bill_01",
    biller: loc("Saudi Electricity", "الكهرباء السعودية"),
    category: "bills",
    amount: 345,
    dueDate: "2026-07-05T00:00:00+03:00",
    status: "scheduled",
    autopay: true,
  },
  {
    id: "bill_02",
    biller: loc("stc — Mobile & Internet", "إس تي سي — جوال وإنترنت"),
    category: "bills",
    amount: 210,
    dueDate: "2026-07-08T00:00:00+03:00",
    status: "due",
    autopay: false,
  },
  {
    id: "bill_03",
    biller: loc("Saudi Water Authority", "هيئة المياه السعودية"),
    category: "bills",
    amount: 120,
    dueDate: "2026-07-02T00:00:00+03:00",
    status: "scheduled",
    autopay: true,
  },
  {
    id: "bill_04",
    biller: loc("Netflix", "نتفليكس"),
    category: "entertainment",
    amount: 56,
    dueDate: "2026-07-03T00:00:00+03:00",
    status: "scheduled",
    autopay: true,
  },
  {
    id: "bill_05",
    biller: loc("Tahakom Salik — Tolls", "تحكّم — رسوم الطرق"),
    category: "transport",
    amount: 90,
    dueDate: "2026-07-12T00:00:00+03:00",
    status: "due",
    autopay: false,
  },
];
