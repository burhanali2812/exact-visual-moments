import { useEffect, useMemo, useState } from "react";
import {
  Home, FileText, Bell, User, Plus, ChevronRight, Paperclip, Image as ImageIcon, Camera, File, X, Check, Lock,
  Send, Star, CheckCircle2, XCircle, Pencil, Shield, Repeat, LogOut, Trash2, SlidersHorizontal, BellOff, MoreHorizontal,
  ArrowUpRight, FolderOpen,
} from "lucide-react";
import { useStore, type Tab } from "./store";
import {
  AppHeader, Avatar, BottomSheet, Card, ConfirmationDialog, EmptyState, FilterChip, ListRow, LoadingSkeleton,
  PrimaryButton, SearchBar, SecondaryButton, SectionTitle, SegmentedControl, StatusChip, TextArea, TextInput, Toggle,
} from "./ui";
import { CATEGORIES, CHAIN, UNIVERSITY, isActive, type Complaint, PROGRAMS } from "./data";
import { cn } from "@/lib/utils";

/* ---------- Tab bar ---------- */
export function BottomTabBar() {
  const { tab, goTab, notifs } = useStore();
  const unread = notifs.filter((n) => n.unread).length;
  const items: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "complaints", label: "My Complaints", icon: FileText },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="grid grid-cols-4 border-t border-border bg-card pb-5 pt-2">
      {items.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => goTab(id)} className={cn("relative flex flex-col items-center gap-1 py-1 text-[11px] font-medium", tab === id ? "text-primary" : "text-muted-foreground")}>
          <span className="relative">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
            {id === "notifications" && unread > 0 && <span className="absolute -right-1.5 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread}</span>}
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function Tabs() {
  const { tab } = useStore();
  return (
    <div className="flex h-full flex-col">
      <div className="no-scrollbar relative flex-1 overflow-y-auto">
        {tab === "home" && <HomeTab />}
        {tab === "complaints" && <ComplaintsTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "profile" && <ProfileTab />}
      </div>
      <BottomTabBar />
    </div>
  );
}

/* ---------- Complaint card ---------- */
function ComplaintCard({ c }: { c: Complaint }) {
  const { openDetail } = useStore();
  const lvl = CHAIN[c.level - 1];
  return (
    <Card onClick={() => openDetail(c.id)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{c.id}</span>
        <StatusChip status={c.status} />
      </div>
      <p className="mt-2 truncate text-[15px] font-semibold text-foreground">{c.title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">With: {lvl.title}</span>
        <span className="shrink-0">Updated {c.updated}</span>
      </div>
    </Card>
  );
}

/* ---------- Home ---------- */
function HomeTab() {
  const { profile, complaints, push, goTab } = useStore();
  const first = profile.name.split(" ")[0] || "there";
  const active = complaints.filter((c) => isActive(c.status)).length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const latest = ["CMP-2026-0042", "CMP-2026-0038", "CMP-2026-0032"].map((id) => complaints.find((c) => c.id === id)!).filter(Boolean);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div>
      <div className="bg-navy px-5 pb-20 pt-14 text-navy-foreground">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{greet}, {first} 👋</h1>
            <p className="mt-1 text-sm opacity-80">{UNIVERSITY.name}</p>
            <p className="text-xs opacity-60">{UNIVERSITY.campus}</p>
          </div>
          <button onClick={() => goTab("notifications")} aria-label="Notifications" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-foreground/10"><Bell className="h-5 w-5" strokeWidth={1.75} /></button>
        </div>
      </div>
      <div className="-mt-14 space-y-5 px-5 pb-6">
        <Card className="p-5">
          <button onClick={() => push("submit")} className="flex w-full items-center gap-4 text-left">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Plus className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold text-foreground">Submit a Complaint</span>
              <span className="block text-sm text-muted-foreground">Report an issue and track its resolution.</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </button>
        </Card>
        <div className="grid grid-cols-2 gap-3">
          <Card onClick={() => goTab("complaints")}><p className="text-sm text-muted-foreground">Active</p><p className="mt-1 text-3xl font-bold text-primary">{Math.min(active, 99) && 3 + (active - 10 > 0 ? active - 10 : 0)}</p></Card>
          <Card onClick={() => goTab("complaints")}><p className="text-sm text-muted-foreground">Resolved</p><p className="mt-1 text-3xl font-bold text-success">{resolved + 1}</p></Card>
        </div>
        <div>
          <SectionTitle action={<button onClick={() => goTab("complaints")} className="text-sm font-medium text-primary">See all</button>}>Latest Complaints</SectionTitle>
          <div className="space-y-3">{latest.map((c) => <ComplaintCard key={c.id} c={c} />)}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- My complaints ---------- */
const FILTERS = ["All", "Active", "Resolved", "Rejected"] as const;
function ComplaintsTab() {
  const { complaints, push } = useStore();
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const [cat, setCat] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 900); return () => clearTimeout(t); }, []);
  const list = useMemo(() => complaints.filter((c) => {
    if (f === "Active" && !isActive(c.status)) return false;
    if (f === "Resolved" && c.status !== "Resolved") return false;
    if (f === "Rejected" && c.status !== "Rejected") return false;
    if (cat && c.category !== cat) return false;
    const s = q.toLowerCase();
    return !s || c.id.toLowerCase().includes(s) || c.title.toLowerCase().includes(s);
  }), [complaints, f, q, cat]);
  return (
    <div>
      <AppHeader title="My Complaints" right={
        <button onClick={() => setSheet(true)} aria-label="Filters" className={cn("grid h-10 w-10 place-items-center rounded-xl", cat ? "bg-accent text-primary" : "text-foreground")}><SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} /></button>
      } />
      <div className="space-y-3 px-5 pt-4">
        <SearchBar value={q} onChange={setQ} />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((x) => <FilterChip key={x} active={f === x} onClick={() => setF(x)}>{x}</FilterChip>)}
        </div>
        {cat && <button onClick={() => setCat(null)} className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-primary">{cat}<X className="h-3 w-3" /></button>}
      </div>
      <div className="space-y-3 px-5 py-4">
        {loading ? <LoadingSkeleton /> : list.length === 0 ? (
          <><EmptyState icon={FolderOpen} title={q || cat || f !== "All" ? "No matching complaints" : "No complaints yet"} text="Your submitted complaints will appear here." />
            <PrimaryButton onClick={() => push("submit")}><Plus className="h-5 w-5" />Submit a Complaint</PrimaryButton></>
        ) : list.map((c) => <ComplaintCard key={c.id} c={c} />)}
      </div>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Filter by category">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => <FilterChip key={c} active={cat === c} onClick={() => { setCat(cat === c ? null : c); }}>{c}</FilterChip>)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={() => { setCat(null); setSheet(false); }}>Clear</SecondaryButton>
          <PrimaryButton onClick={() => setSheet(false)}>Apply</PrimaryButton>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ---------- Notifications ---------- */
function NotificationsTab() {
  const { notifs, setNotifs, openDetail, toast } = useStore();
  const [sheet, setSheet] = useState(false);
  const [seg, setSeg] = useState<"All" | "Unread">("All");
  const shown = seg === "All" ? notifs : notifs.filter((n) => n.unread);
  const iconFor = { review: FileText, escalate: ArrowUpRight, resolved: CheckCircle2, rejected: XCircle };
  const colorFor = { review: "bg-accent text-primary", escalate: "bg-escalation/15 text-escalation", resolved: "bg-success/12 text-success", rejected: "bg-destructive/10 text-destructive" };
  return (
    <div>
      <AppHeader title="Notifications" right={<button aria-label="Options" onClick={() => setSheet(true)} className="grid h-10 w-10 place-items-center rounded-xl text-foreground"><MoreHorizontal className="h-5 w-5" /></button>} />
      <div className="px-5 pt-4"><SegmentedControl options={["All", "Unread"]} value={seg} onChange={setSeg} /></div>
      {shown.length === 0 ? (
        <EmptyState icon={BellOff} title={seg === "Unread" ? "You're all caught up." : "No new notifications"} text="We'll let you know when something changes." />
      ) : (
        <div className="mt-3">
          {shown.map((n) => {
            const Icon = iconFor[n.kind];
            return (
              <button key={n.id} onClick={() => { setNotifs(notifs.map((x) => x.id === n.id ? { ...x, unread: false } : x)); openDetail(n.complaintId); }}
                className={cn("flex w-full items-start gap-3 border-b border-border px-5 py-4 text-left", n.unread && "bg-accent/50")}>
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", colorFor[n.kind])}><Icon className="h-5 w-5" strokeWidth={1.75} /></span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm text-foreground", n.unread && "font-semibold")}>{n.text}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{n.time}</span>
                </span>
                {n.unread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              </button>
            );
          })}
        </div>
      )}
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Notification options">
        <div className="-mx-5">
          <ListRow icon={Check} label="Mark all as read" onClick={() => { setNotifs(notifs.map((n) => ({ ...n, unread: false }))); setSheet(false); toast("All marked as read"); }} />
          <ListRow icon={Trash2} label="Clear all notifications" danger onClick={() => { setNotifs([]); setSheet(false); toast("Notifications cleared"); }} />
        </div>
      </BottomSheet>
    </div>
  );
}

/* ---------- Profile ---------- */
function ProfileTab() {
  const { profile, push, setRolePicker, replace, toast } = useStore();
  const [dlg, setDlg] = useState<null | "logout" | "delete">(null);
  return (
    <div>
      <AppHeader title="Profile" />
      <div className="space-y-4 px-5 py-5">
        <Card className="flex flex-col items-center p-6 text-center">
          <Avatar name={profile.name || "Student"} size={72} />
          <p className="mt-3 text-lg font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.program}</p>
          <p className="mt-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">{profile.roll}</p>
          <div className="mt-4 w-full border-t border-border pt-4 text-sm">
            <p className="font-medium text-foreground">{UNIVERSITY.name}</p>
            <p className="text-muted-foreground">{UNIVERSITY.campus}</p>
          </div>
        </Card>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <ListRow icon={Pencil} label="Edit Profile" onClick={() => push("editProfile")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          <ListRow icon={Bell} label="Notification Settings" onClick={() => push("notifSettings")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          <ListRow icon={Shield} label="Privacy" onClick={() => push("privacy")} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
          <ListRow icon={Repeat} label="Switch Role" onClick={() => setRolePicker(true)} right={<ChevronRight className="h-4 w-4 text-muted-foreground" />} />
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <ListRow icon={LogOut} label="Logout" onClick={() => setDlg("logout")} />
          <ListRow icon={Trash2} label="Delete My Account" danger onClick={() => setDlg("delete")} />
        </div>
        <p className="text-center text-xs text-muted-foreground">ResolveU v1.0 · Demo prototype</p>
      </div>
      <ConfirmationDialog open={dlg === "logout"} title="Log out?" text="You'll need to verify your email again to sign back in." confirmLabel="Log out" onCancel={() => setDlg(null)} onConfirm={() => { setDlg(null); replace("welcome"); toast("Logged out"); }} />
      <ConfirmationDialog open={dlg === "delete"} title="Delete your account?" text="This action cannot be undone." confirmLabel="Delete Account" danger onCancel={() => setDlg(null)} onConfirm={() => { setDlg(null); replace("welcome"); toast("Account deleted"); }} />
    </div>
  );
}

export function EditProfile() {
  const { profile, setProfile, back, toast } = useStore();
  const [p, setP] = useState(profile);
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Edit Profile" onBack={back} />
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="flex justify-center"><button onClick={() => toast("Photo picker opened")} className="relative"><Avatar name={p.name || "S"} size={80} /><span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground"><Camera className="h-3.5 w-3.5" /></span></button></div>
        <TextInput label="Name" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        <label className="block"><span className="mb-1.5 block text-sm font-medium text-foreground">Program</span>
          <select value={p.program} onChange={(e) => setP({ ...p, program: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground">{PROGRAMS.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <TextInput label="Roll number" value={p.roll} onChange={(e) => setP({ ...p, roll: e.target.value })} />
        <TextInput label="Phone" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
        <TextInput label="Email" value={p.email || "student@csu.edu.pk"} disabled className="bg-muted text-muted-foreground" />
      </div>
      <div className="border-t border-border bg-card p-4"><PrimaryButton onClick={() => { setProfile(p); back(); toast("Profile updated"); }}>Save changes</PrimaryButton></div>
    </div>
  );
}

export function NotifSettings() {
  const { back, toast } = useStore();
  const [s, setS] = useState({ "Complaint updates": true, Messages: true, Escalations: true, "Resolution updates": false });
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Notification Settings" onBack={back} />
      <div className="px-5 py-5">
        <div className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
          {(Object.keys(s) as (keyof typeof s)[]).map((k) => (
            <div key={k} className="flex items-center justify-between gap-3 px-4 py-4">
              <span className="text-[15px] font-medium text-foreground">{k}</span>
              <Toggle on={s[k]} onChange={(v) => { setS({ ...s, [k]: v }); toast(`${k} ${v ? "on" : "off"}`); }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Privacy() {
  const { back, toast } = useStore();
  const [anon, setAnon] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Privacy" onBack={back} />
      <div className="space-y-4 px-5 py-5">
        <Card><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[15px] font-medium text-foreground">Default to anonymous</p><p className="text-sm text-muted-foreground">Pre-select anonymous on new complaints.</p></div><Toggle on={anon} onChange={(v) => { setAnon(v); toast("Preference saved"); }} /></div></Card>
        <Card><div className="flex gap-3"><Lock className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} /><p className="text-sm text-muted-foreground">Internal staff remarks are never shown to students. Anonymous complaints hide your identity from all handling staff.</p></div></Card>
      </div>
    </div>
  );
}

/* ---------- Submit stepper ---------- */
const STEPS = ["Category", "Details", "Attachments", "Anonymity", "Review"];
export function SubmitFlow() {
  const { back, replace, push, toast, complaints, setComplaints } = useStore();
  const [step, setStep] = useState(0);
  const [cat, setCat] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [anon, setAnon] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const canNext = [!!cat, title.trim().length > 2 && desc.trim().length > 5, true, true, true][step];
  const submit = () => {
    const c: Complaint = { id: "CMP-2026-0048", title, category: cat, status: "Submitted", level: 1, updated: "Just now", description: desc, attachments: files, anonymous: anon, timeline: [{ level: 1, status: "Submitted", date: "Today" }], messages: [] };
    setComplaints([c, ...complaints.filter((x) => x.id !== c.id)]);
    replace("tabs"); push("success"); toast("Complaint submitted");
  };
  const addFile = (kind: string) => { if (files.length < 3) setFiles([...files, `${kind}_${files.length + 1}.${kind === "document" ? "pdf" : "jpg"}`]); setSheet(false); };
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Submit a Complaint" subtitle={`Step ${step + 1} of 5 · ${STEPS[step]}`} onBack={() => (step ? setStep(step - 1) : back())} />
      <div className="flex gap-1.5 bg-card px-5 pb-3">
        {STEPS.map((_, i) => <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-primary" : "bg-border")} />)}
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
        {step === 0 && (
          <div>
            <h2 className="mb-4 text-xl font-bold text-foreground">What's this about?</h2>
            <div className="space-y-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c)} className={cn("flex w-full items-center justify-between rounded-xl border bg-card p-4 text-left", cat === c ? "border-primary ring-4 ring-primary/10" : "border-border")}>
                  <span className="text-[15px] font-medium text-foreground">{c}</span>
                  <span className={cn("grid h-5 w-5 place-items-center rounded-full border-2", cat === c ? "border-primary bg-primary" : "border-border")}>{cat === c && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}</span>
                </button>
              ))}
            </div>
            {cat === "Harassment" && <div className="mt-4 flex gap-3 rounded-xl border border-primary/20 bg-accent p-4"><Lock className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} /><p className="text-sm font-medium text-foreground">Your complaint will be handled confidentially.</p></div>}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Describe the issue</h2>
            <TextInput label="Title" placeholder="e.g. Exam result correction" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
            <TextArea label="Description" placeholder="Explain what happened, when, and where…" value={desc} onChange={(e) => setDesc(e.target.value)} rows={6} />
            <p className="text-right text-xs text-muted-foreground">{desc.length}/1000</p>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">Attachments</h2>
            <p className="mt-1 text-sm text-muted-foreground">Attach up to 3 photos/files</p>
            <div className="mt-4 space-y-2">
              {files.length === 0 && <div className="rounded-xl border border-dashed border-border"><EmptyState icon={Paperclip} title="No files attached" /></div>}
              {files.map((f, i) => (
                <div key={f} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">{f.endsWith("pdf") ? <File className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground">{f}</span><span className="text-xs text-muted-foreground">{(240 + i * 130)} KB</span></span>
                  <button aria-label="Remove" onClick={() => setFiles(files.filter((x) => x !== f))} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
            <SecondaryButton className="mt-4" disabled={files.length >= 3} onClick={() => setSheet(true)}><Plus className="h-5 w-5" />Add attachment ({files.length}/3)</SecondaryButton>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-foreground">Anonymous submission</h2>
            <Card className="mt-4">
              <div className="flex items-center justify-between gap-3"><span className="text-[15px] font-semibold text-foreground">Submit anonymously</span><Toggle on={anon} onChange={setAnon} /></div>
              <p className="mt-2 text-sm text-muted-foreground">Your identity will be hidden from staff handling this complaint.</p>
            </Card>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">Review & Submit</h2>
            {[["Category", cat], ["Title", title], ["Description", desc], ["Attachments", files.length ? files.join(", ") : "No files attached"], ["Anonymous", anon ? "Yes — identity hidden" : "No"]].map(([k, v], i) => (
              <Card key={k}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 break-words text-sm font-medium text-foreground">{v}</p></div>
                <button onClick={() => setStep([0, 1, 1, 2, 3][i])} className="shrink-0 text-xs font-medium text-primary">Edit</button></div></Card>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-border bg-card p-4">
        {step < 4 ? <PrimaryButton disabled={!canNext} onClick={() => setStep(step + 1)}>Continue</PrimaryButton>
          : <PrimaryButton onClick={() => (anon ? setConfirm(true) : submit())}><Send className="h-5 w-5" strokeWidth={1.75} />Submit Complaint</PrimaryButton>}
      </div>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Add attachment">
        <div className="-mx-5">
          <ListRow icon={Camera} label="Take photo" onClick={() => addFile("photo")} />
          <ListRow icon={ImageIcon} label="Choose from gallery" onClick={() => addFile("image")} />
          <ListRow icon={File} label="Upload document" onClick={() => addFile("document")} />
        </div>
      </BottomSheet>
      <ConfirmationDialog open={confirm} title="Submit anonymously?" text="Staff won't see your identity, and they won't be able to contact you directly outside this complaint." confirmLabel="Submit" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); submit(); }} />
    </div>
  );
}

export function Success() {
  const { replace, openDetail, goTab } = useStore();
  return (
    <div className="flex h-full flex-col items-center px-6 pb-10 pt-28 text-center">
      <div className="grid h-24 w-24 place-items-center rounded-full bg-success/12"><CheckCircle2 className="h-14 w-14 text-success" strokeWidth={1.5} /></div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">Complaint submitted successfully</h1>
      <p className="mt-2 text-sm text-muted-foreground">It has been routed to Level 1 · Counselor.</p>
      <Card className="mt-8 text-left">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Tracking ID</span><span className="text-sm font-semibold text-foreground">CMP-2026-0048</span></div>
        <div className="mt-3 flex items-center justify-between"><span className="text-sm text-muted-foreground">Status</span><StatusChip status="Submitted" /></div>
      </Card>
      <div className="mt-auto w-full space-y-3">
        <PrimaryButton onClick={() => { replace("tabs"); openDetail("CMP-2026-0048"); }}>Track Complaint</PrimaryButton>
        <SecondaryButton onClick={() => goTab("home")}>Back to Home</SecondaryButton>
      </div>
    </div>
  );
}

/* ---------- Detail ---------- */
export function Detail() {
  const { back, detailId, complaints, setComplaints, toast } = useStore();
  const c = complaints.find((x) => x.id === detailId) ?? complaints[0];
  const [msg, setMsg] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [appeal, setAppeal] = useState(false);
  const [appealText, setAppealText] = useState("");
  const update = (patch: Partial<Complaint>) => setComplaints(complaints.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
  const visible = c.timeline.filter((t) => !t.internal);
  const terminal = c.status === "Resolved" || c.status === "Rejected";

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Complaint Details" onBack={back} />
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Card>
          <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{c.id}</span><StatusChip status={c.status} /></div>
          <h2 className="mt-2 text-xl font-bold text-foreground">{c.title}</h2>
          <div className="mt-3 rounded-xl bg-muted p-3 text-sm"><span className="text-muted-foreground">With: </span><span className="font-medium text-foreground">Level {c.level} · {CHAIN[c.level - 1].title}</span></div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Category</p><p className="font-medium text-foreground">{c.category}</p></div>
            <div><p className="text-xs text-muted-foreground">Submitted as</p><p className="font-medium text-foreground">{c.anonymous ? "Anonymous" : "Named"}</p></div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Description</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground">{c.description}</p>
        </Card>

        {c.status === "Resolved" && (
          <Card className="border-success/30">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.75} /><p className="font-semibold text-foreground">Complaint Resolved</p></div>
            {feedbackDone ? <p className="mt-2 text-sm text-muted-foreground">Thanks for your feedback!</p> : <>
              <p className="mt-3 text-sm text-foreground">Are you satisfied with the resolution?</p>
              <div className="mt-3 flex justify-between">
                {[1, 2, 3, 4, 5].map((n) => <button key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star className={cn("h-8 w-8", n <= rating ? "fill-warning text-warning" : "text-border")} strokeWidth={1.5} /></button>)}
              </div>
              <div className="mt-3"><TextArea placeholder="Add a comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} /></div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SecondaryButton onClick={() => { update({ status: "Under Review", updated: "Just now" }); toast("Complaint reopened"); }}>Reopen Complaint</SecondaryButton>
                <PrimaryButton variant="navy" onClick={() => { setFeedbackDone(true); toast("Resolution accepted"); }}>Accept Resolution</PrimaryButton>
              </div>
              <PrimaryButton className="mt-3" disabled={!rating} onClick={() => { setFeedbackDone(true); toast("Feedback submitted"); }}>Submit Feedback</PrimaryButton>
            </>}
          </Card>
        )}
        {c.status === "Rejected" && (
          <Card className="border-destructive/30">
            <div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" strokeWidth={1.75} /><p className="font-semibold text-foreground">Complaint Rejected</p></div>
            <p className="mt-2 text-xs text-muted-foreground">Reason</p>
            <p className="text-sm text-foreground">{c.rejectReason}</p>
            <SecondaryButton className="mt-4" onClick={() => setAppeal(true)}>Appeal</SecondaryButton>
          </Card>
        )}

        <Card>
          <SectionTitle>Escalation Timeline</SectionTitle>
          <ol>
            <li className="relative flex gap-3 pb-5">
              <span className="absolute left-[11px] top-6 h-full w-px bg-success" />
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>
              <div><p className="text-sm font-semibold text-foreground">Student</p><p className="text-xs text-muted-foreground">Complaint filed · {visible[0]?.date ?? "Today"}</p></div>
            </li>
            {CHAIN.map((lvl, i) => {
              const entry = visible.find((t) => t.level === lvl.level);
              const state = lvl.level < c.level || (lvl.level === c.level && terminal) ? "done" : lvl.level === c.level ? "current" : "pending";
              const last = i === CHAIN.length - 1;
              return (
                <li key={lvl.level} className={cn("relative flex gap-3", !last && "pb-5")}>
                  {!last && <span className={cn("absolute left-[11px] top-6 h-full w-px", state === "done" ? "bg-success" : "bg-border")} />}
                  <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    state === "done" ? "bg-success text-primary-foreground" : state === "current" ? "bg-primary text-primary-foreground ring-4 ring-primary/15" : "border-2 border-border bg-card text-muted-foreground")}>
                    {state === "done" ? <Check className="h-3.5 w-3.5" /> : lvl.level}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("text-sm font-semibold", state === "pending" ? "text-muted-foreground" : "text-foreground")}>Level {lvl.level} · {lvl.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{entry?.date ?? `${lvl.days} days${lvl.final ? " · FINAL" : ""}`}</span>
                    </div>
                    <p className={cn("text-xs", state === "current" ? "font-medium text-primary" : "text-muted-foreground")}>{entry ? entry.status : "Pending"}</p>
                    {entry?.remark && <p className="mt-2 rounded-lg bg-muted p-2.5 text-xs text-foreground">"{entry.remark}"</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <Card>
          <SectionTitle>Attachments</SectionTitle>
          {c.attachments.length === 0 ? <p className="text-sm text-muted-foreground">No files attached</p> : (
            <div className="space-y-2">{c.attachments.map((f) => (
              <button key={f} onClick={() => toast(`Opening ${f}`)} className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">{f.endsWith("pdf") ? <File className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{f}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}</div>
          )}
        </Card>

        <Card>
          <SectionTitle>Messages</SectionTitle>
          {c.messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : (
            <div className="space-y-2">{c.messages.map((m, i) => (
              <div key={i} className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", m.from === "me" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                {m.text}<span className="mt-1 block text-[10px] opacity-70">{m.time}</span>
              </div>
            ))}</div>
          )}
        </Card>
      </div>
      <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3">
        <button aria-label="Attach" onClick={() => toast("Attachment picker opened")} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted-foreground"><Paperclip className="h-5 w-5" strokeWidth={1.75} /></button>
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Add a message..." className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary" />
        <button aria-label="Send" disabled={!msg.trim()} onClick={() => { update({ messages: [...c.messages, { from: "me", text: msg, time: "Just now" }] }); setMsg(""); toast("Message sent"); }}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"><Send className="h-5 w-5" strokeWidth={1.75} /></button>
      </div>
      <BottomSheet open={appeal} onClose={() => setAppeal(false)} title="Appeal decision">
        <TextArea label="Appeal reason" placeholder="Explain why this decision should be reconsidered…" value={appealText} onChange={(e) => setAppealText(e.target.value)} rows={5} />
        <PrimaryButton className="mt-4" disabled={appealText.trim().length < 5} onClick={() => { setAppeal(false); update({ status: "Under Review", updated: "Just now" }); toast("Appeal submitted"); }}>Submit Appeal</PrimaryButton>
      </BottomSheet>
    </div>
  );
}
