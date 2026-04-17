import { useState, useRef, useCallback, useEffect } from "react";
import Icon from "@/components/ui/icon";

type Section = "cover" | "charts" | "reference" | "notifications" | "export" | "upload" | "history";

const ANALYZE_URL = "https://functions.poehali.dev/0fb0bb3b-8721-44b2-8740-cffed004e0ff";
const HISTORY_URL = "https://functions.poehali.dev/dc279a56-a17f-45bb-bb46-10f88b4e1230";

interface RecognizedResult {
  name: string;
  value: number;
  unit: string;
  normMin: number | null;
  normMax: number | null;
  status: "normal" | "high" | "low" | "unknown";
}

interface AnalysisResponse {
  date: string | null;
  lab: string | null;
  patient: string | null;
  results: RecognizedResult[];
}

const COVER_IMAGE = "https://cdn.poehali.dev/projects/0af45e95-fde7-4d0a-82b6-45cd06b5ee4b/files/8f1af8cd-86e8-4484-b97c-23da96c528d1.jpg";

// --- Mock data ---
const bloodData = [
  { name: "Гемоглобин", value: 138, norm: [120, 160] as [number, number], unit: "г/л", trend: "stable" },
  { name: "Эритроциты", value: 4.8, norm: [3.9, 5.0] as [number, number], unit: "×10¹²/л", trend: "up" },
  { name: "Лейкоциты", value: 9.2, norm: [4.0, 9.0] as [number, number], unit: "×10⁹/л", trend: "up" },
  { name: "Тромбоциты", value: 210, norm: [180, 320] as [number, number], unit: "×10⁹/л", trend: "stable" },
  { name: "СОЭ", value: 18, norm: [2, 15] as [number, number], unit: "мм/ч", trend: "up" },
  { name: "Глюкоза", value: 5.1, norm: [3.9, 6.1] as [number, number], unit: "ммоль/л", trend: "down" },
];

const monthlyData = [
  { month: "Окт", hgb: 132, wbc: 7.2 },
  { month: "Ноя", hgb: 135, wbc: 8.1 },
  { month: "Дек", hgb: 130, wbc: 9.5 },
  { month: "Янв", hgb: 134, wbc: 8.8 },
  { month: "Фев", hgb: 136, wbc: 8.0 },
  { month: "Мар", hgb: 138, wbc: 9.2 },
];

interface ReferenceItem {
  name: string;
  male: string;
  female: string;
  role: string;
  critical?: string;
}

interface ReferenceGroup {
  id: string;
  label: string;
  icon: string;
  color: string;
  items: ReferenceItem[];
}

