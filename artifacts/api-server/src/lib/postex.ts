// PostEx Merchant API client
// Docs: PostEx COD API Integration Guide (v4.1.9)

const POSTEX_ROOT = "https://api.postex.pk/services/integration/api/order";

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
  const res = await fetch(`${POSTEX_ROOT}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      token: getToken(),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || (data && data.statusCode && data.statusCode !== "200")) {
    const message =
      (data && (data.statusMessage || data.message)) ||
      `PostEx request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export interface PostexCreateOrderInput {
  orderRefNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  invoicePayment: number;
  orderDetail?: string;
  cityName: string;
  items: number;
}

export interface PostexCreateOrderResponse {
  statusCode: string;
  statusMessage: string;
  dist: {
    trackingNumber: string;
    orderStatus?: string;
    orderDate?: string;
  };
}

export async function createPostexOrder(
  input: PostexCreateOrderInput
): Promise<PostexCreateOrderResponse> {
  return postexRequest<PostexCreateOrderResponse>("/v3/create-order", {
    method: "POST",
    body: {
      cityName: input.cityName,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      deliveryAddress: input.deliveryAddress,
      invoiceDivision: 1,
      invoicePayment: input.invoicePayment,
      items: input.items,
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
    "/v2/get-operational-city"
  );
  return data.dist;
}

export async function trackPostexOrder(trackingNumber: string) {
  return postexRequest(`/v1/track-order/${trackingNumber}`);
}

export async function cancelPostexOrder(trackingNumber: string) {
  return postexRequest(`/v1/cancel-order`, {
    method: "PUT",
    body: { trackingNumber },
  });
}