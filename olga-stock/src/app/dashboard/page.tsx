"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// ─── Types ───────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  dailyUsage: number;
  price: number;
  location: string;
  trend: string;
  lastOrderDate: string;
}

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

// ─── Demo Data ───────────────────────────────────────────────────────
const DEMO_PRODUCTS: Product[] = [
  { id: "P001", name: "Roma Profil 3cm Altın", sku: "RP-3-ALTIN", category: "Profil", currentStock: 245, minStock: 50, unit: "boy", dailyUsage: 8.2, price: 42.5, location: "Ankara", trend: "stable", lastOrderDate: "2026-01-28" },
  { id: "P002", name: "Roma Profil 3cm Gümüş", sku: "RP-3-GUMUS", category: "Profil", currentStock: 18, minStock: 50, unit: "boy", dailyUsage: 6.5, price: 42.5, location: "Ankara", trend: "falling", lastOrderDate: "2026-01-15" },
  { id: "P003", name: "Düz Profil 2cm Siyah", sku: "DP-2-SIYAH", category: "Profil", currentStock: 320, minStock: 40, unit: "boy", dailyUsage: 12.1, price: 28, location: "Ankara", trend: "rising", lastOrderDate: "2026-02-01" },
  { id: "P004", name: "Paspartou Kartonu 70x100 Beyaz", sku: "PK-70100-B", category: "Karton", currentStock: 85, minStock: 100, unit: "adet", dailyUsage: 5.3, price: 18, location: "Ankara", trend: "falling", lastOrderDate: "2026-01-20" },
  { id: "P005", name: "Paspartou Kartonu 70x100 Krem", sku: "PK-70100-K", category: "Karton", currentStock: 210, minStock: 100, unit: "adet", dailyUsage: 3.8, price: 18, location: "İstanbul", trend: "stable", lastOrderDate: "2026-02-03" },
  { id: "P006", name: "Müze Camı 2mm 100x70", sku: "MC-2-10070", category: "Cam", currentStock: 42, minStock: 30, unit: "adet", dailyUsage: 2.1, price: 95, location: "Ankara", trend: "stable", lastOrderDate: "2026-01-25" },
  { id: "P007", name: "Antirefleks Cam 2mm 100x70", sku: "AC-2-10070", category: "Cam", currentStock: 8, minStock: 20, unit: "adet", dailyUsage: 1.8, price: 120, location: "Ankara", trend: "falling", lastOrderDate: "2026-01-10" },
  { id: "P008", name: "MDF Arkalık 3mm 70x100", sku: "MDF-3-70100", category: "Arkalık", currentStock: 450, minStock: 100, unit: "adet", dailyUsage: 7.0, price: 12, location: "İstanbul", trend: "stable", lastOrderDate: "2026-02-04" },
  { id: "P009", name: "Roma Profil 5cm Ceviz", sku: "RP-5-CEVIZ", category: "Profil", currentStock: 62, minStock: 30, unit: "boy", dailyUsage: 4.2, price: 68, location: "Ankara", trend: "rising", lastOrderDate: "2026-01-30" },
  { id: "P010", name: "Akrilik Levha 3mm Şeffaf", sku: "AL-3-SEFFAF", category: "Akrilik", currentStock: 5, minStock: 15, unit: "adet", dailyUsage: 1.2, price: 280, location: "Ankara", trend: "falling", lastOrderDate: "2025-12-20" },
  { id: "P011", name: "Askı Aparatı D-Ring", sku: "AA-DRING", category: "Aksesuar", currentStock: 1200, minStock: 200, unit: "adet", dailyUsage: 25, price: 1.5, location: "Ankara", trend: "stable", lastOrderDate: "2026-02-01" },
  { id: "P012", name: "Kumaş Paspartou 50x70 Keten", sku: "KP-5070-KTN", category: "Karton", currentStock: 35, minStock: 25, unit: "adet", dailyUsage: 1.5, price: 45, location: "İstanbul", trend: "stable", lastOrderDate: "2026-01-22" },
];