const referenceGroups: ReferenceGroup[] = [
  {
    id: "cbc",
    label: "ОАК",
    icon: "Droplets",
    color: "text-red-400",
    items: [
      { name: "Гемоглобин", male: "130–170 г/л", female: "120–150 г/л", role: "Перенос кислорода", critical: "<70 или >200 г/л" },
      { name: "Эритроциты", male: "4.0–5.0 ×10¹²/л", female: "3.5–4.7 ×10¹²/л", role: "Красные клетки крови" },
      { name: "Гематокрит", male: "40–48%", female: "36–46%", role: "Доля эритроцитов в крови" },
      { name: "Лейкоциты", male: "4.0–9.0 ×10⁹/л", female: "4.0–9.0 ×10⁹/л", role: "Иммунная защита", critical: "<2.0 или >30 ×10⁹/л" },
      { name: "Тромбоциты", male: "180–320 ×10⁹/л", female: "180–320 ×10⁹/л", role: "Свёртывание крови", critical: "<50 ×10⁹/л" },
      { name: "Нейтрофилы", male: "47–72%", female: "47–72%", role: "Борьба с бактериями" },
      { name: "Лимфоциты", male: "19–37%", female: "19–37%", role: "Клеточный иммунитет" },
      { name: "Моноциты", male: "3–11%", female: "3–11%", role: "Фагоцитоз" },
      { name: "Эозинофилы", male: "0–5%", female: "0–5%", role: "Аллергии и паразиты" },
      { name: "Базофилы", male: "0–1%", female: "0–1%", role: "Аллергические реакции" },
      { name: "СОЭ", male: "до 15 мм/ч", female: "до 20 мм/ч", role: "Маркер воспаления" },
      { name: "MCV (средний объём эр.)", male: "80–100 фл", female: "80–100 фл", role: "Тип анемии" },
      { name: "MCH (среднее содержание Hb)", male: "26–34 пг", female: "26–34 пг", role: "Насыщение эритроцитов" },
      { name: "MCHC", male: "320–360 г/л", female: "320–360 г/л", role: "Концентрация Hb в эр." },
    ],
  },
  {
    id: "lipid",
    label: "Липидограмма",
    icon: "Activity",
    color: "text-amber-400",
    items: [
      { name: "Общий холестерин", male: "до 5.2 ммоль/л", female: "до 5.2 ммоль/л", role: "Риск атеросклероза", critical: ">7.8 ммоль/л" },
      { name: "ЛПНП (плохой холестерин)", male: "до 3.0 ммоль/л", female: "до 3.0 ммоль/л", role: "Атерогенный холестерин", critical: ">4.9 ммоль/л" },
      { name: "ЛПВП (хороший холестерин)", male: ">1.0 ммоль/л", female: ">1.2 ммоль/л", role: "Антиатерогенный холестерин" },
      { name: "ЛПОНП", male: "0.13–1.63 ммоль/л", female: "0.13–1.63 ммоль/л", role: "Очень низкой плотности" },
      { name: "Триглицериды", male: "до 1.7 ммоль/л", female: "до 1.7 ммоль/л", role: "Жиры крови", critical: ">5.6 ммоль/л" },
      { name: "Коэффициент атерогенности", male: "до 3.0", female: "до 3.0", role: "Соотношение фракций ХС" },
      { name: "Аполипопротеин А1", male: "1.04–2.02 г/л", female: "1.08–2.25 г/л", role: "Транспорт ЛПВП" },
      { name: "Аполипопротеин В", male: "0.66–1.33 г/л", female: "0.60–1.17 г/л", role: "Транспорт ЛПНП/ЛПОНП" },
    ],
  },
  {
    id: "electrolytes",
    label: "Электролиты",
    icon: "Zap",
    color: "text-sky-400",
    items: [
      { name: "Натрий (Na⁺)", male: "136–145 ммоль/л", female: "136–145 ммоль/л", role: "Водно-солевой баланс", critical: "<120 или >160 ммоль/л" },
      { name: "Калий (K⁺)", male: "3.5–5.1 ммоль/л", female: "3.5–5.1 ммоль/л", role: "Работа сердца и мышц", critical: "<2.5 или >6.5 ммоль/л" },
      { name: "Хлор (Cl⁻)", male: "98–107 ммоль/л", female: "98–107 ммоль/л", role: "КЩС и гидратация" },
      { name: "Кальций общий (Ca²⁺)", male: "2.15–2.55 ммоль/л", female: "2.15–2.55 ммоль/л", role: "Кости, мышцы, свёртывание", critical: "<1.75 или >3.5 ммоль/л" },
      { name: "Кальций ионизированный", male: "1.15–1.27 ммоль/л", female: "1.15–1.27 ммоль/л", role: "Активная форма кальция" },
      { name: "Магний (Mg²⁺)", male: "0.66–1.07 ммоль/л", female: "0.66–1.07 ммоль/л", role: "Нервная система, мышцы" },
      { name: "Фосфор неорганический", male: "0.87–1.45 ммоль/л", female: "0.87–1.45 ммоль/л", role: "Костная ткань, энергия" },
      { name: "Железо (Fe)", male: "11.6–31.3 мкмоль/л", female: "8.95–30.4 мкмоль/л", role: "Синтез гемоглобина", critical: "<4.5 мкмоль/л" },
      { name: "ОЖСС", male: "45–72 мкмоль/л", female: "45–72 мкмоль/л", role: "Запасы железа" },
      { name: "Ферритин", male: "30–400 нг/мл", female: "12–150 нг/мл", role: "Депо железа" },
    ],
  },
  {
    id: "coag",
    label: "Коагулограмма",
    icon: "Shield",
    color: "text-purple-400",
    items: [
      { name: "Протромбиновое время (ПТВ)", male: "11–15 сек", female: "11–15 сек", role: "Внешний путь свёртывания", critical: ">30 сек" },
      { name: "МНО (INR)", male: "0.85–1.15", female: "0.85–1.15", role: "Контроль антикоагулянтов", critical: ">4.0" },
      { name: "АЧТВ", male: "25–37 сек", female: "25–37 сек", role: "Внутренний путь свёртывания", critical: ">100 сек" },
      { name: "Тромбиновое время", male: "14–21 сек", female: "14–21 сек", role: "Финальный этап свёртывания" },
      { name: "Фибриноген", male: "2.0–4.0 г/л", female: "2.0–4.0 г/л", role: "Основа кровяного сгустка", critical: "<1.0 г/л" },
      { name: "D-димер", male: "до 0.5 мкг/мл", female: "до 0.5 мкг/мл", role: "Маркер тромбообразования", critical: ">4.0 мкг/мл" },
      { name: "Антитромбин III", male: "80–120%", female: "80–120%", role: "Противосвёртывающая система" },
      { name: "Протеин C", male: "70–140%", female: "70–140%", role: "Антикоагулянтная система" },
      { name: "Время кровотечения по Дюку", male: "2–4 мин", female: "2–4 мин", role: "Первичный гемостаз" },
    ],
  },
  {
    id: "vitamins",
    label: "Витамины",
    icon: "Sun",
    color: "text-yellow-400",
    items: [
      { name: "Витамин D (25-OH)", male: "30–100 нг/мл", female: "30–100 нг/мл", role: "Иммунитет, кости, гормоны", critical: "<10 нг/мл" },
      { name: "Витамин B12", male: "187–883 пг/мл", female: "187–883 пг/мл", role: "Нервная система, кроветворение", critical: "<100 пг/мл" },
      { name: "Фолиевая кислота (B9)", male: "4.6–34.8 нмоль/л", female: "4.6–34.8 нмоль/л", role: "ДНК-синтез, беременность" },
      { name: "Витамин B1 (тиамин)", male: "70–180 нмоль/л", female: "70–180 нмоль/л", role: "Энергетический обмен" },
      { name: "Витамин B6 (пиридоксин)", male: "20–125 нмоль/л", female: "20–125 нмоль/л", role: "Белковый обмен, иммунитет" },
      { name: "Витамин C (аскорбиновая к-та)", male: "23–114 мкмоль/л", female: "23–114 мкмоль/л", role: "Антиоксидант, коллаген" },
      { name: "Витамин A (ретинол)", male: "0.3–0.8 мг/л", female: "0.3–0.8 мг/л", role: "Зрение, иммунитет, кожа" },
      { name: "Витамин E (токоферол)", male: "5.5–17 мг/л", female: "5.5–17 мг/л", role: "Антиоксидант, репродукция" },
      { name: "Витамин K", male: "0.1–2.2 нг/мл", female: "0.1–2.2 нг/мл", role: "Свёртывание крови, кости" },
      { name: "Биотин (B7)", male: "133–329 пмоль/л", female: "133–329 пмоль/л", role: "Метаболизм, кожа, волосы" },
    ],
  },
];

