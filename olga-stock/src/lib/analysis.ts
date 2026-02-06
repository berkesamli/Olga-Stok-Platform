// ─── Stock Analysis & Forecasting Engine ─────────────────────────────

export interface ProductStock {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  price: number;
  location: string;
  dailyUsage: number;
  trend: "rising" | "falling" | "stable";
  lastOrderDate: string;
}

export interface StockAlert {
  productId: string;
  productName: string;
  type: "critical" | "warning" | "out_of_stock";
  message: string;
  currentStock: number;
  minStock: number;
  daysUntilOut: number;
  suggestedOrderQty: number;
  estimatedCost: number;
}

export interface ConsumptionAnalysis {
  productId: string;
  productName: string;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyAverage: number;
  trend: "rising" | "falling" | "stable";
  trendPercentage: number;
}

// ─── Stock Status ────────────────────────────────────────────────────
export function getStockStatus(
  stock: number,
  minStock: number,
  dailyUsage: number
): "healthy" | "warning" | "critical" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock < minStock) return "critical";
  const daysLeft = dailyUsage > 0 ? Math.floor(stock / dailyUsage) : Infinity;
  if (daysLeft <= 7) return "warning";
  return "healthy";
}

// ─── Days Until Stock Out ────────────────────────────────────────────
export function getDaysUntilOut(stock: number, dailyUsage: number): number {
  if (dailyUsage <= 0) return 999;
  return Math.floor(stock / dailyUsage);
}

// ─── Calculate Daily Usage from Orders ───────────────────────────────
export function calculateDailyUsage(
  orders: Array<{ createdAt: number; quantity: number }>,
  periodDays: number = 30
): number {
  const now = Date.now();
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000;

  const periodOrders = orders.filter((o) => o.createdAt >= periodStart);
  const totalQty = periodOrders.reduce((sum, o) => sum + o.quantity, 0);

  return Number((totalQty / periodDays).toFixed(2));
}

// ─── Trend Analysis ──────────────────────────────────────────────────
export function analyzeTrend(
  recentUsage: number,
  previousUsage: number
): { trend: "rising" | "falling" | "stable"; percentage: number } {
  if (previousUsage === 0) return { trend: "stable", percentage: 0 };

  const change = ((recentUsage - previousUsage) / previousUsage) * 100;

  if (change > 10) return { trend: "rising", percentage: Number(change.toFixed(1)) };
  if (change < -10) return { trend: "falling", percentage: Number(change.toFixed(1)) };
  return { trend: "stable", percentage: Number(change.toFixed(1)) };
}

// ─── Generate Stock Alerts ───────────────────────────────────────────
export function generateAlerts(products: ProductStock[]): StockAlert[] {
  const alerts: StockAlert[] = [];

  for (const p of products) {
    const status = getStockStatus(p.currentStock, p.minStock, p.dailyUsage);
    const daysLeft = getDaysUntilOut(p.currentStock, p.dailyUsage);

    if (status === "out_of_stock" || status === "critical" || status === "warning") {
      // Önerilen sipariş: 30 günlük kullanım + emniyet stoku (min * 1.5)
      const suggestedQty = Math.max(
        Math.ceil(p.dailyUsage * 30) + p.minStock - p.currentStock,
        p.minStock * 2 - p.currentStock
      );

      alerts.push({
        productId: p.id,
        productName: p.name,
        type: status === "out_of_stock" ? "out_of_stock" : status,
        message:
          status === "out_of_stock"
            ? `${p.name} stokta yok! Acil sipariş gerekli.`
            : status === "critical"
            ? `${p.name} kritik seviyede: ${p.currentStock} ${p.unit} (min: ${p.minStock})`
            : `${p.name} ${daysLeft} gün içinde tükenecek.`,
        currentStock: p.currentStock,
        minStock: p.minStock,
        daysUntilOut: daysLeft,
        suggestedOrderQty: Math.max(suggestedQty, 0),
        estimatedCost: Math.max(suggestedQty, 0) * p.price,
      });
    }
  }

  // En kritik önce
  return alerts.sort((a, b) => a.daysUntilOut - b.daysUntilOut);
}

