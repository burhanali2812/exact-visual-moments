import { useEffect, useRef, useState } from "react";
import { Building2, Camera, CheckCircle2, Loader2, Mail, ShieldCheck, Users, UserCog, GraduationCap, Crown, Briefcase } from "lucide-react";
import { useStore } from "./store";
import { AppHeader, BottomSheet, PrimaryButton, SecondaryButton, TextInput } from "./ui";
import { PROGRAMS, UNIVERSITY } from "./data";
import { cn } from "@/lib/utils";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="grid place-items-center rounded-2xl bg-navy text-navy-foreground">
      <ShieldCheck style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={1.75} />
    </div>
  );
}

export function Splash() {
  const { replace } = useStore();
  useEffect(() => { const t = setTimeout(() => replace("welcome"), 1400); return () => clearTimeout(t); }, [replace]);
  return (
    <button onClick={() => replace("welcome")} className="flex h-full w-full flex-col items-center justify-center gap-4 bg-navy text-navy-foreground">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-primary"><ShieldCheck className="h-10 w-10" strokeWidth={1.75} /></div>
      <p className="text-2xl font-bold tracking-tight">ResolveU</p>
      <p className="text-sm opacity-70">University Complaint Portal</p>
    </button>
  );
}

export function Welcome() {
  const { push, setRolePicker } = useStore();
  return (
    <div className="flex h-full flex-col px-6 pb-10 pt-24">
      <Logo size={64} />
      <h1 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-foreground">University complaints, resolved properly.</h1>
      <p className="mt-3 text-[15px] text-muted-foreground">Submit, track and escalate issues with full transparency — from your phone.</p>
      <div className="mt-10 space-y-3 rounded-2xl border border-border bg-card p-4">
        {["Track every step of your complaint", "Submit anonymously when needed", "Automatic escalation on delays"].map((t) => (
          <div key={t} className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="h-5 w-5 text-success" strokeWidth={1.75} />{t}</div>
        ))}
      </div>
      <div className="mt-auto space-y-3">
        <PrimaryButton onClick={() => push("email")}><Mail className="h-5 w-5" strokeWidth={1.75} />Continue with email</PrimaryButton>
        <SecondaryButton onClick={() => setRolePicker(true)}>Demo mode</SecondaryButton>
      </div>
    </div>
  );
}

export function RolePicker() {
  const { rolePicker, setRolePicker, enterDemoStudent, toast } = useStore();
  const roles = [
    { label: "Super Admin", icon: Crown },
    { label: "University Admin", icon: Building2 },
    { label: "Staff Level 1", icon: UserCog },
    { label: "Staff Level 3", icon: Briefcase },
    { label: "Student", icon: GraduationCap },
  ];
  return (
    <BottomSheet open={rolePicker} onClose={() => setRolePicker(false)} title="Select demo role">
      <div className="space-y-2">
        {roles.map(({ label, icon: Icon }) => {
          const enabled = label === "Student";
          return (
            <button key={label} onClick={() => { setRolePicker(false); if (enabled) { enterDemoStudent(); toast("Signed in as Student"); } else toast(`${label} is available in a separate build`); }}
              className={cn("flex w-full items-center gap-3 rounded-xl border p-4 text-left", enabled ? "border-primary bg-accent" : "border-border")}>
              <Icon className={cn("h-5 w-5", enabled ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
              <span className="flex-1 text-[15px] font-medium text-foreground">{label}</span>
              {enabled ? <span className="text-xs font-medium text-primary">student@csu.edu.pk</span> : <span className="text-xs text-muted-foreground">Other build</span>}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

export function EnterEmail() {
  const { back, push, email, setEmail } = useStore();
  const [err, setErr] = useState("");
  const submit = () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid university email");
    if (!email.toLowerCase().endsWith(UNIVERSITY.domain)) return push("unavailable");
    push("otp");
  };
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="" onBack={back} />
      <div className="flex flex-1 flex-col px-6 pt-4 pb-10">
        <h1 className="text-2xl font-bold text-foreground">Enter your university email</h1>
        <p className="mt-2 text-sm text-muted-foreground">We'll send a 6-digit code. No password needed.</p>
        <div className="mt-8"><TextInput type="email" placeholder="you@csu.edu.pk" value={email} error={err} onChange={(e) => { setEmail(e.target.value); setErr(""); }} autoFocus /></div>
        <button onClick={() => setEmail("student@csu.edu.pk")} className="mt-3 self-start text-sm font-medium text-primary">Use demo: student@csu.edu.pk</button>
        <PrimaryButton className="mt-auto" onClick={submit}>Send code</PrimaryButton>
      </div>
    </div>
  );
}

export function EnterOtp() {
  const { back, push, email, enterDemoStudent } = useStore();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secs, setSecs] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { if (secs <= 0) return; const t = setTimeout(() => setSecs(secs - 1), 1000); return () => clearTimeout(t); }, [secs]);
  const set = (i: number, v: string) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const n = [...code]; n[i] = d; setCode(n); setErr(false);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const verify = () => {
    const c = code.join("");
    if (c.length < 6 || c === "000000") { setErr(true); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.toLowerCase() === "student@csu.edu.pk") enterDemoStudent(); else push("name");
    }, 1200);
  };
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="" onBack={back} />
      <div className="flex flex-1 flex-col px-6 pt-4 pb-10">
        <h1 className="text-2xl font-bold text-foreground">Enter verification code</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sent to <span className="font-medium text-foreground">{email}</span></p>
        <div className="mt-8 flex justify-between gap-2">
          {code.map((d, i) => (
            <input key={i} ref={(el) => { refs.current[i] = el; }} inputMode="numeric" value={d} onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
              className={cn("h-14 w-12 rounded-xl border bg-card text-center text-xl font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10", err ? "border-destructive" : "border-border")} />
          ))}
        </div>
        {err && <p className="mt-3 text-sm text-destructive">Incorrect code. Please try again. (Tip: any 6 digits except 000000)</p>}
        <div className="mt-6 flex items-center justify-between text-sm">
          <button disabled={secs > 0} onClick={() => setSecs(30)} className="font-medium text-primary disabled:text-muted-foreground">
            {secs > 0 ? `Resend code in 0:${String(secs).padStart(2, "0")}` : "Resend code"}
          </button>
          <button onClick={back} className="font-medium text-primary">Change email</button>
        </div>
        <button onClick={() => setCode("482913".split(""))} className="mt-4 self-start text-sm text-muted-foreground underline">Autofill demo code</button>
        <PrimaryButton className="mt-auto" onClick={verify} disabled={loading}>
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" />Verifying…</> : "Verify"}
        </PrimaryButton>
      </div>
    </div>
  );
}

export function NewName() {
  const { back, push, profile, setProfile, email } = useStore();
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="" onBack={back} />
      <div className="flex flex-1 flex-col px-6 pt-4 pb-10">
        <h1 className="text-2xl font-bold text-foreground">Welcome! What's your name?</h1>
        <p className="mt-2 text-sm text-muted-foreground">This is how staff will address you.</p>
        <div className="mt-8"><TextInput label="Full name" placeholder="e.g. Burhan Ali" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value, email })} autoFocus /></div>
        <PrimaryButton className="mt-auto" disabled={!profile.name.trim()} onClick={() => push("profileGate")}>Continue</PrimaryButton>
      </div>
    </div>
  );
}

