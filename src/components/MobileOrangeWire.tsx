import { useEffect, useRef, useState } from "react";
import { Search, Download, Loader2, Users } from "lucide-react";
import logo from "@/assets/orangewire-logo.png";
import { startSearch, getResults, queueDownload, listDownloads, type SlskFile } from "@/lib/slskd.functions";

type Dl = Awaited<ReturnType<typeof listDownloads>>[number];

export function MobileOrangeWire() {
  const [tab, setTab] = useState<"search" | "downloads">("search");
  const [q, setQ] = useState("");
  const [files, setFiles] = useState<SlskFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [dls, setDls] = useState<Dl[]>([]);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = () => listDownloads().then(setDls).catch(() => {});
    load();
    const i = setInterval(load, 3000);
    return () => { clearInterval(i); if (poll.current) clearInterval(poll.current); };
  }, []);

  const run = async () => {
    if (!q.trim()) return;
    setErr(""); setFiles([]); setBusy(true);
    if (poll.current) clearInterval(poll.current);
    try {
      const { id } = await startSearch({ data: { q } });
      let n = 0;
      poll.current = setInterval(async () => {
        n++;
        try {
          const r = await getResults({ data: { id } });
          setFiles(r.files);
          if (r.done || n > 20) { clearInterval(poll.current!); setBusy(false); }
        } catch (e) { clearInterval(poll.current!); setBusy(false); setErr((e as Error).message); }
      }, 1500);
    } catch (e) { setBusy(false); setErr((e as Error).message); }
  };

  const get = async (f: SlskFile) => {
    try { await queueDownload({ data: { username: f.username, filename: f.filename, size: f.size } }); setTab("downloads"); }
    catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="chrome flex h-[720px] max-h-[calc(100vh-2rem)] w-[360px] flex-col overflow-hidden rounded-[2rem] border-4">
      <div className="titlebar flex items-center gap-2 px-4 py-3">
        <img src={logo} alt="OrangeWire logo" className="h-7 w-7" />
        <span className="font-display text-base italic">OrangeWire</span>
      </div>
      <div className="brushed border-b border-black/20 p-3">
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lime-deep)]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Soulseek..."
            className="w-full rounded-full border border-[color:var(--lime-deep)] bg-[color:var(--metal-3)] py-2 pl-9 pr-3 text-sm outline-none" />
        </form>
      </div>
      {err && <p className="bg-[color:var(--danger)]/15 px-3 py-2 text-xs text-[color:var(--danger)]">{err}</p>}
      <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--metal-3)]">
        {tab === "search" ? (
          <>
            {busy && <p className="flex items-center gap-2 p-3 text-xs text-[color:var(--ink-dim)]"><Loader2 className="h-3 w-3 animate-spin" />Searching peers… {files.length} found</p>}
            {!busy && !files.length && <p className="p-6 text-center text-xs text-[color:var(--ink-dim)]">Search for any track to find it on the network.</p>}
            {files.map((f, i) => (
              <div key={i} className={`flex items-center gap-2 border-b border-black/10 px-3 py-2 ${i % 2 ? "bg-[color:var(--metal-1)]" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{f.filename.split(/[\\/]/).pop()}</p>
                  <p className="truncate text-[10px] text-[color:var(--ink-dim)]">
                    {f.username} · {(f.size / 1048576).toFixed(1)} MB{f.bitRate ? ` · ${f.bitRate} kbps` : ""} · {Math.round(f.speed / 1024)} KB/s
                  </p>
                </div>
                <button onClick={() => get(f)} className="gloss-lime grid h-8 w-8 shrink-0 place-items-center rounded-full" aria-label="Download"><Download className="h-4 w-4" /></button>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-2 p-3">
            {!dls.length && <p className="p-6 text-center text-xs text-[color:var(--ink-dim)]">No downloads yet.</p>}
            {dls.map((d) => (
              <div key={d.id} className="glass-panel rounded-lg p-2 text-[11px]">
                <div className="flex justify-between gap-2"><span className="truncate font-bold">{d.filename}</span><span className="text-[color:var(--lime-deep)]">{d.pct}%</span></div>
                <div className="neon-track mt-1 h-1.5 rounded-full"><div className="neon-fill h-full rounded-full" style={{ width: `${d.pct}%` }} /></div>
                <div className="mt-1 flex justify-between text-[color:var(--ink-dim)]"><span>{d.state}</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{d.username} · {d.speed} KB/s</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="brushed grid grid-cols-2 border-t border-black/20">
        {(["search", "downloads"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`py-3 text-xs font-bold capitalize ${tab === t ? "gloss-lime" : ""}`}>{t}{t === "downloads" && dls.length ? ` (${dls.length})` : ""}</button>
        ))}
      </div>
    </div>
  );
}
