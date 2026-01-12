import { api } from "./api";
import { Alert } from "@/types/models";

/**
 * Gets all alerts for a property.
 */
export async function getAlertsForProperty(
  propertyId: string
): Promise<Alert[]> {
  const res = await api.get<Alert[]>(`/alerts/property/${propertyId}`);
  return res.data;
}

/**
 * Gets upcoming alerts within the next X days (default 30).
 */
export async function getUpcomingAlerts(days = 30): Promise<Alert[]> {
  const res = await api.get<Alert[]>(`/alerts/upcoming`, { params: { days } });
  return res.data;
}

/**
 * Sends a usage alert push notification to a user.
 * @returns {Promise<{ sent: boolean }>}
 */
export async function sendUsageAlert(
  userId: string
): Promise<{ sent: boolean }> {
  const res = await api.post<{ sent: boolean }>(
    `/alerts/send-usage-alert/${userId}`
  );
  return res.data;
}