export function Unavailable() {
  const { back, push, email } = useStore();
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="" onBack={back} />
      <div className="flex flex-1 flex-col items-center px-6 pt-16 pb-10 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-warning/15 text-warning"><Building2 className="h-10 w-10" strokeWidth={1.5} /></div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Your university isn't on ResolveU yet</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn't find a university for <span className="font-medium text-foreground">{email.split("@")[1] ? "@" + email.split("@")[1] : email}</span>. Request access and we'll notify your administration.</p>
        <div className="mt-auto w-full space-y-3">
          <PrimaryButton onClick={() => push("requestAccess")}><Users className="h-5 w-5" strokeWidth={1.75} />Request access</PrimaryButton>
          <SecondaryButton onClick={back}>Try another email</SecondaryButton>
        </div>
      </div>
    </div>
  );
}

export function RequestAccess() {
  const { replace, toast } = useStore();
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-success" strokeWidth={1.5} />
      <h1 className="mt-4 text-xl font-bold text-foreground">Request sent</h1>
      <p className="mt-2 text-sm text-muted-foreground">We'll email you when your university joins ResolveU.</p>
      <PrimaryButton className="mt-8" onClick={() => { replace("welcome"); toast("Access requested"); }}>Back to start</PrimaryButton>
    </div>
  );
}

export function ProfileGate() {
  const { profile, setProfile, replace, toast, back } = useStore();
  const fields = [profile.name, profile.program, profile.roll, profile.phone];
  const done = fields.filter((f) => f.trim()).length;
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Complete your profile" onBack={back} />
      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm font-medium text-foreground">Complete your profile to continue</div>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{done}/4 required</span></div>
          <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(done / 4) * 100}%` }} /></div>
        </div>
        <button onClick={() => toast("Photo picker opened")} className="mx-auto mt-6 flex flex-col items-center gap-2">
          <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground"><Camera className="h-6 w-6" strokeWidth={1.5} /></span>
          <span className="text-xs font-medium text-primary">Add photo (optional)</span>
        </button>
        <div className="mt-6 space-y-4">
          <TextInput label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Burhan Ali" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Program</span>
            <select value={profile.program} onChange={(e) => setProfile({ ...profile, program: e.target.value })} className="h-12 w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary">
              <option value="">Select program</option>
              {PROGRAMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          <TextInput label="Roll number" value={profile.roll} onChange={(e) => setProfile({ ...profile, roll: e.target.value })} placeholder="FA23-BSE-028" />
          <TextInput label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+92 300 1234567" />
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="text-muted-foreground">Assigned university</p><p className="font-medium text-foreground">{UNIVERSITY.name}</p>
            <p className="mt-3 text-muted-foreground">Campus</p><p className="font-medium text-foreground">{UNIVERSITY.campus}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border bg-card p-4">
        <PrimaryButton disabled={done < 4} onClick={() => { replace("tabs"); toast("Profile completed"); }}>Complete profile</PrimaryButton>
      </div>
    </div>
  );
}
