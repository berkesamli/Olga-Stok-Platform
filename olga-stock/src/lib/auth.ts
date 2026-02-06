import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────
export interface TokenPayload {
  tokenId: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  iat?: number;
  exp?: number;
}

export interface AccessToken {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
  active: boolean;
  token: string;
  createdAt: string;
  lastUsedAt: string;
}

// ─── In-Memory Token Store (Supabase'e geçirilebilir) ────────────────
// Production'da bu veriyi Supabase/PostgreSQL'de tutmalısınız
let tokenStore: AccessToken[] = [];

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tanımlanmamış");
  return secret;
}

// ─── Token Operations ────────────────────────────────────────────────
export function createAccessToken(
  name: string,
  email: string,
  role: "admin" | "viewer"
): AccessToken {
  const tokenId = nanoid(12);

  const jwtToken = jwt.sign(
    { tokenId, name, email, role } as TokenPayload,
    getSecret(),
    { expiresIn: "365d" } // 1 yıl geçerli
  );

  const accessToken: AccessToken = {
    id: tokenId,
    name,
    email,
    role,
    active: true,
    token: jwtToken,
    createdAt: new Date().toISOString(),
    lastUsedAt: "-",
  };

  tokenStore.push(accessToken);
  return accessToken;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getSecret()) as TokenPayload;

    // Check if token is still active in store
    const storedToken = tokenStore.find((t) => t.id === payload.tokenId);
    if (storedToken && !storedToken.active) {
      return null; // Token devre dışı bırakılmış
    }

    // Update last used
    if (storedToken) {
      storedToken.lastUsedAt = new Date().toISOString();
    }

    return payload;
  } catch {
    return null;
  }
}

export function listTokens(): Omit<AccessToken, "token">[] {
  return tokenStore.map(({ token, ...rest }) => rest);
}

export function toggleToken(tokenId: string): boolean {
  const token = tokenStore.find((t) => t.id === tokenId);
  if (token) {
    token.active = !token.active;
    return token.active;
  }
  return false;
}

export function deleteToken(tokenId: string): boolean {
  const idx = tokenStore.findIndex((t) => t.id === tokenId);
  if (idx > -1) {
    tokenStore.splice(idx, 1);
    return true;
  }
  return false;
}

export function getShareLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/dashboard?token=${token}`;
}

// ─── Middleware Helper ───────────────────────────────────────────────
export function extractToken(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Check query parameter
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  return null;
}

export function requireAuth(
  request: Request,
  requiredRole?: "admin" | "viewer"
): TokenPayload {
  const token = extractToken(request);
  if (!token) {
    throw new Error("Yetkilendirme gerekli. Token bulunamadı.");
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw new Error("Geçersiz veya süresi dolmuş token.");
  }

  if (requiredRole === "admin" && payload.role !== "admin") {
    throw new Error("Bu işlem için admin yetkisi gerekli.");
  }

  return payload;
}

// ─── Initialize Default Admin Token ──────────────────────────────────
// İlk başlatmada varsayılan admin token oluştur
if (tokenStore.length === 0) {
  try {
    createAccessToken("Berke (Admin)", "berke@olgacerceve.com", "admin");
    createAccessToken("Ahmet Bey", "ahmet@olgacerceve.com", "admin");
  } catch {
    // JWT_SECRET henüz tanımlanmamış olabilir, sorun değil
  }
}
