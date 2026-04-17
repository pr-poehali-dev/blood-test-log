import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "cover" | "charts" | "reference" | "notifications" | "export";

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

const referenceItems = [
  { name: "Гемоглобин", male: "130–170 г/л", female: "120–150 г/л", role: "Перенос кислорода" },
  { name: "Эритроциты", male: "4.0–5.0 ×10¹²/л", female: "3.5–4.7 ×10¹²/л", role: "Красные клетки крови" },
  { name: "Лейкоциты", male: "4.0–9.0 ×10⁹/л", female: "4.0–9.0 ×10⁹/л", role: "Иммунная защита" },
  { name: "Тромбоциты", male: "180–320 ×10⁹/л", female: "180–320 ×10⁹/л", role: "Свёртывание крови" },
  { name: "Нейтрофилы", male: "47–72%", female: "47–72%", role: "Борьба с бактериями" },
  { name: "Лимфоциты", male: "19–37%", female: "19–37%", role: "Клеточный иммунитет" },
  { name: "Моноциты", male: "3–11%", female: "3–11%", role: "Фагоцитоз" },
  { name: "СОЭ", male: "до 15 мм/ч", female: "до 20 мм/ч", role: "Маркер воспаления" },
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
  const [search, setSearch] = useState("");
  const filtered = referenceItems.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="stagger-1">
        <h2 className="text-2xl font-bold text-white mb-1">Справочник норм</h2>
        <p className="text-muted-foreground text-sm">Референсные значения показателей крови</p>
      </div>

      <div className="relative stagger-2">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Поиск по показателям..."
          className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all placeholder:text-muted-foreground/50 font-mono text-foreground"
        />
      </div>

      <div className="space-y-2 stagger-3">
        <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs text-muted-foreground font-mono uppercase tracking-wider">
          <span>Показатель</span>
          <span>Мужчины</span>
          <span>Женщины</span>
          <span>Функция</span>
        </div>

        {filtered.map((item, i) => (
          <div
            key={item.name}
            className="grid grid-cols-4 gap-4 px-4 py-3 bg-card border border-border rounded-xl hover:border-sky-500/30 hover:bg-card/80 transition-all"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
              <span className="text-sm font-medium text-white">{item.name}</span>
            </div>
            <span className="text-sm font-mono text-blue-300 self-center">{item.male}</span>
            <span className="text-sm font-mono text-pink-300 self-center">{item.female}</span>
            <span className="text-sm text-muted-foreground self-center">{item.role}</span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="SearchX" size={32} className="mx-auto mb-2 opacity-30" />
            <p>Ничего не найдено по запросу «{search}»</p>
          </div>
        )}
      </div>

      <div className="stagger-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 flex gap-3">
        <Icon name="Info" size={16} className="text-sky-400 mt-0.5 shrink-0" />
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

// --- NAV ---
const navItems = [
  { id: "charts", label: "Графики", icon: "BarChart2" },
  { id: "reference", label: "Справочник", icon: "BookOpen" },
  { id: "notifications", label: "Уведомления", icon: "Bell" },
  { id: "export", label: "Экспорт", icon: "Download" },
] as const;

// --- MAIN ---
export default function Index() {
  const [section, setSection] = useState<Section>("cover");

  if (section === "cover") {
    return <CoverPage onStart={() => setSection("charts")} />;
  }

  return (
    <div className="min-h-screen grid-bg">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 flex items-center h-14 gap-6">
          <button
            onClick={() => setSection("cover")}
            className="flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors shrink-0"
          >
            <Icon name="FlaskConical" size={18} />
            <span className="text-sm font-semibold font-mono hidden sm:block">ГемоАналит</span>
          </button>
          <div className="w-px h-5 bg-border shrink-0" />
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id as Section)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  section === item.id
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
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
        {section === "charts" && <ChartsSection />}
        {section === "reference" && <ReferenceSection />}
        {section === "notifications" && <NotificationsSection />}
        {section === "export" && <ExportSection />}
      </main>
    </div>
  );
}
