import { api } from "@/hooks/services/api";

export type ConfirmDeviceResponse = {
  confirmed: boolean;
};
export type RegisterDeviceResponse = {
  confirmed: boolean;
  requiresConfirmation: boolean;
};

export async function registerDevice(
  pushToken: string,
  platform: string
): Promise<RegisterDeviceResponse> {
  const res = await api.post<RegisterDeviceResponse>("/devices/register", {
    pushToken,
    platform,
  });
  return res.data;
}
export async function confirmDevice(
  pushToken: string,
  code: string
): Promise<boolean> {
  const res = await api.post<ConfirmDeviceResponse>("/devices/confirm", {
    pushToken,
    code,
  });
  return res.data.confirmed;
}