// ─── Helpers ─────────────────────────────────────────────────────────
const fmt = (val: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(val);
const daysLeft = (stock: number, usage: number) => usage > 0 ? Math.floor(stock / usage) : 999;
const stockStatus = (p: Product) => {
  if (p.currentStock <= 0) return "out";
  if (p.currentStock < p.minStock) return "critical";
  if (daysLeft(p.currentStock, p.dailyUsage) <= 7) return "warning";
  return "healthy";
};

// ─── Icons ───────────────────────────────────────────────────────────
const Icon = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  box: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  bot: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  key: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  cog: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  send: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  alert: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  refresh: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  link: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  up: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  down: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ─── Shared Styles ───────────────────────────────────────────────────
const S = {
  card: "bg-[#12131a] border border-[#1e2030] rounded-xl p-5",
  btn: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#1e2030] text-[#e2e4f0] hover:bg-[#1a1b25] transition-all cursor-pointer",
  btnPrimary: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#6366f1] text-white border-none hover:bg-[#818cf8] transition-all cursor-pointer",
  input: "w-full px-3 py-2.5 bg-[#0a0b0f] border border-[#1e2030] rounded-lg text-sm text-[#e2e4f0] outline-none focus:border-[#3b4070] transition-colors",
  label: "block text-xs font-semibold text-[#6b7094] mb-1.5 uppercase tracking-wider",
  badge: (status: string) => {
    const colors: Record<string, string> = {
      healthy: "bg-emerald-500/10 text-emerald-400",
      warning: "bg-amber-500/10 text-amber-400",
      critical: "bg-red-500/10 text-red-400",
      out: "bg-red-500/10 text-red-400",
    };
    return `inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[status] || colors.healthy}`;
  },
};

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ═══════════════════════════════════════════════════════════════════════
function DashboardContent() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const token = searchParams.get("token");

  const [view, setView] = useState<"dashboard" | "inventory" | "agent" | "tokens" | "settings">("dashboard");
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleString("tr-TR"));
  const [isConnected, setIsConnected] = useState(isDemo);

  // Fetch products from ikas on mount (if not demo)
  useEffect(() => {
    if (!isDemo) {
      fetchProducts();
    }
  }, [isDemo]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setProducts(data.data);
        setIsConnected(true);
      }
    } catch (e) {
      console.log("ikas bağlantısı kurulamadı, demo veri kullanılıyor.");
    }
    setLastSync(new Date().toLocaleString("tr-TR"));
    setLoading(false);
  };

  const navItems = [
    { key: "dashboard" as const, label: "Genel Bakış", icon: Icon.dashboard },
    { key: "inventory" as const, label: "Stok Yönetimi", icon: Icon.box },
    { key: "agent" as const, label: "AI Asistan", icon: Icon.bot },
    { key: "tokens" as const, label: "Erişim & Token", icon: Icon.key },
    { key: "settings" as const, label: "Ayarlar", icon: Icon.cog },
  ];

  const titles: Record<string, string> = {
    dashboard: "Genel Bakış",
    inventory: "Stok Yönetimi",
    agent: "AI Stok Asistanı",
    tokens: "Erişim Yönetimi",
    settings: "Ayarlar & Entegrasyon",
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ─── Sidebar ─── */}
      <aside className="w-[220px] bg-[#12131a] border-r border-[#1e2030] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#1e2030]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#818cf8] flex items-center justify-center text-white font-bold text-sm">O</div>
            <div>
              <div className="text-sm font-bold tracking-tight">Olga Stok</div>
              <div className="text-[10px] text-[#6b7094]">{isDemo ? "Demo Modu" : "ikas Entegrasyonu"}</div>
            </div>
          </div>
        </div>
        <nav className="p-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] mb-0.5 transition-all ${
                view === item.key
                  ? "bg-[rgba(99,102,241,0.15)] border border-[#3b4070] font-semibold text-[#e2e4f0]"
                  : "border border-transparent text-[#6b7094] hover:text-[#e2e4f0] hover:bg-[#1a1b25]"
              }`}
            >
              {item.icon}
              {item.label}
              {item.key === "agent" && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#1e2030] text-[10px] text-[#6b7094]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-red-400"}`} />
            {isConnected ? "ikas Bağlı" : "Bağlantı Yok"}
          </div>
          <div>Son: {lastSync}</div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-3 border-b border-[#1e2030] bg-[#12131a] flex justify-between items-center">
          <h1 className="text-base font-bold tracking-tight">{titles[view]}</h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchProducts} className={S.btn} disabled={loading}>
              {Icon.refresh}
              {loading ? "Yükleniyor..." : "Senkronize Et"}
            </button>
            {isDemo && (
              <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-[10px] font-semibold">DEMO</span>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {view === "dashboard" && <DashboardView products={products} />}
          {view === "inventory" && <InventoryView products={products} setProducts={setProducts} />}
          {view === "agent" && <AgentView products={products} />}
          {view === "tokens" && <TokensView />}
          {view === "settings" && <SettingsView onConnect={fetchProducts} />}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW: Dashboard
// ═══════════════════════════════════════════════════════════════════════
function DashboardView({ products }: { products: Product[] }) {
  const critical = products.filter(p => stockStatus(p) === "critical" || stockStatus(p) === "out");
  const warning = products.filter(p => stockStatus(p) === "warning");
  const totalValue = products.reduce((s, p) => s + p.currentStock * p.price, 0);
  const avgDays = Math.round(products.reduce((s, p) => s + daysLeft(p.currentStock, p.dailyUsage), 0) / products.length);

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { title: "Toplam Ürün", value: products.length, sub: "Tüm lokasyonlar", color: "" },
          { title: "Kritik Stok", value: critical.length, sub: `${warning.length} uyarı`, color: critical.length > 0 ? "text-red-400" : "text-emerald-400" },
          { title: "Stok Değeri", value: fmt(totalValue), sub: "Tüm ürünler", color: "text-[#818cf8]" },
          { title: "Ort. Yetecek Süre", value: `${avgDays} gün`, sub: "Tüm ürünler ort.", color: "" },
        ].map((card, i) => (
          <div key={i} className={S.card}>
            <div className="text-[11px] font-semibold text-[#6b7094] uppercase tracking-wider mb-2">{card.title}</div>
            <div className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.value}</div>
            <div className="text-xs text-[#6b7094] mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {critical.length > 0 && (
        <div className={`${S.card} border-red-500/30 mb-6`}>
          <div className="flex items-center gap-2 mb-4 text-red-400 font-semibold text-sm">{Icon.alert} Acil Sipariş Gerekli</div>
          {critical.map(p => (
            <div key={p.id} className="flex justify-between items-center py-2.5 border-b border-[#1e2030] last:border-0">
              <div>
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-[#6b7094]">{p.currentStock} {p.unit} kaldı — {daysLeft(p.currentStock, p.dailyUsage)} gün yeter</div>
              </div>
              <span className={S.badge("critical")}>Kritik</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className={S.card}>
          <div className="text-[11px] font-semibold text-[#6b7094] uppercase tracking-wider mb-4">Kategori Durumu</div>
          {["Profil", "Karton", "Cam", "Akrilik", "Arkalık", "Aksesuar"].map(cat => {
            const catP = products.filter(p => p.category === cat);
            if (!catP.length) return null;
            const healthy = catP.filter(p => stockStatus(p) === "healthy").length;
            const pct = Math.round((healthy / catP.length) * 100);
            return (
              <div key={cat} className="flex items-center gap-3 py-2 border-b border-[#1e2030] last:border-0">
                <span className="w-16 text-xs font-medium">{cat}</span>
                <div className="flex-1 h-1.5 bg-[#1e2030] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-400" : pct > 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] text-[#6b7094] w-12 text-right">{healthy}/{catP.length}</span>
              </div>
            );
          })}
        </div>
        <div className={S.card}>
          <div className="text-[11px] font-semibold text-[#6b7094] uppercase tracking-wider mb-4">En Hızlı Tükenen</div>
          {[...products].sort((a, b) => daysLeft(a.currentStock, a.dailyUsage) - daysLeft(b.currentStock, b.dailyUsage)).slice(0, 6).map((p, i) => (
            <div key={p.id} className="flex justify-between items-center py-2 border-b border-[#1e2030] last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6b7094] w-4">{i + 1}.</span>
                <span className="text-xs font-medium">{p.name}</span>
              </div>
              <span className={`text-xs font-semibold ${daysLeft(p.currentStock, p.dailyUsage) <= 7 ? "text-red-400" : daysLeft(p.currentStock, p.dailyUsage) <= 14 ? "text-amber-400" : "text-[#6b7094]"}`}>
                {daysLeft(p.currentStock, p.dailyUsage)}g
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW: Inventory
// ═══════════════════════════════════════════════════════════════════════
function InventoryView({ products, setProducts }: { products: Product[]; setProducts: (fn: any) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  const filtered = products.filter(p => {
    const match = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return match;
    if (filter === "critical") return match && (stockStatus(p) === "critical" || stockStatus(p) === "out");
    if (filter === "warning") return match && stockStatus(p) === "warning";
    if (filter === "ankara") return match && p.location === "Ankara";
    if (filter === "istanbul") return match && p.location === "İstanbul";
    return match;
  });

  const saveStock = async (p: Product) => {
    const newVal = Number(editVal);
    if (isNaN(newVal)) return;
    setProducts((prev: Product[]) => prev.map((x: Product) => x.id === p.id ? { ...x, currentStock: newVal } : x));
    // API call to sync with ikas
    try {
      await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: p.id, quantity: newVal }),
      });
    } catch (e) { /* demo mode */ }
    setEditId(null);
  };

  const filters = [
    { key: "all", label: "Tümü" },
    { key: "critical", label: "🔴 Kritik" },
    { key: "warning", label: "🟡 Uyarı" },
    { key: "ankara", label: "📍 Ankara" },
    { key: "istanbul", label: "📍 İstanbul" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filter === f.key ? S.btnPrimary : S.btn}>{f.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-2 bg-[#12131a] border border-[#1e2030] rounded-lg px-3 py-2 mb-4">
        {Icon.search}
        <input className="flex-1 bg-transparent border-none text-sm text-[#e2e4f0] outline-none" placeholder="Ürün adı veya SKU ile ara..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className={`${S.card} !p-0 overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {["Ürün", "SKU", "Stok", "Durum", "Günlük", "Kalan", "Trend", "Konum", ""].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[11px] font-semibold text-[#6b7094] uppercase tracking-wider border-b border-[#1e2030]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const status = stockStatus(p);
                const days = daysLeft(p.currentStock, p.dailyUsage);
                return (
                  <tr key={p.id} className="hover:bg-[#1a1b25] transition-colors">
                    <td className="px-3 py-3 text-sm font-medium border-b border-[#1e2030]">{p.name}</td>
                    <td className="px-3 py-3 text-xs text-[#6b7094] font-mono border-b border-[#1e2030]">{p.sku}</td>
                    <td className="px-3 py-3 border-b border-[#1e2030]">
                      {editId === p.id ? (
                        <div className="flex gap-1">
                          <input className="w-16 px-1.5 py-1 bg-[#0a0b0f] border border-[#3b4070] rounded text-xs text-white" value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => e.key === "Enter" && saveStock(p)} autoFocus />
                          <button onClick={() => saveStock(p)} className="text-emerald-400 text-xs">✓</button>
                          <button onClick={() => setEditId(null)} className="text-red-400 text-xs">✕</button>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold">{p.currentStock} <span className="text-xs text-[#6b7094] font-normal">{p.unit}</span></span>
                      )}
                    </td>
                    <td className="px-3 py-3 border-b border-[#1e2030]">
                      <span className={S.badge(status)}>{status === "healthy" ? "İyi" : status === "warning" ? "Uyarı" : "Kritik"}</span>
                    </td>
                    <td className="px-3 py-3 text-xs text-[#6b7094] border-b border-[#1e2030]">{p.dailyUsage} {p.unit}/g</td>
                    <td className={`px-3 py-3 text-sm font-semibold border-b border-[#1e2030] ${days <= 7 ? "text-red-400" : days <= 14 ? "text-amber-400" : ""}`}>{days === 999 ? "∞" : `${days}g`}</td>
                    <td className="px-3 py-3 border-b border-[#1e2030]">
                      <span className={p.trend === "rising" ? "text-emerald-400" : p.trend === "falling" ? "text-red-400" : "text-[#6b7094]"}>
                        {p.trend === "rising" ? Icon.up : p.trend === "falling" ? Icon.down : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs border-b border-[#1e2030]">{p.location}</td>
                    <td className="px-3 py-3 border-b border-[#1e2030]">
                      <button onClick={() => { setEditId(p.id); setEditVal(String(p.currentStock)); }} className={S.btn + " !py-1 !px-2"}>{Icon.edit}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW: AI Agent
// ═══════════════════════════════════════════════════════════════════════
function AgentView({ products }: { products: Product[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "agent", text: "Merhaba! 👋 Olga Stok Asistanı'yım. ikas verilerinize bağlıyım.\n\nBirkaç örnek:\n• \"Kritik stoklar neler?\"\n• \"Sipariş önerisi ver\"\n• \"Tüketim analizi\"\n• Ürün adı ile sorgulama" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const quickQ = ["Kritik stoklar neler?", "Sipariş önerisi ver", "Tüketim analizi", "Profil stokları", "İstanbul deposu"];
  const ref = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "agent", text: data.response || "Yanıt alınamadı." }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", text: "Bağlantı hatası. Tekrar deneyin." }]);
    }
    setTyping(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      <div className="flex gap-1.5 flex-wrap mb-3">
        {quickQ.map(q => (
          <button key={q} onClick={() => send(q)} className={S.btn + " !text-[11px]"}>{q}</button>
        ))}
      </div>
      <div className="flex-1 overflow-auto py-3" ref={ref}>
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-4 py-3 rounded-xl mb-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
            m.role === "user"
              ? "ml-auto bg-[#6366f1] text-white"
              : "mr-auto bg-[#12131a] border border-[#1e2030] text-[#e2e4f0]"
          }`}>
            {m.role === "agent" && <div className="text-[10px] font-semibold text-[#6366f1] mb-1.5 uppercase tracking-wider">🤖 Stok Asistanı</div>}
            {m.text.split("\n").map((line, j) => (
              <div key={j} style={{ minHeight: line === "" ? 6 : "auto" }}>
                {line.replace(/\*\*(.*?)\*\*/g, "«$1»").split("«").map((part, k) => {
                  if (part.includes("»")) {
                    const [bold, rest] = part.split("»");
                    return <span key={k}><strong>{bold}</strong>{rest}</span>;
                  }
                  return <span key={k}>{part}</span>;
                })}
              </div>
            ))}
          </div>
        ))}
        {typing && (
          <div className="mr-auto bg-[#12131a] border border-[#1e2030] px-4 py-3 rounded-xl">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#6b7094]" style={{ animation: `pulse-dot 1s ease-in-out ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={chatEnd} />
      </div>
      <div className="flex gap-2 pt-4 border-t border-[#1e2030]">
        <input
          className={S.input + " !flex-1"}
          placeholder="Stok hakkında bir şey sorun..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
        />
        <button onClick={() => send(input)} className={S.btnPrimary}>{Icon.send} Gönder</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW: Tokens
// ═══════════════════════════════════════════════════════════════════════
function TokensView() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("viewer");
  const [createdLink, setCreatedLink] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/tokens").then(r => r.json()).then(d => { if (d.success) setTokens(d.data); });
  }, []);

  const createToken = async () => {
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, email: newEmail, role: newRole }),
    });
    const data = await res.json();
    if (data.success) {
      setCreatedLink(data.data.shareLink);
      setTokens(prev => [...prev, data.data]);
      setNewName(""); setNewEmail("");
    }
  };

  const toggleActive = async (id: string) => {
    await fetch("/api/tokens", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: id, action: "toggle" }),
    });
    setTokens(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h3 className="text-sm font-bold">Erişim Tokenları & Paylaşım</h3>
          <p className="text-xs text-[#6b7094] mt-1">Token oluşturup link paylaşarak stok görüntüleme yetkisi verin.</p>
        </div>
        <button onClick={() => setShowNew(true)} className={S.btnPrimary}>+ Yeni Token</button>
      </div>

      {tokens.map(t => (
        <div key={t.id} className={`${S.card} flex justify-between items-center mb-3 ${t.active === false ? "opacity-50" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(99,102,241,0.15)] flex items-center justify-center text-[#6366f1] font-bold text-sm">{t.name?.charAt(0)}</div>
            <div>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-[11px] text-[#6b7094]">{t.email}</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${t.role === "admin" ? "bg-[rgba(99,102,241,0.15)] text-[#6366f1]" : "bg-emerald-500/10 text-emerald-400"}`}>{t.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/dashboard?token=sample`); setCopied(t.id); setTimeout(() => setCopied(""), 2000); }} className={S.btn}>
              {copied === t.id ? "✓ Kopyalandı" : <>{Icon.link} Link</>}
            </button>
            <button onClick={() => toggleActive(t.id)} className={`${S.btn} ${t.active !== false ? "!text-red-400 !border-red-500/20" : ""}`}>
              {t.active !== false ? "Devre Dışı" : "Aktif Et"}
            </button>
          </div>
        </div>
      ))}

      {/* API Info */}
      <div className={`${S.card} mt-6`}>
        <div className="text-[11px] font-semibold text-[#6b7094] uppercase tracking-wider mb-3">API Entegrasyon</div>
        <div className="mb-3">
          <div className="text-xs text-[#6b7094] mb-1">ikas GraphQL Endpoint</div>
          <code className="block px-3 py-2 bg-[#0a0b0f] rounded text-xs font-mono text-[#818cf8]">https://api.myikas.com/api/v1/admin/graphql</code>
        </div>
        <div>
          <div className="text-xs text-[#6b7094] mb-1">Gerekli Scope&apos;lar</div>
          <div className="flex gap-1.5 flex-wrap">
            {["product:read", "product:write", "stock:read", "stock:write", "order:read"].map(s => (
              <code key={s} className="px-2 py-0.5 bg-[#0a0b0f] rounded text-[11px] font-mono text-[#6366f1]">{s}</code>
            ))}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => { setShowNew(false); setCreatedLink(""); }}>
          <div className={`${S.card} !w-[440px]`} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-5">Yeni Erişim Tokeni</h3>
            {!createdLink ? (
              <>
                <div className="mb-3">
                  <label className={S.label}>İsim</label>
                  <input className={S.input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Kişi veya açıklama" />
                </div>
                <div className="mb-3">
                  <label className={S.label}>E-posta</label>
                  <input className={S.input} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="ornek@email.com" />
                </div>
                <div className="mb-5">
                  <label className={S.label}>Yetki</label>
                  <select className={S.input} value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="viewer">Sadece Görüntüleme</option>
                    <option value="admin">Tam Yetki (Admin)</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNew(false)} className={S.btn}>İptal</button>
                  <button onClick={createToken} disabled={!newName || !newEmail} className={S.btnPrimary} style={{ opacity: !newName || !newEmail ? 0.5 : 1 }}>Oluştur</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-emerald-400 mb-3">✓ Token oluşturuldu!</p>
                <label className={S.label}>Paylaşım Linki</label>
                <div className="flex gap-2">
                  <input className={S.input + " !font-mono !text-xs"} value={createdLink} readOnly />
                  <button onClick={() => navigator.clipboard?.writeText(createdLink)} className={S.btnPrimary}>Kopyala</button>
                </div>
                <p className="text-[11px] text-[#6b7094] mt-3">Bu linki paylaştığınız kişi stok durumunu görebilecek.</p>
                <button onClick={() => { setShowNew(false); setCreatedLink(""); }} className={S.btn + " mt-4 w-full justify-center"}>Kapat</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VIEW: Settings
// ═══════════════════════════════════════════════════════════════════════
function SettingsView({ onConnect }: { onConnect: () => void }) {
  const [storeName, setStoreName] = useState("olgacerceve");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testConn = async () => {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      setResult(data);
      if (data.success) onConnect();
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    }
    setTesting(false);
  };

  return (
    <div className="animate-fade-in max-w-xl">
      <div className={S.card}>
        <h3 className="text-sm font-bold mb-1">ikas API Bağlantısı</h3>
        <p className="text-xs text-[#6b7094] mb-5">ikas panelinden özel uygulama oluşturup API bilgilerini girin.</p>

        <div className="mb-3">
          <label className={S.label}>Mağaza Adı</label>
          <input className={S.input} value={storeName} onChange={e => setStoreName(e.target.value)} />
          <p className="text-[11px] text-[#6b7094] mt-1">→ https://{storeName}.myikas.com</p>
        </div>
        <div className="mb-3">
          <label className={S.label}>Client ID</label>
          <input className={S.input} value={clientId} onChange={e => setClientId(e.target.value)} placeholder="ikas Client ID" />
        </div>
        <div className="mb-5">
          <label className={S.label}>Client Secret</label>
          <input className={S.input} type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="ikas Client Secret" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={testConn} className={S.btnPrimary} disabled={testing}>
            {testing ? "Test ediliyor..." : "Bağlan & Test Et"}
          </button>
          {result && (
            <span className={`text-xs font-medium ${result.success ? "text-emerald-400" : "text-red-400"}`}>{result.message}</span>
          )}
        </div>
      </div>

      <div className={`${S.card} mt-4`}>
        <h3 className="text-sm font-bold mb-1">Nasıl Bağlanılır?</h3>
        <ol className="text-xs text-[#6b7094] space-y-2 mt-3 list-decimal list-inside">
          <li>ikas paneline giriş yapın → <strong>Ayarlar → Uygulamalar</strong></li>
          <li><strong>Özel Uygulama Oluştur</strong> butonuna tıklayın</li>
          <li>Uygulama adı girin (ör: &quot;Olga Stok&quot;)</li>
          <li>İzinler kısmında şunları seçin: <strong>Ürünleri görüntüle, Ürünleri düzenle, Stokları görüntüle, Stokları düzenle, Siparişleri görüntüle</strong></li>
          <li>Kaydedin → <strong>Client ID</strong> ve <strong>Client Secret</strong> oluşturulacak</li>
          <li>Bu bilgileri yukarıdaki alanlara girin</li>
        </ol>
      </div>

      <div className={`${S.card} mt-4`}>
        <h3 className="text-sm font-bold mb-1">Webhook Kurulumu</h3>
        <p className="text-xs text-[#6b7094] mb-3">Gerçek zamanlı stok güncellemeleri için webhook URL&apos;i:</p>
        <code className="block px-3 py-2 bg-[#0a0b0f] rounded text-xs font-mono text-[#818cf8]">
          https://your-app.vercel.app/api/webhook
        </code>
        <div className="mt-3 text-xs text-[#6b7094]">
          <div className="flex items-center gap-2 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> store/product/updated</div>
          <div className="flex items-center gap-2 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> store/order/created</div>
          <div className="flex items-center gap-2 py-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> store/order/updated</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Export with Suspense boundary for useSearchParams
// ═══════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-[#0a0b0f] text-[#6b7094]">
        Yükleniyor...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
