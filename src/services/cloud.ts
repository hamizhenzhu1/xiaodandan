import type { RealtimeChannel, User } from "@supabase/supabase-js";
import { createDefaultAppData } from "./storage";
import { supabase } from "./supabase";
import type { AppData } from "../types/app";

export type SharedWorkspace = {
  id: string;
  name: string;
  inviteCode: string;
};

type WorkspaceRow = {
  id: string;
  name: string;
  invite_code: string;
};

type BookmarkRow = {
  id: string;
  name: string;
  url: string;
  category_id: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function requireSupabase() {
  if (!supabase) throw new Error("云端服务尚未配置");
  return supabase;
}

function toWorkspace(row: WorkspaceRow): SharedWorkspace {
  return { id: row.id, name: row.name, inviteCode: row.invite_code };
}

export async function getCurrentUser(): Promise<User | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function listWorkspaces(): Promise<SharedWorkspace[]> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("my_workspaces");
  if (error) throw error;
  return ((data ?? []) as WorkspaceRow[]).map(toWorkspace);
}

export async function createWorkspace(name: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("create_workspace", { workspace_name: name.trim() });
  if (error) throw error;
  return data as string;
}

export async function joinWorkspace(inviteCode: string): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.rpc("join_workspace", {
    invite_code_input: inviteCode.trim().toUpperCase(),
  });
  if (error) throw error;
  return data as string;
}

export async function loadWorkspaceData(workspaceId: string): Promise<AppData> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("bookmarks")
    .select("id,name,url,category_id,note,sort_order,created_at,updated_at")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const appData = createDefaultAppData();
  appData.bookmarks = ((data ?? []) as BookmarkRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    categoryId: row.category_id,
    note: row.note ?? undefined,
    order: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  return appData;
}

export function getRemovedBookmarkIds(previous: AppData, next: AppData): string[] {
  const nextIds = new Set(next.bookmarks.map((bookmark) => bookmark.id));
  return previous.bookmarks
    .filter((bookmark) => !nextIds.has(bookmark.id))
    .map((bookmark) => bookmark.id);
}

export async function saveWorkspaceData(
  workspaceId: string,
  previous: AppData,
  next: AppData,
): Promise<void> {
  const client = requireSupabase();
  const removedIds = getRemovedBookmarkIds(previous, next);
  if (removedIds.length > 0) {
    const { error: deleteError } = await client
      .from("bookmarks")
      .delete()
      .eq("workspace_id", workspaceId)
      .in("id", removedIds);
    if (deleteError) throw deleteError;
  }

  if (next.bookmarks.length === 0) return;
  const rows = next.bookmarks.map((bookmark, index) => ({
    id: bookmark.id,
    workspace_id: workspaceId,
    name: bookmark.name,
    url: bookmark.url,
    category_id: bookmark.categoryId,
    note: bookmark.note ?? null,
    sort_order: index,
    created_at: bookmark.createdAt,
    updated_at: bookmark.updatedAt,
  }));
  const { error: upsertError } = await client.from("bookmarks").upsert(rows, { onConflict: "id" });
  if (upsertError) throw upsertError;
}

export function subscribeToWorkspace(workspaceId: string, onChange: () => void): RealtimeChannel {
  const client = requireSupabase();
  return client
    .channel(`workspace:${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookmarks",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      onChange,
    )
    .subscribe();
}

export async function unsubscribeFromWorkspace(channel: RealtimeChannel): Promise<void> {
  await requireSupabase().removeChannel(channel);
}

export async function signOut(): Promise<void> {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
