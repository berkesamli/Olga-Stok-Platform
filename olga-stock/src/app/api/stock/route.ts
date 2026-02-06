import { NextRequest, NextResponse } from "next/server";
import { ikasGraphQL } from "@/lib/ikas";

// POST /api/stock - Stok güncelle (ikas'a yaz)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, stockLocationId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: "productId ve quantity gerekli." },
        { status: 400 }
      );
    }

    // ikas stok güncelleme mutation'ı
    const mutation = `mutation {
      updateStock(input: {
        productId: "${productId}"
        ${variantId ? `variantId: "${variantId}"` : ""}
        ${stockLocationId ? `stockLocationId: "${stockLocationId}"` : ""}
        stock: ${quantity}
      })
    }`;

    const result = await ikasGraphQL(mutation);

    return NextResponse.json({
      success: true,
      message: `Stok güncellendi: ${quantity} adet`,
      data: result,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Stok güncelleme hatası:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/stock - Stok lokasyonlarını çek
export async function GET() {
  try {
    const result = await ikasGraphQL(`{
      listStockLocation {
        id
        name
        isDefault
      }
    }`);

    return NextResponse.json({
      success: true,
      data: result.listStockLocation || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
