import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  Search, Music, Heart, ListMusic, Plus, Network, Minus, Square, X, Play, Pause,
  SkipBack, SkipForward, Repeat, Download, CheckCircle2, Zap, ChevronRight, Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LimeAmp — Retro P2P Music Player" },
      { name: "description", content: "Browse, download and play tracks in a glossy 2000s-style P2P music player." },
      { property: "og:title", content: "LimeAmp — Retro P2P Music Player" },
      { property: "og:description", content: "Browse, download and play tracks in a glossy 2000s-style P2P music player." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type Track = { id: number; title: string; artist: string; kbps: number; size: string; speed: string; dur: string; status: "new" | "local" | "liked"; type: "Audio" | "Images" | "Videos" };

const TRACKS: Track[] = [
  { id: 1, title: "Black Hole Sun", artist: "Soundgarden", kbps: 320, size: "4.9 MB", speed: "Turbo T3", dur: "5:18", status: "local", type: "Audio" },
  { id: 2, title: "Spoonman", artist: "Soundgarden", kbps: 192, size: "3.8 MB", speed: "Turbo T3", dur: "4:06", status: "new", type: "Audio" },
  { id: 3, title: "Outshined", artist: "Soundgarden", kbps: 320, size: "4.8 MB", speed: "T3 or Higher", dur: "5:11", status: "liked", type: "Audio" },
  { id: 4, title: "The Day I Tried To Live", artist: "Soundgarden", kbps: 256, size: "7.4 MB", speed: "T1", dur: "5:20", status: "new", type: "Audio" },
  { id: 5, title: "Lifestyles of the Rich & Famous", artist: "Good Charlotte", kbps: 320, size: "3.6 MB", speed: "Turbo T3", dur: "3:10", status: "liked", type: "Audio" },
  { id: 6, title: "The Anthem", artist: "Good Charlotte", kbps: 192, size: "3.2 MB", speed: "Cable/DSL", dur: "2:55", status: "new", type: "Audio" },
  { id: 7, title: "Hold On", artist: "Good Charlotte", kbps: 128, size: "3.9 MB", speed: "T1", dur: "4:07", status: "local", type: "Audio" },
  { id: 8, title: "My Friends Over You", artist: "New Found Glory", kbps: 320, size: "3.8 MB", speed: "Turbo T3", dur: "3:40", status: "liked", type: "Audio" },
  { id: 9, title: "Hit Or Miss", artist: "New Found Glory", kbps: 256, size: "3.4 MB", speed: "T3 or Higher", dur: "3:21", status: "new", type: "Audio" },
  { id: 10, title: "All Downhill From Here", artist: "New Found Glory", kbps: 192, size: "3.1 MB", speed: "Cable/DSL", dur: "3:01", status: "local", type: "Audio" },
  { id: 11, title: "Rusty Cage (Soundgarden Cover)", artist: "Johnny Cash", kbps: 160, size: "2.6 MB", speed: "Modem", dur: "2:49", status: "new", type: "Audio" },
  { id: 12, title: "Superunknown Live 1994", artist: "Soundgarden", kbps: 0, size: "148 MB", speed: "T1", dur: "12:44", status: "new", type: "Videos" },
  { id: 13, title: "NFG_tour_poster.jpg", artist: "New Found Glory", kbps: 0, size: "0.8 MB", speed: "Turbo T3", dur: "—", status: "new", type: "Images" },
];

const VIEWS = [
  { id: "search", label: "Search", icon: Search },
  { id: "all", label: "All Songs", icon: Music },
  { id: "liked", label: "Liked Songs", icon: Heart },
  { id: "playlists", label: "Playlists", icon: ListMusic },
  { id: "nodes", label: "Network Nodes", icon: Network },
] as const;
type View = (typeof VIEWS)[number]["id"];

const NODES = [
  { ip: "24.118.42.7", name: "punkrock_dave", files: 2841, speed: "Turbo T3", ping: "38 ms" },
  { ip: "68.32.199.14", name: "grunge4ever", files: 1209, speed: "T1", ping: "72 ms" },
  { ip: "81.4.220.91", name: "xXmixtapeXx", files: 532, speed: "Cable/DSL", ping: "115 ms" },
  { ip: "12.77.3.150", name: "poppunk_kid", files: 3990, speed: "Turbo T3", ping: "44 ms" },
];

function App() {
  const [view, setView] = useState<View>("search");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All Types");
  const [playlists, setPlaylists] = useState<Record<string, number[]>>({ "Summer '03": [5, 8], "Grunge Essentials": [1, 3] });
  const [openList, setOpenList] = useState("Summer '03");
  const [menu, setMenu] = useState<{ x: number; y: number; t: Track } | null>(null);
  const [queue, setQueue] = useState<number[]>([]);
  const [downloads, setDownloads] = useState([
    { id: 2, pct: 65, kbs: 213, peers: 8 },
    { id: 4, pct: 19, kbs: 36, peers: 2 },
  ]);
  const [nowId, setNowId] = useState(3);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(false);
  const [pos, setPos] = useState(134);
  const [toast, setToast] = useState("");
  const now = TRACKS.find((t) => t.id === nowId)!;
  const total = toSec(now.dur) || 225;

  useEffect(() => {
    const i = setInterval(() => {
      if (playing) setPos((p) => (p + 1 >= total ? (loop ? 0 : 0) : p + 1));
      setDownloads((d) => d.map((x) => (x.pct >= 100 ? x : { ...x, pct: Math.min(100, x.pct + Math.random() * 3), kbs: Math.max(20, Math.round(x.kbs + (Math.random() - 0.5) * 40)) })));
    }, 1000);
    return () => clearInterval(i);
  }, [playing, total, loop]);

  useEffect(() => {
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const startDl = (t: Track) => {
    setDownloads((d) => (d.some((x) => x.id === t.id) ? d : [{ id: t.id, pct: 1, kbs: 120, peers: 1 + Math.floor(Math.random() * 9) }, ...d]));
    flash(`Downloading "${t.title}"`);
  };

  const rows = useMemo(() => {
    let r = TRACKS;
    if (view === "all") r = r.filter((t) => t.type === "Audio");
    if (view === "liked") r = r.filter((t) => t.status === "liked");
    if (view === "playlists") r = (playlists[openList] ?? []).map((id) => TRACKS.find((t) => t.id === id)!);
    if (view === "search" && cat !== "All Types") r = r.filter((t) => t.type === cat);
    const q = query.toLowerCase();
    if (q) r = r.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(q));
    return r;
  }, [view, cat, query, playlists, openList]);

  const createPlaylist = () => {
    const name = `New Playlist ${Object.keys(playlists).length + 1}`;
    setPlaylists((p) => ({ ...p, [name]: [] }));
    setOpenList(name); setView("playlists");
  };

  const onRow = (e: MouseEvent, t: Track) => {
    e.preventDefault(); e.stopPropagation();
    setMenu({ x: Math.min(e.clientX, window.innerWidth - 240), y: Math.min(e.clientY, window.innerHeight - 200), t });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-2 md:p-6">
      <div className="chrome flex h-[calc(100vh-1rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-xl md:h-[calc(100vh-3rem)]">
        {/* Title bar */}
        <div className="brushed flex h-9 shrink-0 items-center justify-between border-b border-black/60 px-3">
          <div className="flex items-center gap-2">
            <div className="gloss-lime grid h-5 w-5 place-items-center rounded-full"><Zap className="h-3 w-3" /></div>
            <span className="font-display text-sm tracking-wider text-[color:var(--lime)]">LimeAmp</span>
            <span className="hidden text-xs text-[color:var(--ink-dim)] sm:inline">— Enabling Open Music Sharing</span>
          </div>
          <div className="flex gap-1.5">
            <button className="gloss-btn grid h-5 w-6 place-items-center rounded" aria-label="Minimize"><Minus className="h-3 w-3" /></button>
            <button className="gloss-btn grid h-5 w-6 place-items-center rounded" aria-label="Maximize"><Square className="h-2.5 w-2.5" /></button>
            <button className="grid h-5 w-6 place-items-center rounded border border-black bg-[color:var(--danger)] hover:brightness-125" aria-label="Close"><X className="h-3 w-3" /></button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Sidebar */}
          <aside className="brushed hidden w-56 shrink-0 flex-col gap-1 border-r border-black/60 p-3 md:flex">
            <p className="mb-1 px-2 text-[10px] uppercase tracking-widest text-[color:var(--ink-dim)]">Library</p>
            {VIEWS.map((v) => {
              const active = view === v.id;
              return (
                <div key={v.id}>
                  <button onClick={() => setView(v.id)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? "gloss-lime font-bold" : "gloss-btn"}`}>
                    <v.icon className="h-4 w-4" />{v.label}
                  </button>
                  {v.id === "playlists" && (
                    <div className="ml-3 mt-1 space-y-0.5 border-l border-white/10 pl-2">
                      {Object.keys(playlists).map((p) => (
                        <button key={p} onClick={() => { setOpenList(p); setView("playlists"); }} className={`block w-full truncate rounded px-2 py-1 text-left text-xs hover:text-[color:var(--lime)] ${view === "playlists" && openList === p ? "text-[color:var(--lime)]" : "text-[color:var(--ink-dim)]"}`}>♪ {p}</button>
                      ))}
                      <button onClick={createPlaylist} className="flex items-center gap-1 px-2 py-1 text-xs text-[color:var(--lime)] hover:underline"><Plus className="h-3 w-3" />Create Playlist</button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="glass-panel mt-auto rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 text-[color:var(--lime)]"><span className="h-2 w-2 rounded-full bg-[color:var(--lime)] shadow-[0_0_8px_var(--lime)]" />Turbo-Charged</div>
              <p className="mt-1 text-[color:var(--ink-dim)]">Connected to {NODES.length * 37} peers</p>
            </div>
          </aside>

          {/* Main */}
          <main className="flex min-w-0 flex-1 flex-col bg-[color:var(--metal-3)]">
            <div className="border-b border-black/60 p-3">
              <div className="flex md:hidden mb-2 gap-1 overflow-x-auto">
                {VIEWS.map((v) => <button key={v.id} onClick={() => setView(v.id)} className={`shrink-0 rounded px-2 py-1 text-xs ${view === v.id ? "gloss-lime" : "gloss-btn"}`}>{v.label}</button>)}
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lime)]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracks, artist, MP3s..."
                  className="w-full rounded-full border border-[color:var(--lime-deep)] bg-black/50 py-2.5 pl-11 pr-4 text-sm outline-none shadow-[inset_0_2px_6px_oklch(0_0_0/0.7),0_0_12px_var(--lime-glow)] placeholder:text-[color:var(--ink-dim)] focus:shadow-[inset_0_2px_6px_oklch(0_0_0/0.7),0_0_22px_var(--lime-glow)]" />
              </div>
              {view === "search" && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["All Types", "Audio", "Images", "Videos"].map((c) => (
                    <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-xs ${cat === c ? "gloss-lime font-bold" : "gloss-btn"}`}>{c}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-3 py-2 text-xs">
              <span className="font-display tracking-wide text-[color:var(--lime)]">
                {view === "playlists" ? openList : VIEWS.find((v) => v.id === view)!.label} <span className="text-[color:var(--ink-dim)]">({view === "nodes" ? NODES.length : rows.length})</span>
              </span>
              <span className="text-[color:var(--ink-dim)]">Right-click a row for options</span>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
              {view === "nodes" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {NODES.map((n) => (
                    <div key={n.ip} className="glass-panel rounded-lg p-4">
                      <div className="flex items-center gap-2"><Network className="h-4 w-4 text-[color:var(--lime)]" /><b>{n.name}</b></div>
                      <p className="mt-1 font-mono text-xs text-[color:var(--ink-dim)]">{n.ip} · {n.ping}</p>
                      <p className="mt-2 text-xs">{n.files.toLocaleString()} shared files · {n.speed}</p>
                      <button onClick={() => flash(`Browsing host ${n.name}`)} className="gloss-btn mt-3 rounded px-3 py-1 text-xs">Browse Host</button>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full border-collapse overflow-hidden rounded-md text-xs">
                  <thead className="sticky top-0">
                    <tr className="brushed text-left text-[color:var(--ink-dim)]">
                      {["", "Title", "Artist", "Bitrate", "Size", "Speed", "Actions"].map((h, i) => <th key={i} className="border-b border-black px-2 py-1.5 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((t, i) => (
                      <tr key={t.id} onContextMenu={(e) => onRow(e, t)} onDoubleClick={() => { setNowId(t.id); setPos(0); setPlaying(true); }}
                        className={`cursor-default ${nowId === t.id ? "bg-[color:var(--lime)]/15 text-[color:var(--lime)]" : i % 2 ? "bg-white/[0.03]" : ""} hover:bg-[color:var(--lime)]/10`}>
                        <td className="w-8 px-2 py-1.5">{t.status === "local" ? <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--lime)]" /> : t.status === "liked" ? <Heart className="h-3.5 w-3.5 fill-current text-[color:var(--lime)]" /> : <Download className="h-3.5 w-3.5 text-[color:var(--ink-dim)]" />}</td>
                        <td className="px-2 py-1.5 font-medium">{t.title}</td>
                        <td className="px-2 py-1.5">{t.artist}</td>
                        <td className="px-2 py-1.5 font-mono">{t.kbps ? `${t.kbps} kbps` : "—"}</td>
                        <td className="px-2 py-1.5 font-mono">{t.size}</td>
                        <td className="px-2 py-1.5">{t.speed}</td>
                        <td className="px-2 py-1">
                          <div className="flex gap-1">
                            <button onClick={() => { setNowId(t.id); setPos(0); setPlaying(true); }} className="gloss-btn grid h-6 w-6 place-items-center rounded" aria-label="Play"><Play className="h-3 w-3" /></button>
                            <button onClick={() => startDl(t)} className="gloss-lime grid h-6 w-6 place-items-center rounded" aria-label="Download"><Download className="h-3 w-3" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!rows.length && <tr><td colSpan={7} className="py-10 text-center text-[color:var(--ink-dim)]">No files found. Right-click search results to add them here.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </main>
        </div>

        {/* Bottom dock */}
        <footer className="brushed grid shrink-0 grid-cols-1 gap-3 border-t border-black/60 p-3 lg:grid-cols-[1fr_1.3fr_1fr]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="gloss-lime grid h-14 w-14 shrink-0 place-items-center rounded-lg"><Music className="h-6 w-6" /></div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{now.title}</p>
              <p className="truncate text-xs text-[color:var(--ink-dim)]">{now.artist}</p>
            </div>
            <div className="neon-track ml-auto flex h-10 items-end gap-0.5 rounded px-1.5 py-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="eq-bar w-1.5 rounded-sm neon-fill" style={{ height: "100%", animationDelay: `${(i * 137) % 900}ms`, animationPlayState: playing ? "running" : "paused" }} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => { setNowId(((nowId - 2 + TRACKS.length) % TRACKS.length) + 1); setPos(0); }} className="gloss-btn grid h-8 w-8 place-items-center rounded-full" aria-label="Previous"><SkipBack className="h-4 w-4" /></button>
              <button onClick={() => setPlaying(!playing)} className="gloss-lime grid h-11 w-11 place-items-center rounded-full" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
              <button onClick={() => { setNowId(queue[0] ?? (nowId % TRACKS.length) + 1); setQueue((q) => q.slice(1)); setPos(0); }} className="gloss-btn grid h-8 w-8 place-items-center rounded-full" aria-label="Next"><SkipForward className="h-4 w-4" /></button>
              <button onClick={() => setLoop(!loop)} className={`grid h-8 w-8 place-items-center rounded-full ${loop ? "gloss-lime" : "gloss-btn"}`} aria-label="Loop"><Repeat className="h-4 w-4" /></button>
            </div>
            <div className="flex w-full max-w-md items-center gap-2 font-mono text-[11px]">
              <span>{fmt(pos)}</span>
              <div className="neon-track h-2.5 flex-1 cursor-pointer rounded-full" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(Math.floor(((e.clientX - r.left) / r.width) * total)); }}>
                <div className="neon-fill h-full rounded-full" style={{ width: `${(pos / total) * 100}%` }} />
              </div>
              <span>{fmt(total)}</span>
            </div>
          </div>

          <div className="glass-panel max-h-28 overflow-auto rounded-lg p-2">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-[color:var(--ink-dim)]">Active Downloads</p>
            {downloads.map((d) => {
              const t = TRACKS.find((x) => x.id === d.id)!;
              return (
                <div key={d.id} className="mb-1.5 text-[11px]">
                  <div className="flex justify-between gap-2"><span className="truncate">{t.artist} - {t.title}.mp3</span><span className="font-mono text-[color:var(--lime)]">{Math.floor(d.pct)}%</span></div>
                  <div className="neon-track mt-0.5 h-1.5 rounded-full"><div className="neon-fill h-full rounded-full" style={{ width: `${d.pct}%` }} /></div>
                  <div className="mt-0.5 flex justify-between text-[color:var(--ink-dim)]"><span>{d.pct >= 100 ? "Complete" : `${d.kbs} KB/s`}</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{d.peers} peers</span></div>
                </div>
              );
            })}
          </div>
        </footer>
      </div>

      {menu && (
        <div className="chrome fixed z-50 w-56 rounded-md py-1 text-xs" style={{ left: menu.x, top: menu.y }} onClick={(e) => e.stopPropagation()}>
          <MenuItem onClick={() => { startDl(menu.t); setMenu(null); }}>Download</MenuItem>
          <MenuItem onClick={() => { startDl(menu.t); setQueue((q) => [...q, menu.t.id]); setMenu(null); }}>Download &amp; Add to Queue</MenuItem>
          <div className="group relative">
            <MenuItem>Download &amp; Add to Playlist <ChevronRight className="ml-auto h-3 w-3" /></MenuItem>
            <div className="chrome absolute left-full top-0 hidden w-48 rounded-md py-1 group-hover:block">
              {Object.keys(playlists).map((p) => (
                <MenuItem key={p} onClick={() => { startDl(menu.t); setPlaylists((pl) => { const cur = pl[p] ?? []; return { ...pl, [p]: cur.includes(menu.t.id) ? cur : [...cur, menu.t.id] }; }); flash(`Added to ${p}`); setMenu(null); }}>♪ {p}</MenuItem>
              ))}
            </div>
          </div>
          <div className="my-1 border-t border-white/10" />
          <MenuItem onClick={() => { flash(`Node ${NODES[menu.t.id % NODES.length]!.name} · ${NODES[menu.t.id % NODES.length]!.ip}`); setMenu(null); }}>View Node Details</MenuItem>
        </div>
      )}

      {toast && <div className="gloss-lime fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold">{toast}</div>}
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-[color:var(--lime)] hover:text-[color:var(--metal-3)]">{children}</button>;
}
function toSec(d: string) { const [m, s] = d.split(":").map(Number); return (m ?? 0) * 60 + (s || 0); }
function fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`; }