const notificationsData = [
  { id: 1, type: "warning", title: "СОЭ выше нормы", desc: "Показатель 18 мм/ч превышает норму. Возможно воспаление.", time: "2 ч назад", read: false },
  { id: 2, type: "warning", title: "Лейкоциты повышены", desc: "9.2 ×10⁹/л — незначительное превышение верхней границы нормы.", time: "2 ч назад", read: false },
  { id: 3, type: "info", title: "Анализ добавлен", desc: "Общий анализ крови от 17 апреля успешно загружен в систему.", time: "3 ч назад", read: true },
  { id: 4, type: "success", title: "Гемоглобин в норме", desc: "Показатель 138 г/л находится в пределах референсных значений.", time: "1 день назад", read: true },
  { id: 5, type: "info", title: "Напоминание", desc: "Следующий анализ рекомендован через 3 месяца — в июле 2026.", time: "2 дня назад", read: true },
];

function getStatus(value: number, norm: [number, number]) {
  if (value < norm[0]) return "low";
  if (value > norm[1]) return "high";
  return "normal";
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    normal: { label: "Норма", color: "text-green-400 bg-green-400/10 border-green-400/30" },
    high: { label: "Выше нормы", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
    low: { label: "Ниже нормы", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  };
  const cfg = config[status] || { label: "—", color: "" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <Icon name="TrendingUp" size={14} className="text-amber-400" />;
  if (trend === "down") return <Icon name="TrendingDown" size={14} className="text-sky-400" />;
  return <Icon name="Minus" size={14} className="text-green-400" />;
}

// --- COVER ---
function CoverPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0">
        <img src={COVER_IMAGE} alt="Lab" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/60" />
      </div>
      <div className="absolute inset-0 grid-bg opacity-30" />

      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center glow-cyan">
            <Icon name="FlaskConical" size={16} className="text-sky-400" />
          </div>
          <span className="text-sm font-mono text-sky-400/70 tracking-widest uppercase">ГемоАналит v2.4</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 status-pulse" />
          <span className="text-xs text-muted-foreground font-mono">СИСТЕМА АКТИВНА</span>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
        <div className="stagger-1 mb-4">
          <span className="text-xs font-mono text-sky-400/60 tracking-[0.3em] uppercase">
            Медицинская информационная система
          </span>
        </div>

        <h1 className="stagger-2 hero-title text-6xl md:text-8xl font-bold leading-none mb-4 tracking-tight">
          ГемоАналит
        </h1>

        <p className="stagger-3 text-lg md:text-xl text-muted-foreground max-w-lg mb-3 font-light leading-relaxed">
          Профессиональный анализ показателей крови с графиками динамики, справочными значениями и умными уведомлениями
        </p>

        <div className="stagger-4 flex flex-wrap justify-center items-center gap-4 text-sm text-muted-foreground mb-12 font-mono">
          <span className="flex items-center gap-1.5"><Icon name="BarChart2" size={14} className="text-sky-400" /> Графики</span>
          <span className="text-border hidden sm:block">|</span>
          <span className="flex items-center gap-1.5"><Icon name="BookOpen" size={14} className="text-sky-400" /> Справочник</span>
          <span className="text-border hidden sm:block">|</span>
          <span className="flex items-center gap-1.5"><Icon name="Bell" size={14} className="text-sky-400" /> Уведомления</span>
          <span className="text-border hidden sm:block">|</span>
          <span className="flex items-center gap-1.5"><Icon name="Download" size={14} className="text-sky-400" /> Экспорт</span>
        </div>

        <button
          onClick={onStart}
          className="stagger-5 group relative px-10 py-4 bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold text-lg rounded-2xl transition-all duration-300 glow-cyan hover:scale-105 active:scale-95"
        >
          <span className="flex items-center gap-3">
            <Icon name="Play" size={20} />
            Начать работу
          </span>
        </button>

        <p className="stagger-6 mt-6 text-xs text-muted-foreground/50 font-mono">
          Нажмите для доступа к системе мониторинга
        </p>
      </div>

      <div className="relative z-10 border-t border-border/50 bg-card/40 backdrop-blur-sm px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 md:gap-16">
          {[
            { label: "Показателей", value: "120+" },
            { label: "Пациентов", value: "2 438" },
            { label: "Анализов сегодня", value: "47" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl font-bold text-sky-400 font-mono">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- CHARTS ---
function ChartsSection() {
  const maxHgb = Math.max(...monthlyData.map(d => d.hgb));
  const maxWbc = Math.max(...monthlyData.map(d => d.wbc));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="stagger-1">
        <h2 className="text-2xl font-bold text-white mb-1">Динамика показателей</h2>
        <p className="text-muted-foreground text-sm">Общий анализ крови · 17 апреля 2026</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 stagger-2">
        {bloodData.map((item) => {
          const status = getStatus(item.value, item.norm);
          const range = item.norm[1] - item.norm[0];
          const pct = range > 0 ? Math.min(100, Math.max(0, ((item.value - item.norm[0]) / range) * 100)) : 50;
          const barColor = status === "normal" ? "bg-green-500" : status === "high" ? "bg-amber-500" : "bg-red-500";
          return (
            <div key={item.name} className="bg-card border border-border rounded-xl p-4 hover:border-sky-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{item.name}</span>
                <TrendIcon trend={item.trend} />
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-2xl font-bold font-mono text-white">{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.max(5, Math.min(95, pct))}%` }} />
              </div>
              <StatusBadge status={status} />
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 stagger-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white">Гемоглобин</h3>
            <p className="text-xs text-muted-foreground font-mono">г/л · 6 месяцев</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded bg-sky-500" /> Значение
          </div>
        </div>
        <div className="flex items-end gap-3 h-40">
          {monthlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">{d.hgb}</span>
              <div className="w-full flex items-end justify-center" style={{ height: '100px' }}>
                <div
                  className="w-full bg-sky-500/80 hover:bg-sky-400 rounded-t-md transition-colors bar-animate"
                  style={{ height: `${(d.hgb / maxHgb) * 100}%`, animationDelay: `${i * 0.1}s` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">{d.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 border-t border-dashed border-green-500/40" />
          <span className="text-green-400">Норма: 120–160 г/л</span>
          <div className="h-px flex-1 border-t border-dashed border-green-500/40" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 stagger-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-white">Лейкоциты</h3>
            <p className="text-xs text-muted-foreground font-mono">×10⁹/л · 6 месяцев</p>
          </div>
          <div className="text-xs text-amber-400 font-mono bg-amber-400/10 px-2 py-1 rounded-full border border-amber-400/30">
            ↑ Тенденция к росту
          </div>
        </div>
        <div className="flex items-end gap-3 h-32">
          {monthlyData.map((d, i) => {
            const h = (d.wbc / maxWbc) * 100;
            const isHigh = d.wbc > 9.0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-xs font-mono ${isHigh ? "text-amber-400" : "text-muted-foreground"}`}>{d.wbc}</span>
                <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                  <div
                    className={`w-full rounded-t-md bar-animate ${isHigh ? "bg-amber-500/80 hover:bg-amber-400" : "bg-sky-500/60 hover:bg-sky-400"}`}
                    style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono">{d.month}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-px flex-1 border-t border-dashed border-green-500/40" />
          <span className="text-green-400">Норма: 4.0–9.0 ×10⁹/л</span>
          <div className="h-px flex-1 border-t border-dashed border-green-500/40" />
        </div>
      </div>
    </div>
  );
}

// --- REFERENCE ---
function ReferenceSection() {
  const [activeGroup, setActiveGroup] = useState("cbc");
  const [search, setSearch] = useState("");

  const group = referenceGroups.find(g => g.id === activeGroup)!;

  const allItems = search
    ? referenceGroups.flatMap(g => g.items.map(item => ({ ...item, groupLabel: g.label, groupColor: g.color })))
        .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.role.toLowerCase().includes(search.toLowerCase()))
    : null;

  const displayItems = allItems ?? group.items;
  const totalCount = referenceGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="stagger-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Справочник норм</h2>
          <p className="text-muted-foreground text-sm">{totalCount} показателей · 5 групп анализов</p>
        </div>
        <div className="relative">
          <Icon name="Search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по всем группам..."
            className="pl-8 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-muted-foreground/50 font-mono text-foreground w-52"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
              <Icon name="X" size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Group tabs */}
      {!search && (
        <div className="stagger-2 flex gap-2 overflow-x-auto pb-1">
          {referenceGroups.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap border ${
                activeGroup === g.id
                  ? "bg-card border-sky-500/40 text-white shadow-sm"
                  : "bg-transparent border-border text-muted-foreground hover:text-white hover:border-border/80"
              }`}
            >
              <Icon name={g.icon as "Droplets"} size={14} className={activeGroup === g.id ? g.color : "text-muted-foreground"} />
              {g.label}
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${activeGroup === g.id ? "bg-sky-500/15 text-sky-400" : "bg-secondary text-muted-foreground"}`}>
                {g.items.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Group header (when not searching) */}
      {!search && (
        <div className={`stagger-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border`}>
          <div className={`w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center`}>
            <Icon name={group.icon as "Droplets"} size={16} className={group.color} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {group.label === "ОАК" ? "Общий анализ крови (ОАК)" :
               group.label === "Липидограмма" ? "Липидограмма крови" :
               group.label === "Электролиты" ? "Ионограмма и электролиты крови" :
               group.label === "Коагулограмма" ? "Коагулограмма и свёртываемость крови" :
               "Витамины в крови"}
            </p>
            <p className="text-xs text-muted-foreground">{group.items.length} показателей</p>
          </div>
        </div>
      )}

      {/* Search results label */}
      {search && allItems && (
        <div className="text-sm text-muted-foreground font-mono">
          Найдено: <span className="text-white">{allItems.length}</span> показателей по запросу «{search}»
        </div>
      )}

      {/* Table */}
      <div className="stagger-3 space-y-1.5">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
          <span className="col-span-4">Показатель</span>
          <span className="col-span-3">Мужчины</span>
          <span className="col-span-3">Женщины</span>
          <span className="col-span-2">Функция</span>
        </div>

        {displayItems.map((item, i) => {
          const hasCritical = "critical" in item && item.critical;
          return (
            <div
              key={`${item.name}-${i}`}
              className="grid grid-cols-12 gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-sky-500/30 transition-all group"
            >
              <div className="col-span-4 flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                <div>
                  <span className="text-sm font-medium text-white leading-tight block">{item.name}</span>
                  {hasCritical && (
                    <span className="text-xs text-red-400/70 font-mono">крит: {item.critical}</span>
                  )}
                  {"groupLabel" in item && (
                    <span className={`text-xs font-mono ${"groupColor" in item ? item.groupColor as string : "text-muted-foreground"} opacity-70`}>{item.groupLabel as string}</span>
                  )}
                </div>
              </div>
              <span className="col-span-3 text-sm font-mono text-blue-300 self-center leading-tight">{item.male}</span>
              <span className="col-span-3 text-sm font-mono text-pink-300 self-center leading-tight">{item.female}</span>
              <span className="col-span-2 text-xs text-muted-foreground self-center leading-tight">{item.role}</span>
            </div>
          );
        })}

        {search && allItems?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Ничего не найдено по запросу «{search}»</p>
          </div>
        )}
      </div>

      <div className="stagger-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-3">
        <Icon name="Info" size={15} className="text-sky-400 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-300/80">
          Референсные значения могут отличаться в зависимости от метода исследования и лаборатории. Для интерпретации результатов консультируйтесь с врачом.
        </p>
      </div>
    </div>
  );
}

// --- NOTIFICATIONS ---
function NotificationsSection() {
  const [items, setItems] = useState(notificationsData);
  const unread = items.filter(n => !n.read).length;

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })));

  const iconConfig: Record<string, { icon: string; color: string; bg: string }> = {
    warning: { icon: "AlertTriangle", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
    info: { icon: "Info", color: "text-sky-400", bg: "bg-sky-400/10 border-sky-400/20" },
    success: { icon: "CheckCircle", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between stagger-1">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            Уведомления
            {unread > 0 && (
              <span className="text-sm font-mono bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                {unread} новых
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm">Предупреждения и обновления системы</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-sky-400 hover:text-sky-300 font-mono border border-sky-500/30 px-3 py-1.5 rounded-lg hover:bg-sky-500/10 transition-all"
          >
            Прочитать все
          </button>
        )}
      </div>

      <div className="space-y-3 stagger-2">
        {items.map((item) => {
          const cfg = iconConfig[item.type] || iconConfig.info;
          return (
            <div
              key={item.id}
              className={`flex gap-4 p-4 rounded-xl border transition-all ${
                item.read ? "bg-card border-border opacity-60" : "bg-card border-border hover:border-sky-500/30"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cfg.bg}`}>
                <Icon name={cfg.icon as "Info"} size={16} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold ${item.read ? "text-muted-foreground" : "text-white"}`}>
                    {item.title}
                  </span>
                  {!item.read && <div className="w-1.5 h-1.5 rounded-full bg-sky-400 status-pulse shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                <span className="text-xs text-muted-foreground/50 font-mono mt-1 block">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {unread === 0 && (
        <div className="text-center py-8 text-muted-foreground stagger-3">
          <Icon name="BellOff" size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Все уведомления прочитаны</p>
        </div>
      )}
    </div>
  );
}

// --- EXPORT ---
function ExportSection() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = (format: string) => {
    setExporting(format);
    setTimeout(() => setExporting(null), 2000);
  };

  const formats = [
    { id: "pdf", icon: "FileText", label: "PDF-отчёт", desc: "Полный отчёт с графиками и комментариями врача", badge: "Рекомендуется", badgeColor: "text-green-400 bg-green-400/10 border-green-400/20" },
    { id: "excel", icon: "Table", label: "Excel / CSV", desc: "Таблица показателей для анализа в Microsoft Excel", badge: "Данные", badgeColor: "text-sky-400 bg-sky-400/10 border-sky-400/20" },
    { id: "json", icon: "Code", label: "JSON-экспорт", desc: "Данные в формате JSON для интеграции с другими системами", badge: "API", badgeColor: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    { id: "print", icon: "Printer", label: "Распечатать", desc: "Открыть диалог печати для вывода на бумагу", badge: "", badgeColor: "" },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="stagger-1">
        <h2 className="text-2xl font-bold text-white mb-1">Экспорт данных</h2>
        <p className="text-muted-foreground text-sm">Выберите формат для выгрузки результатов анализов</p>
      </div>

      <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-5 stagger-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-sky-500/20 border border-sky-500/30 rounded-xl flex items-center justify-center">
            <Icon name="FlaskConical" size={16} className="text-sky-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Общий анализ крови</p>
            <p className="text-xs text-muted-foreground font-mono">17 апреля 2026 · 6 показателей</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "В норме", value: "4", color: "text-green-400" },
            { label: "Выше нормы", value: "2", color: "text-amber-400" },
            { label: "Ниже нормы", value: "0", color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-background/30 rounded-lg p-3 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 stagger-3">
        {formats.map((fmt) => (
          <div key={fmt.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-sky-500/30 transition-all">
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shrink-0">
              <Icon name={fmt.icon as "FileText"} size={18} className="text-sky-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white">{fmt.label}</span>
                {fmt.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${fmt.badgeColor}`}>
                    {fmt.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{fmt.desc}</p>
            </div>
            <button
              onClick={() => handleExport(fmt.id)}
              className="shrink-0 flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm rounded-lg transition-all hover:scale-105 active:scale-95 font-mono"
            >
              {exporting === fmt.id ? (
                <><Icon name="Loader" size={14} className="animate-spin" /><span>Готовим...</span></>
              ) : (
                <><Icon name="Download" size={14} /><span>Скачать</span></>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="stagger-4 flex items-center gap-2 text-xs text-muted-foreground/50 font-mono">
        <Icon name="Lock" size={12} />
        <span>Все данные передаются в зашифрованном виде. HIPAA-совместимо.</span>
      </div>
    </div>
  );
}

// --- UPLOAD SECTION ---
type UploadState = "idle" | "dragging" | "processing" | "done" | "error";

function UploadSection({ onSaved }: { onSaved?: () => void }) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setUploadState("idle");
    setProgress(0);
    setPreviewUrl(null);
    setFileName(null);
    setResult(null);
    setErrorMsg(null);
    setSaving(false);
    setSavedId(null);
  };

  const saveToHistory = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const resp = await fetch(HISTORY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: result.date,
          lab: result.lab,
          patient: result.patient,
          file_name: fileName,
          results: result.results,
        }),
      });
      const data = await resp.json();
      setSavedId(data.id || "ok");
      onSaved?.();
    } catch {
      setSavedId(null);
    } finally {
      setSaving(false);
    }
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "image/gif"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Поддерживаются: JPG, PNG, WebP, PDF");
      setUploadState("error");
      return;
    }

    setFileName(file.name);
    setUploadState("processing");
    setProgress(10);

    // Preview for images
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      setProgress(30);
      const dataUrl = e.target?.result as string;
      // Extract base64 part after comma
      const base64 = dataUrl.split(",")[1];
      const mimeType = file.type === "application/pdf" ? "image/jpeg" : file.type;

      setProgress(50);
      try {
        const resp = await fetch(ANALYZE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType }),
        });

        setProgress(85);
        const data = await resp.json();

        if (!resp.ok || data.error) {
          setErrorMsg(data.error || "Ошибка распознавания");
          setUploadState("error");
          return;
        }

        setProgress(100);
        setResult(data as AnalysisResponse);
        setUploadState("done");
      } catch {
        setErrorMsg("Ошибка сети. Проверьте подключение.");
        setUploadState("error");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setUploadState("idle");
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setUploadState("dragging"); };
  const onDragLeave = () => { if (uploadState === "dragging") setUploadState("idle"); };

  const statusColors: Record<string, string> = {
    normal: "text-green-400",
    high: "text-amber-400",
    low: "text-red-400",
    unknown: "text-muted-foreground",
  };
  const statusLabels: Record<string, string> = {
    normal: "Норма",
    high: "Выше нормы",
    low: "Ниже нормы",
    unknown: "—",
  };
  const statusBg: Record<string, string> = {
    normal: "bg-green-400/10 border-green-400/20",
    high: "bg-amber-400/10 border-amber-400/20",
    low: "bg-red-400/10 border-red-400/20",
    unknown: "bg-secondary border-border",
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="stagger-1">
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
          Загрузить анализ
          <span className="text-xs font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-full">ИИ-распознавание</span>
        </h2>
        <p className="text-muted-foreground text-sm">Загрузите фото или скан бланка — система автоматически извлечёт все показатели</p>
      </div>

      {/* Drop zone */}
      {uploadState !== "done" && (
        <div
          className={`stagger-2 relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
            ${uploadState === "dragging"
              ? "border-sky-400 bg-sky-500/10 scale-[1.01]"
              : uploadState === "processing"
              ? "border-sky-500/40 bg-card"
              : uploadState === "error"
              ? "border-red-500/40 bg-red-500/5"
              : "border-border hover:border-sky-500/50 hover:bg-sky-500/5 bg-card"
            }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => uploadState === "idle" && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
          />

          {/* Idle state */}
          {uploadState === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
                <Icon name="Upload" size={28} className="text-sky-400" />
              </div>
              <h3 className="text-white font-semibold mb-1">Перетащите файл сюда</h3>
              <p className="text-muted-foreground text-sm mb-4">или нажмите для выбора файла</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
                <span className="px-2 py-1 bg-secondary rounded-md">JPG</span>
                <span className="px-2 py-1 bg-secondary rounded-md">PNG</span>
                <span className="px-2 py-1 bg-secondary rounded-md">WebP</span>
                <span className="px-2 py-1 bg-secondary rounded-md">PDF</span>
              </div>
            </div>
          )}

          {/* Dragging state */}
          {uploadState === "dragging" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center mb-4 animate-bounce">
                <Icon name="FileDown" size={28} className="text-sky-400" />
              </div>
              <h3 className="text-sky-400 font-semibold">Отпустите для загрузки</h3>
            </div>
          )}

          {/* Processing state */}
          {uploadState === "processing" && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              {/* Scan animation visual */}
              {previewUrl && (
                <div className="relative w-40 h-40 rounded-xl overflow-hidden mb-6 border border-border">
                  <img src={previewUrl} alt="preview" className="w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-0 scan-overlay" />
                  <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 to-transparent" />
                </div>
              )}
              {!previewUrl && (
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-6">
                  <Icon name="FileSearch" size={28} className="text-sky-400 animate-pulse" />
                </div>
              )}
              <h3 className="text-white font-semibold mb-1">Анализирую бланк...</h3>
              <p className="text-muted-foreground text-sm mb-1 font-mono">{fileName}</p>
              <p className="text-xs text-sky-400/70 mb-5">GPT-4 Vision извлекает показатели</p>
              <div className="w-64">
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground/50 font-mono">
                  <span>Распознавание</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {uploadState === "error" && (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <Icon name="AlertCircle" size={28} className="text-red-400" />
              </div>
              <h3 className="text-red-400 font-semibold mb-1">Не удалось распознать</h3>
              <p className="text-muted-foreground text-sm mb-5">{errorMsg}</p>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm rounded-lg transition-all font-mono"
              >
                Попробовать снова
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {uploadState === "done" && result && (
        <div className="stagger-2 space-y-5">
          {/* Header */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 flex items-start gap-4">
            {previewUrl && (
              <img src={previewUrl} alt="preview" className="w-16 h-16 rounded-lg object-cover border border-border shrink-0" />
            )}
            {!previewUrl && (
              <div className="w-16 h-16 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                <Icon name="FileText" size={24} className="text-sky-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon name="CheckCircle" size={16} className="text-green-400" />
                <span className="text-sm font-semibold text-green-400">Успешно распознано</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">{fileName}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {result.date && <span><span className="text-muted-foreground/50">Дата:</span> {result.date}</span>}
                {result.lab && <span><span className="text-muted-foreground/50">Лаб.:</span> {result.lab}</span>}
                {result.patient && <span><span className="text-muted-foreground/50">Пациент:</span> {result.patient}</span>}
                <span><span className="text-muted-foreground/50">Показателей:</span> {result.results.length}</span>
              </div>
            </div>
            <button onClick={reset} className="text-muted-foreground hover:text-white transition-colors shrink-0">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "В норме", count: result.results.filter(r => r.status === "normal").length, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
              { label: "Выше нормы", count: result.results.filter(r => r.status === "high").length, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
              { label: "Ниже нормы", count: result.results.filter(r => r.status === "low").length, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.count}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Results table */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-3 px-4 py-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
              <span className="col-span-2">Показатель</span>
              <span>Значение</span>
              <span>Статус</span>
            </div>
            {result.results.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 gap-3 px-4 py-3.5 bg-card border rounded-xl transition-all hover:border-sky-500/30 ${
                  item.status === "high" ? "border-amber-500/20" :
                  item.status === "low" ? "border-red-500/20" : "border-border"
                }`}
              >
                <div className="col-span-2 flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    item.status === "normal" ? "bg-green-400" :
                    item.status === "high" ? "bg-amber-400" :
                    item.status === "low" ? "bg-red-400" : "bg-muted-foreground"
                  }`} />
                  <span className="text-sm text-white font-medium">{item.name}</span>
                </div>
                <div>
                  <span className="text-sm font-mono font-bold text-white">{item.value}</span>
                  <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                  {(item.normMin !== null || item.normMax !== null) && (
                    <div className="text-xs text-muted-foreground/50 font-mono">
                      {item.normMin ?? "—"}–{item.normMax ?? "—"}
                    </div>
                  )}
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${statusBg[item.status]} ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 flex-wrap">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2.5 border border-border hover:border-sky-500/30 text-muted-foreground hover:text-white text-sm rounded-xl transition-all font-mono"
            >
              <Icon name="Upload" size={15} />
              Загрузить другой
            </button>
            {!savedId ? (
              <button
                onClick={saveToHistory}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm rounded-xl transition-all font-mono disabled:opacity-60"
              >
                {saving
                  ? <><Icon name="Loader" size={15} className="animate-spin" /> Сохраняем...</>
                  : <><Icon name="Save" size={15} /> Сохранить в историю</>
                }
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl font-mono">
                <Icon name="CheckCircle" size={15} />
                Сохранено в историю
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      {uploadState === "idle" && (
        <div className="stagger-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: "Camera", title: "Фото бланка", desc: "Сфотографируйте бланк при хорошем освещении" },
            { icon: "ScanLine", title: "Скан/PDF", desc: "Загрузите PDF или скан из лаборатории" },
            { icon: "Zap", title: "Мгновенно", desc: "Результат готов за 10–30 секунд" },
          ].map((tip, i) => (
            <div key={i} className="flex gap-3 p-4 bg-card border border-border rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Icon name={tip.icon as "Camera"} size={15} className="text-sky-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{tip.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- HISTORY SECTION ---
interface StoredResult {
  id: string;
  name: string;
  value: number;
  unit: string;
  norm_min: number | null;
  norm_max: number | null;
  status: string;
}

interface StoredAnalysis {
  id: string;
  created_at: string;
  analysis_date: string | null;
  lab: string | null;
  patient: string | null;
  file_name: string | null;
  results: StoredResult[];
}

interface TrendPoint {
  date: string;
  value: number;
  unit: string;
  norm_min: number | null;
  norm_max: number | null;
  status: string;
}

function HistorySection({ refreshKey }: { refreshKey: number }) {
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trendIndicator, setTrendIndicator] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(HISTORY_URL);
      const data = await resp.json();
      setAnalyses(data.analyses || []);
    } catch {
      setAnalyses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory, refreshKey]);

  const loadTrend = async (name: string) => {
    setTrendIndicator(name);
    setTrendLoading(true);
    try {
      const resp = await fetch(`${HISTORY_URL}?indicator=${encodeURIComponent(name)}`);
      const data = await resp.json();
      setTrendData(data.points || []);
    } catch {
      setTrendData([]);
    } finally {
      setTrendLoading(false);
    }
  };

  // Collect all unique indicator names across all analyses
  const allIndicators = Array.from(
    new Set(analyses.flatMap(a => a.results.map(r => r.name)))
  ).sort();

  const statusDot = (s: string) => {
    if (s === "normal") return "bg-green-400";
    if (s === "high") return "bg-amber-400";
    if (s === "low") return "bg-red-400";
    return "bg-muted-foreground";
  };
  const statusText = (s: string) => {
    if (s === "normal") return "text-green-400";
    if (s === "high") return "text-amber-400";
    if (s === "low") return "text-red-400";
    return "text-muted-foreground";
  };

  const formatDate = (iso: string | null, created: string) => {
    const src = iso || created;
    try {
      return new Date(src).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return src; }
  };

  // Mini bar chart for trend
  const TrendChart = ({ points }: { points: TrendPoint[] }) => {
    if (points.length < 2) return (
      <p className="text-sm text-muted-foreground text-center py-4">Нужно минимум 2 анализа для графика</p>
    );
    const values = points.map(p => p.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;
    const normMin = points[0].norm_min;
    const normMax = points[0].norm_max;
    return (
      <div>
        <div className="flex items-end gap-2 h-28 px-2 mt-2">
          {points.map((p, i) => {
            const h = Math.max(10, ((p.value - minV) / range) * 100);
            const barColor = p.status === "normal" ? "bg-green-500/70 hover:bg-green-400"
              : p.status === "high" ? "bg-amber-500/70 hover:bg-amber-400"
              : "bg-red-500/70 hover:bg-red-400";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className={`text-xs font-mono ${statusText(p.status)}`}>{p.value}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                  <div
                    className={`w-full rounded-t-md transition-colors bar-animate ${barColor}`}
                    style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                    title={`${p.date}: ${p.value} ${p.unit}`}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-mono" style={{ fontSize: "10px" }}>
                  {new Date(p.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                </span>
              </div>
            );
          })}
        </div>
        {(normMin !== null || normMax !== null) && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 border-t border-dashed border-green-500/30" />
            <span className="text-green-400 font-mono">Норма: {normMin ?? "—"}–{normMax ?? "—"} {points[0].unit}</span>
            <div className="h-px flex-1 border-t border-dashed border-green-500/30" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="stagger-1 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">История анализов</h2>
          <p className="text-muted-foreground text-sm">
            {loading ? "Загрузка..." : analyses.length === 0 ? "Нет сохранённых анализов" : `${analyses.length} анализ${analyses.length === 1 ? "" : analyses.length < 5 ? "а" : "ов"} в базе`}
          </p>
        </div>
        <button
          onClick={loadHistory}
          className="flex items-center gap-2 px-3 py-1.5 border border-border hover:border-sky-500/30 text-muted-foreground hover:text-white text-sm rounded-lg transition-all font-mono"
        >
          <Icon name="RefreshCw" size={13} />
          Обновить
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3 stagger-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && analyses.length === 0 && (
        <div className="stagger-2 text-center py-16 text-muted-foreground">
          <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium mb-1">История пока пуста</p>
          <p className="text-xs opacity-60">Загрузите бланк анализа и нажмите «Сохранить в историю»</p>
        </div>
      )}

      {/* Trend picker — shown when 2+ analyses exist */}
      {!loading && analyses.length >= 2 && allIndicators.length > 0 && (
        <div className="stagger-2 bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="TrendingUp" size={16} className="text-sky-400" />
            <span className="text-sm font-semibold text-white">Динамика показателя</span>
            <span className="text-xs text-muted-foreground font-mono">выберите показатель для графика</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allIndicators.map(name => (
              <button
                key={name}
                onClick={() => loadTrend(name)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-mono ${
                  trendIndicator === name
                    ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
                    : "bg-secondary border-border text-muted-foreground hover:text-white hover:border-sky-500/30"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {trendIndicator && (
            <div className="pt-2">
              <p className="text-sm font-medium text-white mb-1">{trendIndicator}</p>
              {trendLoading
                ? <div className="h-28 bg-secondary rounded-xl animate-pulse" />
                : <TrendChart points={trendData} />
              }
            </div>
          )}
        </div>
      )}

      {/* Analyses list */}
      {!loading && analyses.length > 0 && (
        <div className="stagger-3 space-y-3">
          {analyses.map((a) => {
            const isOpen = expanded === a.id;
            const abnormal = a.results.filter(r => r.status !== "normal" && r.status !== "unknown");
            const dateLabel = formatDate(a.analysis_date, a.created_at);
            return (
              <div key={a.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-sky-500/20 transition-colors">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <Icon name="FileText" size={18} className="text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{dateLabel}</span>
                      {a.lab && <span className="text-xs text-muted-foreground font-mono">{a.lab}</span>}
                      {a.patient && <span className="text-xs text-sky-400/70 font-mono">{a.patient}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{a.results.length} показателей</span>
                      {abnormal.length > 0 && (
                        <span className="text-xs text-amber-400 font-mono">
                          {abnormal.length} вне нормы
                        </span>
                      )}
                      {a.file_name && (
                        <span className="text-xs text-muted-foreground/50 truncate max-w-32">{a.file_name}</span>
                      )}
                    </div>
                  </div>
                  {/* Status summary dots */}
                  <div className="flex items-center gap-1 shrink-0">
                    {a.results.slice(0, 6).map((r, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${statusDot(r.status)}`} title={r.name} />
                    ))}
                    {a.results.length > 6 && (
                      <span className="text-xs text-muted-foreground font-mono">+{a.results.length - 6}</span>
                    )}
                  </div>
                  <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0" />
                </button>

                {/* Expanded results */}
                {isOpen && (
                  <div className="border-t border-border px-5 pb-4 pt-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {a.results.map((r, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                            r.status === "high" ? "border-amber-500/20 bg-amber-500/5" :
                            r.status === "low" ? "border-red-500/20 bg-red-500/5" :
                            "border-border bg-secondary/30"
                          }`}
                        >
                          <span className="text-muted-foreground truncate mr-2">{r.name}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`font-mono font-bold ${statusText(r.status)}`}>{r.value}</span>
                            <span className="text-muted-foreground/50">{r.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {abnormal.length > 0 && (
                      <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                        <Icon name="AlertTriangle" size={14} className="text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-300/80">
                          Вне нормы: {abnormal.map(r => r.name).join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- NAV ---
const navItems = [
  { id: "upload", label: "Загрузить", icon: "Upload" },
  { id: "history", label: "История", icon: "ClipboardList" },
  { id: "charts", label: "Графики", icon: "BarChart2" },
  { id: "reference", label: "Справочник", icon: "BookOpen" },
  { id: "notifications", label: "Уведомления", icon: "Bell" },
  { id: "export", label: "Экспорт", icon: "Download" },
] as const;

// --- MAIN ---
export default function Index() {
  const [section, setSection] = useState<Section>("cover");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const handleSaved = useCallback(() => {
    setHistoryRefresh(k => k + 1);
    setTimeout(() => setSection("history"), 800);
  }, []);

  if (section === "cover") {
    return <CoverPage onStart={() => setSection("upload")} />;
  }

  return (
    <div className="min-h-screen grid-bg">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 flex items-center h-14 gap-4">
          <button
            onClick={() => setSection("cover")}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors shrink-0"
          >
            <Icon name="FlaskConical" size={18} />
            <span className="text-sm font-semibold font-mono hidden sm:block">ГемоАналит</span>
          </button>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id as Section)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all whitespace-nowrap ${
                  section === item.id
                    ? item.id === "upload"
                      ? "bg-sky-500 text-slate-900 font-semibold"
                      : "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                    : "text-muted-foreground hover:text-white hover:bg-secondary"
                }`}
              >
                <Icon name={item.icon as "BarChart2"} size={15} />
                <span className="hidden sm:block">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-pulse" />
            <span className="hidden md:block">17 апр 2026</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-6">
        {section === "upload" && <UploadSection onSaved={handleSaved} />}
        {section === "history" && <HistorySection refreshKey={historyRefresh} />}
        {section === "charts" && <ChartsSection />}
        {section === "reference" && <ReferenceSection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "export" && <ExportSection />}
      </main>
    </div>
  );
}