// ─── Order Suggestion ────────────────────────────────────────────────
export function generateOrderSuggestion(products: ProductStock[]): {
  items: Array<{
    product: ProductStock;
    orderQty: number;
    estimatedCost: number;
    reason: string;
  }>;
  totalCost: number;
} {
  const items: Array<{
    product: ProductStock;
    orderQty: number;
    estimatedCost: number;
    reason: string;
  }> = [];

  for (const p of products) {
    const daysLeft = getDaysUntilOut(p.currentStock, p.dailyUsage);
    const status = getStockStatus(p.currentStock, p.minStock, p.dailyUsage);

    if (status !== "healthy") {
      const targetStock = Math.ceil(p.dailyUsage * 30) + p.minStock;
      const orderQty = Math.max(targetStock - p.currentStock, 0);

      if (orderQty > 0) {
        let reason = "";
        if (status === "out_of_stock") reason = "Stokta yok - ACİL";
        else if (status === "critical") reason = `Minimum altında (${p.currentStock}/${p.minStock})`;
        else reason = `${daysLeft} gün sonra tükenecek`;

        items.push({
          product: p,
          orderQty,
          estimatedCost: orderQty * p.price,
          reason,
        });
      }
    }
  }

  return {
    items: items.sort((a, b) => {
      const priorityOrder = { out_of_stock: 0, critical: 1, warning: 2, healthy: 3 };
      const aStatus = getStockStatus(a.product.currentStock, a.product.minStock, a.product.dailyUsage);
      const bStatus = getStockStatus(b.product.currentStock, b.product.minStock, b.product.dailyUsage);
      return (priorityOrder[aStatus] || 3) - (priorityOrder[bStatus] || 3);
    }),
    totalCost: items.reduce((sum, i) => sum + i.estimatedCost, 0),
  };
}

// ─── Product Data Transformer (ikas -> internal format) ──────────────
export function transformIkasProducts(
  ikasProducts: any[],
  stockLocations?: any[]
): ProductStock[] {
  const locationMap = new Map<string, string>();
  if (stockLocations) {
    for (const loc of stockLocations) {
      locationMap.set(loc.id, loc.name);
    }
  }

  const results: ProductStock[] = [];

  for (const p of ikasProducts) {
    const variant = p.variants?.[0];
    const price = variant?.prices?.[0];
    const baseName = p.name || "İsimsiz Ürün";
    const baseSku = variant?.sku || "-";
    const category = p.categories?.[0]?.name || p.brand?.name || "Genel";
    const unit = p.baseUnit?.type === "METER" ? "metre" : "adet";
    const sellPrice = price?.sellPrice ?? 0;
    const lastOrderDate = p.createdAt
      ? new Date(p.createdAt).toISOString().split("T")[0]
      : "-";

    // Tüm variant'lardan lokasyon bazlı stok topla
    const stockByLocation = new Map<string, number>();
    for (const v of p.variants || []) {
      for (const s of v.stocks || []) {
        if (s.stockLocationId && s.stockCount > 0) {
          const current = stockByLocation.get(s.stockLocationId) || 0;
          stockByLocation.set(s.stockLocationId, current + s.stockCount);
        }
      }
    }

    if (stockByLocation.size > 0) {
      // Lokasyon bazlı ayrı satırlar oluştur
      stockByLocation.forEach((stock, locId) => {
        const locName = locationMap.get(locId) || locId;
        results.push({
          id: `${p.id}_${locId}`,
          name: baseName,
          sku: baseSku,
          category,
          currentStock: stock,
          minStock: 10,
          unit,
          price: sellPrice,
          location: locName,
          dailyUsage: 0,
          trend: "stable" as const,
          lastOrderDate,
        });
      });
    } else {
      // Stok lokasyonu yoksa toplam stok ile tek satır
      results.push({
        id: p.id,
        name: baseName,
        sku: baseSku,
        category,
        currentStock: p.totalStock ?? 0,
        minStock: 10,
        unit,
        price: sellPrice,
        location: "-",
        dailyUsage: 0,
        trend: "stable" as const,
        lastOrderDate,
      });
    }
  }

  return results;
}

// ─── Format Helpers ──────────────────────────────────────────────────
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(val);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}
