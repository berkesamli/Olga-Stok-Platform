# Olga Stok — Claude Code Kurulum Rehberi
# Bu dosyayı adım adım takip edin. Her adımı ayrı ayrı çalıştırın.

## ═══════════════════════════════════════════════════
## ADIM 1: Proje Oluştur
## ═══════════════════════════════════════════════════

```bash
npx create-next-app@14 olga-stock --typescript --tailwind --eslint --app --src-dir --no-import-alias
cd olga-stock
```

## ═══════════════════════════════════════════════════
## ADIM 2: Paketleri Kur
## ═══════════════════════════════════════════════════

```bash
npm install jsonwebtoken nanoid@5
npm install -D @types/jsonwebtoken
```

## ═══════════════════════════════════════════════════
## ADIM 3: .env.local Dosyası Oluştur
## ═══════════════════════════════════════════════════

Proje kök dizininde `.env.local` dosyası oluştur:

```
IKAS_CLIENT_ID=buraya_ikas_client_id
IKAS_CLIENT_SECRET=buraya_ikas_client_secret
IKAS_STORE_NAME=olgacerceve
JWT_SECRET=buraya_rastgele_uzun_bir_string
ANTHROPIC_API_KEY=buraya_anthropic_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

JWT_SECRET oluşturmak için:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## ═══════════════════════════════════════════════════
## ADIM 4: Klasör Yapısını Oluştur
## ═══════════════════════════════════════════════════

```bash
mkdir -p src/lib
mkdir -p src/app/api/products
mkdir -p src/app/api/stock
mkdir -p src/app/api/webhook
mkdir -p src/app/api/agent
mkdir -p src/app/api/tokens
mkdir -p src/app/api/auth
mkdir -p src/app/dashboard
```

## ═══════════════════════════════════════════════════
## ADIM 5-12: Dosyaları Oluştur
## ═══════════════════════════════════════════════════
## Her dosya için Claude Code'a şu şekilde iste:
##
## "src/lib/ikas.ts dosyasını oluştur"
## "src/lib/auth.ts dosyasını oluştur"
## "src/lib/analysis.ts dosyasını oluştur"
## ... vb.
##
## Dosya içerikleri aşağıda ayrı ayrı verilmiştir.

## ═══════════════════════════════════════════════════
## ADIM 13: Çalıştır
## ═══════════════════════════════════════════════════

```bash
npm run dev
```

Tarayıcıda: http://localhost:3000

## ═══════════════════════════════════════════════════
## ADIM 14: Vercel'e Deploy
## ═══════════════════════════════════════════════════

```bash
npm i -g vercel
vercel
```

Vercel panelinde Environment Variables ekle:
- IKAS_CLIENT_ID
- IKAS_CLIENT_SECRET
- IKAS_STORE_NAME
- JWT_SECRET
- ANTHROPIC_API_KEY
- NEXT_PUBLIC_APP_URL (vercel URL'in)
