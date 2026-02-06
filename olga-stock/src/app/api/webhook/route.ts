import { NextRequest, NextResponse } from "next/server";

// ─── Webhook Handler ─────────────────────────────────────────────────
// ikas bu endpoint'e stok değişikliklerini push eder
// Scope'lar: store/product/updated, store/order/created, store/order/updated

// In-memory event log (production'da Supabase'e yazılmalı)
let webhookEvents: Array<{
  id: string;
  scope: string;
  data: any;
  receivedAt: string;
}> = [];

// POST /api/webhook - ikas'tan gelen webhook'ları işle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("[Webhook] Received:", JSON.stringify(body).slice(0, 200));

    const event = {
      id: `evt_${Date.now()}`,
      scope: body.scope || body.type || "unknown",
      data: body,
      receivedAt: new Date().toISOString(),
    };

    webhookEvents.unshift(event);

    // Son 100 event'i tut
    if (webhookEvents.length > 100) {
      webhookEvents = webhookEvents.slice(0, 100);
    }

    // Burada gerçek zamanlı işlemler yapılabilir:
    // - Stok değişikliği algıla
    // - Kritik stok uyarısı gönder
    // - Dashboard'u güncelle (WebSocket veya SSE ile)

    if (body.scope === "store/product/updated") {
      console.log(`[Webhook] Ürün güncellendi: ${body.data?.id}`);
      // TODO: Stok geçmişi tablosuna yaz
      // TODO: Minimum altına düştüyse bildirim gönder
    }

    if (body.scope === "store/order/created") {
      console.log(`[Webhook] Yeni sipariş: ${body.data?.orderNumber}`);
      // TODO: Sipariş detaylarından tüketim verilerini güncelle
    }

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error("[Webhook] Hata:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/webhook - Son webhook event'lerini listele
export async function GET() {
  return NextResponse.json({
    success: true,
    events: webhookEvents.slice(0, 20),
    total: webhookEvents.length,
  });
}
