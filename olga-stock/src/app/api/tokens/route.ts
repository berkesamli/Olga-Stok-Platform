import { NextRequest, NextResponse } from "next/server";
import {
  createAccessToken,
  listTokens,
  toggleToken,
  deleteToken,
  getShareLink,
} from "@/lib/auth";

// GET /api/tokens - Token listesi
export async function GET() {
  try {
    const tokens = listTokens();
    return NextResponse.json({ success: true, data: tokens });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Yeni token oluştur
export async function POST(request: NextRequest) {
  try {
    const { name, email, role } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "İsim ve e-posta gerekli." },
        { status: 400 }
      );
    }

    const token = createAccessToken(name, email, role || "viewer");
    const shareLink = getShareLink(token.token);

    return NextResponse.json({
      success: true,
      data: {
        id: token.id,
        name: token.name,
        email: token.email,
        role: token.role,
        shareLink,
        createdAt: token.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/tokens - Token toggle (aktif/deaktif)
export async function PATCH(request: NextRequest) {
  try {
    const { tokenId, action } = await request.json();

    if (action === "toggle") {
      const newState = toggleToken(tokenId);
      return NextResponse.json({
        success: true,
        active: newState,
        message: newState ? "Token aktif edildi." : "Token devre dışı bırakıldı.",
      });
    }

    if (action === "delete") {
      const deleted = deleteToken(tokenId);
      return NextResponse.json({
        success: deleted,
        message: deleted ? "Token silindi." : "Token bulunamadı.",
      });
    }

    return NextResponse.json(
      { success: false, error: "Geçersiz işlem." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
