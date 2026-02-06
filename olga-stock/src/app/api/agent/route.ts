import { NextRequest, NextResponse } from "next/server";
import { fetchAllProducts, fetchOrders } from "@/lib/ikas";
import {
  transformIkasProducts,
  generateAlerts,
  generateOrderSuggestion,
  getStockStatus,
  getDaysUntilOut,
  formatCurrency,
  ProductStock,
} from "@/lib/analysis";

// ─── AI Agent Endpoint ───────────────────────────────────────────────
// Doğal dil ile stok sorgulama, analiz ve öneriler

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Mesaj gerekli." },
        { status: 400 }
      );
    }

    // ikas'tan güncel veriyi çek
    let products;
    try {
      const ikasProducts = await fetchAllProducts();
      products = transformIkasProducts(ikasProducts);
    } catch {
      // ikas bağlantısı yoksa demo veri kullan
      products = getDemoProducts();
    }

    const alerts = generateAlerts(products);
    const orderSuggestion = generateOrderSuggestion(products);

    // Anthropic API varsa onu kullan, yoksa rule-based yanıt
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (anthropicKey && anthropicKey !== "your_anthropic_api_key_here") {
      const aiResponse = await callAnthropic(
        message,
        products,
        alerts,
        orderSuggestion,
        anthropicKey
      );
      return NextResponse.json({ success: true, response: aiResponse });
    }

    // Rule-based fallback
    const response = generateRuleBasedResponse(
      message,
      products,
      alerts,
      orderSuggestion
    );
    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error("Agent hatası:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ─── Anthropic Claude API Call ───────────────────────────────────────
async function callAnthropic(
  userMessage: string,
  products: any[],
  alerts: any[],
  orderSuggestion: any,
  apiKey: string
): Promise<string> {
  const systemPrompt = `Sen Olga Çerçeve Sanayi ve Ticaret firmasının stok yönetim asistanısın.
Görevin stok durumları hakkında bilgi vermek, tüketim analizi yapmak, sipariş önerileri sunmak.

GÜNCEL STOK VERİLERİ:
${JSON.stringify(
  products.map((p) => ({
    isim: p.name,
    sku: p.sku,
    stok: p.currentStock,
    minimum: p.minStock,
    birim: p.unit,
    fiyat: p.price,
    konum: p.location,
    günlükKullanım: p.dailyUsage,
    tükenmeGünü: getDaysUntilOut(p.currentStock, p.dailyUsage),
    durum: getStockStatus(p.currentStock, p.minStock, p.dailyUsage),
  })),
  null,
  2
)}

AKTİF UYARILAR: ${alerts.length} adet
SİPARİŞ ÖNERİSİ: ${orderSuggestion.items.length} ürün, toplam ${formatCurrency(orderSuggestion.totalCost)}

Yanıtlarını Türkçe ver, net ve öz tut. Sayısal verileri kullan. Emoji ile görselleştir.
Para birimi TRY. Birim boy (profiller için) veya adet.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API hatası: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "Yanıt oluşturulamadı.";
}

// ─── Rule-Based Response (Fallback) ──────────────────────────────────
function generateRuleBasedResponse(
  message: string,
  products: any[],
  alerts: any[],
  orderSuggestion: any
): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("kritik") ||
    lower.includes("azalan") ||
    lower.includes("biten")
  ) {
    if (alerts.length === 0)
      return "✅ Şu anda kritik seviyede ürün bulunmuyor.";
    return `⚠️ ${alerts.length} ürün dikkat gerektiriyor:\n\n${alerts
      .map(
        (a) =>
          `• **${a.productName}**: ${a.currentStock} adet (min: ${a.minStock}) — ${a.daysUntilOut} gün kaldı`
      )
      .join("\n")}`;
  }

  if (
    lower.includes("sipariş") ||
    lower.includes("öneri") ||
    lower.includes("ne sipariş")
  ) {
    const { items, totalCost } = orderSuggestion;
    if (items.length === 0) return "✅ Şu anda sipariş gereken ürün yok.";
    return `📋 Sipariş Önerisi:\n\n${items
      .map(
        (i: any) =>
          `• **${i.product.name}**: ${i.orderQty} ${i.product.unit} — ${formatCurrency(i.estimatedCost)}\n  Sebep: ${i.reason}`
      )
      .join("\n\n")}\n\n💰 Toplam: ${formatCurrency(totalCost)}`;
  }

  if (
    lower.includes("tüketim") ||
    lower.includes("hız") ||
    lower.includes("analiz")
  ) {
    const sorted = [...products].sort((a, b) => b.dailyUsage - a.dailyUsage);
    return `📊 Günlük Tüketim (En Yüksek):\n\n${sorted
      .slice(0, 6)
      .map(
        (p, i) =>
          `${i + 1}. **${p.name}**: ${p.dailyUsage} ${p.unit}/gün — ${getDaysUntilOut(p.currentStock, p.dailyUsage)} gün yeter`
      )
      .join("\n")}`;
  }

  if (lower.includes("merhaba") || lower.includes("selam")) {
    return `Merhaba! 👋 Olga Stok Asistanı'yım. Sorularınız:\n\n• "Kritik stoklar"\n• "Sipariş önerisi"\n• "Tüketim analizi"\n• Ürün adı ile sorgulama`;
  }

  // Ürün arama
  const found = products.find(
    (p) =>
      lower.includes(p.name.toLowerCase().split(" ")[0]) ||
      lower.includes(p.sku.toLowerCase())
  );
  if (found) {
    const status = getStockStatus(
      found.currentStock,
      found.minStock,
      found.dailyUsage
    );
    const emoji =
      status === "healthy" ? "🟢" : status === "warning" ? "🟡" : "🔴";
    return `${emoji} **${found.name}** (${found.sku})\n\n• Stok: ${found.currentStock} ${found.unit}\n• Min: ${found.minStock}\n• Günlük: ${found.dailyUsage} ${found.unit}/gün\n• Tükenme: ${getDaysUntilOut(found.currentStock, found.dailyUsage)} gün\n• Fiyat: ${formatCurrency(found.price)}\n• Konum: ${found.location}`;
  }

  return `Sorunuzu tam anlayamadım. Şunları deneyebilirsiniz:\n• "Kritik stoklar"\n• "Sipariş önerisi"\n• "Tüketim analizi"\n• Ürün adı ile sorgulama`;
}

