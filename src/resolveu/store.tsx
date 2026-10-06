import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { COMPLAINTS, NOTIFICATIONS, type Complaint, type Notif } from "./data";

export type Screen =
  | "splash" | "welcome" | "email" | "otp" | "name" | "unavailable" | "profileGate"
  | "tabs" | "submit" | "success" | "detail" | "editProfile" | "notifSettings" | "privacy" | "requestAccess";
export type Tab = "home" | "complaints" | "notifications" | "profile";

export interface Profile { name: string; program: string; roll: string; phone: string; email: string }

function useStoreValue() {
  const [stack, setStack] = useState<Screen[]>(["splash"]);
  const [tab, setTab] = useState<Tab>("home");
  const [detailId, setDetailId] = useState<string>("CMP-2026-0042");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({ name: "", program: "", roll: "", phone: "", email: "" });
  const [complaints, setComplaints] = useState<Complaint[]>(COMPLAINTS);
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFICATIONS);
  const [rolePicker, setRolePicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const screen = stack[stack.length - 1];
  return {
    screen, tab, setTab, detailId, email, setEmail, profile, setProfile,
    complaints, setComplaints, notifs, setNotifs, rolePicker, setRolePicker, toastMsg,
    push: (s: Screen) => setStack((st) => [...st, s]),
    replace: (s: Screen) => setStack([s]),
    back: () => setStack((st) => (st.length > 1 ? st.slice(0, -1) : st)),
    openDetail: (id: string) => { setDetailId(id); setStack((st) => [...st, "detail"]); },
    goTab: (t: Tab) => { setTab(t); setStack(["tabs"]); },
    toast: (m: string) => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 2200); },
    enterDemoStudent: () => {
      setEmail("student@csu.edu.pk");
      setProfile({ name: "Burhan Ali", program: "BS Software Engineering", roll: "FA23-BSE-028", phone: "+92 300 1234567", email: "student@csu.edu.pk" });
      setTab("home");
      setStack(["tabs"]);
    },
  };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const v = useStoreValue();
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("no store");
  return c;
}
