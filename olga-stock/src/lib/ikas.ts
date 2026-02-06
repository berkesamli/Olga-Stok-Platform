// ─── ikas API Client ─────────────────────────────────────────────────
// GraphQL client for ikas e-commerce platform
// API Docs: https://ikas.dev/docs/api/admin-api/products

interface IkasTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface IkasConfig {
  clientId: string;
  clientSecret: string;
  storeName: string;
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

function getConfig(): IkasConfig {
  const clientId = process.env.IKAS_CLIENT_ID;
  const clientSecret = process.env.IKAS_CLIENT_SECRET;
  const storeName = process.env.IKAS_STORE_NAME;

  if (!clientId || !clientSecret || !storeName) {
    throw new Error("ikas API bilgileri eksik. .env.local dosyasını kontrol edin.");
  }

  return { clientId, clientSecret, storeName };
}

// ─── OAuth Token ─────────────────────────────────────────────────────
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const config = getConfig();
  const tokenUrl = `https://${config.storeName}.myikas.com/api/admin/oauth/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ikas token hatası (${response.status}): ${error}`);
  }

  const data: IkasTokenResponse = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// ─── GraphQL Query ───────────────────────────────────────────────────
export async function ikasGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch("https://api.myikas.com/api/v1/admin/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ikas GraphQL hatası (${response.status}): ${error}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`ikas GraphQL hatası: ${JSON.stringify(result.errors)}`);
  }

  return result.data as T;
}

// ─── Product Queries ─────────────────────────────────────────────────
export const QUERIES = {
  // Tüm ürünleri listele (stok bilgisi dahil) - pagination destekli
  LIST_PRODUCTS: `query($pagination: PaginationInput) {
    listProduct(pagination: $pagination) {
      data {
        id
        name
        description
        totalStock
        type
        brandId
        brand {
          id
          name
        }
        categoryIds
        categories {
          id
          name
        }
        tagIds
        tags {
          id
          name
        }
        variants {
          id
          sku
          barcodeList
          prices {
            sellPrice
            buyPrice
            currency
            priceListId
          }
          images {
            imageId
            isMain
            order
          }
          stocks {
            stockCount
            stockLocationId
          }
          weight
          isActive
        }
        baseUnit {
          type
        }
        createdAt
        weight
      }
      hasNext
    }
  }`,

  // Tek ürün detayı
  GET_PRODUCT: `query($id: StringFilterInput!) {
    listProduct(id: $id) {
      data {
        id
        name
        description
        totalStock
        variants {
          id
          sku
          stocks {
            stockCount
            stockLocationId
          }
          prices {
            sellPrice
            buyPrice
            currency
          }
          isActive
        }
        categories {
          id
          name
        }
        brand {
          id
          name
        }
        createdAt
      }
    }
  }`,

  // Stok lokasyonlarını listele
  LIST_STOCK_LOCATIONS: `{
    listStockLocation {
      id
      name
      address {
        city
        district
      }
      isDefault
    }
  }`,

  // Siparişleri listele (tüketim analizi için) - pagination destekli
  LIST_ORDERS: `query($pagination: PaginationInput) {
    listOrder(pagination: $pagination) {
      data {
        id
        orderNumber
        status
        createdAt
        orderLineItems {
          productId
          variantId
          quantity
          finalPrice
        }
      }
      hasNext
    }
  }`,

  // Kategorileri listele
  LIST_CATEGORIES: `{
    listCategory {
      id
      name
      parentId
      categoryPath
    }
  }`,

  // Marka listele
  LIST_BRANDS: `{
    listProductBrand {
      id
      name
    }
  }`,
};

// ─── Mutations ───────────────────────────────────────────────────────
export const MUTATIONS = {
  // Stok güncelle
  UPDATE_STOCK: `mutation($input: UpdateStockInput!) {
    updateStock(input: $input)
  }`,

  // Webhook kaydet
  SAVE_WEBHOOK: `mutation($input: WebhookInput!) {
    saveWebhook(input: $input) {
      id
      scope
      endpoint
      createdAt
    }
  }`,
};

// ─── Helper Functions ────────────────────────────────────────────────
export async function fetchAllProducts() {
  const allProducts: any[] = [];
  let page = 1;
  const limit = 200; // ikas max limit

  while (true) {
    const data = await ikasGraphQL(QUERIES.LIST_PRODUCTS, {
      pagination: { page, limit },
    });

    const products = data.listProduct?.data || [];
    allProducts.push(...products);

    if (!data.listProduct?.hasNext || products.length === 0) break;
    page++;
  }

  return allProducts;
}

export async function fetchStockLocations() {
  try {
    const data = await ikasGraphQL(QUERIES.LIST_STOCK_LOCATIONS);
    return data.listStockLocation || [];
  } catch {
    return [];
  }
}

export async function fetchOrders() {
  const allOrders: any[] = [];
  let page = 1;
  const limit = 200;

  while (true) {
    const data = await ikasGraphQL(QUERIES.LIST_ORDERS, {
      pagination: { page, limit },
    });

    const orders = data.listOrder?.data || [];
    allOrders.push(...orders);

    if (!data.listOrder?.hasNext || orders.length === 0) break;
    page++;
  }

  return allOrders;
}

export async function fetchCategories() {
  const data = await ikasGraphQL(QUERIES.LIST_CATEGORIES);
  return data.listCategory || [];
}

export async function testConnection(): Promise<{
  success: boolean;
  message: string;
  productCount?: number;
}> {
  try {
    const products = await fetchAllProducts();
    return {
      success: true,
      message: `Bağlantı başarılı! ${products.length} ürün bulundu.`,
      productCount: products.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Bağlantı hatası: ${error.message}`,
    };
  }
}
