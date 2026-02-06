import { NextRequest, NextResponse } from "next/server";
import { fetchAllProducts, fetchCategories, fetchStockLocations } from "@/lib/ikas";
import { transformIkasProducts } from "@/lib/analysis";

// GET /api/products - Tüm ürünleri ikas'tan çek
export async function GET(request: NextRequest) {
  try {
    const [ikasProducts, categories, stockLocations] = await Promise.all([
      fetchAllProducts(),
      fetchCategories(),
      fetchStockLocations(),
    ]);

    const products = transformIkasProducts(ikasProducts, stockLocations);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      categories: categories,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Ürün çekme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        hint: "ikas API bilgilerinizi kontrol edin (.env.local)",
      },
      { status: 500 }
    );
  }
}
