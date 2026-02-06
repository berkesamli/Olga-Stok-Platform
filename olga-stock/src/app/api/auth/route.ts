import { NextResponse } from "next/server";
import { testConnection } from "@/lib/ikas";

// GET /api/auth/test - ikas bağlantı testi
export async function GET() {
  const result = await testConnection();
  return NextResponse.json(result);
}
