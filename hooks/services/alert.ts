import { api } from "./api";

/**
 * Sends a usage alert push notification to a user.
 * @param userId The user ID to send the alert to.
 */
export async function sendUsageAlert(userId: string) {
  await api.post(`/alerts/send-usage-alert/${userId}`);
}
