import { api } from "./api";
import { Notification } from "@/types/models";

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get("/notifications");
  return res.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

export async function markNotificationAsUnread(id: string): Promise<void> {
  await api.post(`/notifications/${id}/unread`);
}
