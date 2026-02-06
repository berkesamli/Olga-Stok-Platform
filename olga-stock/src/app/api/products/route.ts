import { NextRequest, NextResponse } from "next/server";
import { fetchAllProducts, fetchCategories } from "@/lib/ikas";
import { transformIkasProducts } from "@/lib/analysis";

// GET /api/products - Tüm ürünleri ikas'tan çek
export async function GET(request: NextRequest) {
  try {
    const [ikasProducts, categories] = await Promise.all([
      fetchAllProducts(),
      fetchCategories(),
    ]);

    const products = transformIkasProducts(ikasProducts);

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
