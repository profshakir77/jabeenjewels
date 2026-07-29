// PostEx Merchant API client
// Docs: PostEx COD API Integration Guide (v4.1.9) — verify base URL/paths
// against your merchant dashboard's docs before going live.

const POSTEX_BASE_URL = "https://api.postex.pk/services/integration/api/order/v3";

function getToken(): string {
  const token = process.env.POSTEX_API_TOKEN;
  if (!token) {
    throw new Error("POSTEX_API_TOKEN is not set");
  }
  return token;
}

async function postexRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${POSTEX_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      token: getToken(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.statusMessage || data.message)) ||
      `PostEx request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export interface PostexCreateOrderInput {
  orderRefNumber: string;      // your internal order id, must be unique
  customerName: string;
  customerPhone: string;       // format 03xxxxxxxxx
  deliveryAddress: string;
  invoicePayment: number;      // total amount to collect (COD)
  orderDetail?: string;        // e.g. product summary
  cityName: string;            // must match a PostEx operational city
}

export interface PostexCreateOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    orderStatus?: string;
  };
}

export async function createPostexOrder(
  input: PostexCreateOrderInput
): Promise<PostexCreateOrderResponse> {
  return postexRequest<PostexCreateOrderResponse>("/create-order", {
    method: "POST",
    body: {
      cityName: input.cityName,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      invoicePayment: input.invoicePayment,
      orderDetail: input.orderDetail ?? "",
      orderRefNumber: input.orderRefNumber,
      orderType: "Normal",
    },
  });
}

export interface PostexCity {
  operationalCityName: string;
  countryName: string;
  isPickupCity: boolean;
  isDeliveryCity: boolean;
}

export async function getOperationalCities(): Promise<PostexCity[]> {
  const data = await postexRequest<{ dist: PostexCity[] }>(
    "/get-operational-city"
  );
  return data.dist;
}

export async function trackPostexOrder(trackingNumber: string) {
  return postexRequest(`/get-order-detail/${trackingNumber}`);
}