// ─── Demo Products ───────────────────────────────────────────────────
function getDemoProducts(): ProductStock[] {
  return [
    { id: "P001", name: "Roma Profil 3cm Altın", sku: "RP-3-ALTIN", category: "Profil", currentStock: 245, minStock: 50, unit: "boy", dailyUsage: 8.2, price: 42.5, location: "Ankara", trend: "stable" as const, lastOrderDate: "2026-01-28" },
    { id: "P002", name: "Roma Profil 3cm Gümüş", sku: "RP-3-GUMUS", category: "Profil", currentStock: 18, minStock: 50, unit: "boy", dailyUsage: 6.5, price: 42.5, location: "Ankara", trend: "falling" as const, lastOrderDate: "2026-01-15" },
    { id: "P003", name: "Düz Profil 2cm Siyah", sku: "DP-2-SIYAH", category: "Profil", currentStock: 320, minStock: 40, unit: "boy", dailyUsage: 12.1, price: 28, location: "Ankara", trend: "rising" as const, lastOrderDate: "2026-02-01" },
    { id: "P004", name: "Paspartou Kartonu 70x100 Beyaz", sku: "PK-70100-B", category: "Karton", currentStock: 85, minStock: 100, unit: "adet", dailyUsage: 5.3, price: 18, location: "Ankara", trend: "falling" as const, lastOrderDate: "2026-01-20" },
    { id: "P007", name: "Antirefleks Cam 2mm 100x70", sku: "AC-2-10070", category: "Cam", currentStock: 8, minStock: 20, unit: "adet", dailyUsage: 1.8, price: 120, location: "Ankara", trend: "falling" as const, lastOrderDate: "2026-01-10" },
    { id: "P010", name: "Akrilik Levha 3mm Şeffaf", sku: "AL-3-SEFFAF", category: "Akrilik", currentStock: 5, minStock: 15, unit: "adet", dailyUsage: 1.2, price: 280, location: "Ankara", trend: "falling" as const, lastOrderDate: "2025-12-20" },
  ];
}
