import { createServerFn } from "@tanstack/react-start";

async function slskd(path: string, init?: RequestInit) {
  const base = process.env.SLSKD_URL;
  const key = process.env.SLSKD_API_KEY;
  if (!base || !key) throw new Error("slskd is not configured yet.");
  const res = await fetch(`${base.replace(/\/$/, "")}/api/v0${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-API-Key": key, ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`slskd error ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export type SlskFile = { username: string; filename: string; size: number; bitRate?: number; length?: number; speed: number; free: boolean };

export const startSearch = createServerFn({ method: "POST" })
  .inputValidator((d: { q: string }) => {
    const q = String(d?.q ?? "").trim().slice(0, 200);
    if (!q) throw new Error("Empty search");
    return { q };
  })
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await slskd("/searches", { method: "POST", body: JSON.stringify({ id, searchText: data.q }) });
    return { id };
  });

export const getResults = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(String(d?.id))) throw new Error("Bad id");
    return { id: d.id };
  })
  .handler(async ({ data }) => {
    const search = await slskd(`/searches/${data.id}`);
    const responses: any[] = (await slskd(`/searches/${data.id}/responses`)) ?? [];
    const files: SlskFile[] = responses.flatMap((r) =>
      (r.files ?? []).map((f: any) => ({
        username: r.username, filename: f.filename, size: f.size, bitRate: f.bitRate, length: f.length,
        speed: r.uploadSpeed ?? 0, free: !!r.hasFreeUploadSlot,
      })),
    );
    files.sort((a, b) => Number(b.free) - Number(a.free) || b.speed - a.speed);
    return { done: !!search?.isComplete, files: files.slice(0, 200) };
  });

export const queueDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; filename: string; size: number }) => ({
    username: String(d.username).slice(0, 200), filename: String(d.filename).slice(0, 1000), size: Number(d.size) || 0,
  }))
  .handler(async ({ data }) => {
    await slskd(`/transfers/downloads/${encodeURIComponent(data.username)}`, {
      method: "POST", body: JSON.stringify([{ filename: data.filename, size: data.size }]),
    });
    return { ok: true };
  });

export const listDownloads = createServerFn({ method: "GET" }).handler(async () => {
  const users: any[] = (await slskd("/transfers/downloads")) ?? [];
  return users.flatMap((u) =>
    (u.directories ?? []).flatMap((d: any) =>
      (d.files ?? []).map((f: any) => ({
        id: f.id as string, username: u.username as string, filename: String(f.filename).split(/[\\/]/).pop() as string,
        pct: Math.round(f.percentComplete ?? 0), speed: Math.round((f.averageSpeed ?? 0) / 1024), state: String(f.state ?? ""),
      })),
    ),
  );
});
