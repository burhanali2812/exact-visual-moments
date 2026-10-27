import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { deleteAccount } from './account.functions';
import { COMPLAINTS, NOTIFICATIONS, type Complaint, type Notif } from './data';
import { complaintSchema, profileSchema } from './validation';

export type Screen = 'splash' | 'welcome' | 'email' | 'otp' | 'name' | 'unavailable' | 'profileGate' | 'tabs' | 'submit' | 'success' | 'detail' | 'editProfile' | 'notifSettings' | 'privacy' | 'requestAccess';
export type Tab = 'home' | 'complaints' | 'notifications' | 'profile';
export interface Profile { name: string; program: string; roll: string; phone: string; email: string; avatar?: string }
const emptyProfile: Profile = { name: '', program: '', roll: '', phone: '', email: '' };
export const defaultPreferences = { anonymous: false, 'Complaint updates': true, Messages: true, Escalations: true, 'Resolution updates': false };
function useStoreValue() {
  const [stack, setStack] = useState<Screen[]>(['splash']);
  const [tab, setTab] = useState<Tab>('home');
  const [detailId, setDetailId] = useState('');
  const [lastId, setLastId] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [rolePicker, setRolePicker] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(false);
  const userRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const queryClient = useQueryClient();
  const removeAccount = useServerFn(deleteAccount);
  const toast = (m: string) => { setToastMsg(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToastMsg(null), 5000); };
  const refresh = async () => {
    if (!userRef.current) return;
    const owner = userRef.current;
    const [cs, ms, ns] = await Promise.all([
      supabase.from('complaints').select('*').order('updated_at', { ascending: false }),
      supabase.from('complaint_messages').select('*').order('created_at'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    ]);
    if (cs.error || ms.error || ns.error) throw new Error('Could not load your complaints. Please try again.');
    if (userRef.current !== owner) return;
    setComplaints((cs.data ?? []).map((c) => ({ id: c.id, title: c.title, category: c.category, status: c.status as Complaint['status'], level: c.level, updated: new Date(c.updated_at).toLocaleDateString(), description: c.description, attachments: c.attachments, anonymous: c.anonymous, timeline: (Array.isArray(c.timeline) && c.timeline.length ? c.timeline : [{ level: 1, status: 'Submitted', date: new Date(c.created_at).toLocaleDateString() }]) as unknown as Complaint['timeline'], rejectReason: c.reject_reason ?? undefined, accepted: c.accepted, rating: c.rating ?? undefined, messages: (ms.data ?? []).filter((m) => m.complaint_id === c.id).map((m) => ({ from: m.sender as 'me' | 'staff', text: m.text, time: new Date(m.created_at).toLocaleString() })) })));
    setNotifs((ns.data ?? []).map((n) => ({ id: n.id, text: n.text, complaintId: n.complaint_id, unread: n.unread, kind: n.kind as Notif['kind'], time: new Date(n.created_at).toLocaleString() })));
  };
  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setReady(true); setStack(['welcome']); return; }
    userRef.current = user.id; setDemo(false); setEmail(user.email ?? '');
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (error) throw new Error('Could not load your profile. Please try again.');
    const p = { name: data.name, program: data.program, roll: data.roll, phone: data.phone, email: user.email ?? '', avatar: data.avatar };
    setProfile(p); setPreferences({ ...defaultPreferences, ...(data.preferences as object) });
    await refresh(); setStack([profileSchema.safeParse(p).success ? 'tabs' : 'name']); setReady(true);
  };
  useEffect(() => {
    let active = true;
    const start = () => { if (active) void loadUser().catch((e) => { toast(e.message); setReady(true); setStack(['welcome']); }); };
    start();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') setTimeout(start, 0);
      if (event === 'SIGNED_OUT') { userRef.current = null; setDemo(false); setComplaints([]); setNotifs([]); setProfile(emptyProfile); setStack(['welcome']); }
    });
    return () => { active = false; subscription.unsubscribe(); clearTimeout(timer.current); };
  }, []);
  useEffect(() => {
    if (!ready || demo || !userRef.current) return;
    const id = setInterval(() => { void refresh().catch(() => {}); }, 30000);
    return () => clearInterval(id);
  }, [ready, demo]);
  const run = async (fn: () => Promise<void>, message?: string) => {
    if (busy) return false; setBusy(true);
    try { await fn(); if (message) toast(message); return true; } catch (e) { toast(e instanceof Error ? e.message : 'Something went wrong. Try again.'); return false; } finally { setBusy(false); }
  };
  const saveProfile = (p: Profile) => run(async () => {
    const parsed = profileSchema.safeParse(p); if (!parsed.success) throw new Error('Complete all profile fields within the allowed lengths.');
    if (!demo) { const { error } = await supabase.from('profiles').update({ ...parsed.data, avatar: p.avatar ?? '' }).eq('id', userRef.current ?? ''); if (error) throw new Error('Could not save your profile.'); }
    setProfile(p);
  }, 'Profile saved');
  const savePreferences = async (p: typeof preferences) => {
    if (!demo) { const { error } = await supabase.from('profiles').update({ preferences: p }).eq('id', userRef.current ?? ''); if (error) { toast('Could not save preferences.'); return; } }
    setPreferences(p); toast('Preferences saved');
  };
  const upload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) throw new Error('Files must be 10 MB or smaller.');
    if (!['image/jpeg','image/png','image/webp','application/pdf'].includes(file.type)) throw new Error('Choose a JPG, PNG, WebP or PDF file.');
    if (!userRef.current || demo) throw new Error('Sign in to upload real files.');
    const path = `${userRef.current}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('resolveu-files').upload(path, file); if (error) throw new Error('Upload failed. Please try again.'); return path;
  };
  const openFile = (path: string) => run(async () => {
    if (demo) throw new Error('Sample attachments are not real files.');
    const { data, error } = await supabase.storage.from('resolveu-files').download(path); if (error) throw new Error('Could not open this attachment.');
    const url = URL.createObjectURL(data); const a = document.createElement('a'); a.href = url; a.download = path.split('/').pop() ?? 'attachment'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  const submitComplaint = (input: { title: string; category: string; description: string; anonymous: boolean; attachments: string[] }) => run(async () => {
    const parsed = complaintSchema.safeParse(input); if (!parsed.success) throw new Error('Check the complaint details and attachments.');
    let id: string;
    if (demo) { id = `DEMO-${crypto.randomUUID().slice(0,8)}`; setComplaints((cs) => [{ ...parsed.data, id, status: 'Submitted', level: 1, updated: 'Just now', timeline: [{ level: 1, status: 'Submitted', date: 'Today' }], messages: [] }, ...cs]); }
    else { const { data, error } = await supabase.from('complaints').insert(parsed.data).select('id').single(); if (error) throw new Error('Could not submit your complaint. Please try again.'); id = data.id; await refresh(); }
    setLastId(id); setStack(['tabs','success']);
  }, 'Complaint submitted');
  const message = (id: string, text: string) => run(async () => {
    if (!text.trim() || text.length > 1000) throw new Error('Messages must contain 1–1000 characters.');
    if (demo) setComplaints((cs) => cs.map((c) => c.id === id ? { ...c, messages: [...c.messages, { from: 'me', text: text.trim(), time: 'Just now' }] } : c));
    else { const { error } = await supabase.from('complaint_messages').insert({ complaint_id: id, text: text.trim() }); if (error) throw new Error('Could not send your message.'); await refresh(); }
  }, 'Message sent');
  const action = (id: string, kind: string, reason = '', stars?: number) => run(async () => {
    if (demo) setComplaints((cs) => cs.map((c) => c.id === id ? { ...c, status: kind === 'reopen' || kind === 'appeal' ? 'Under Review' : c.status, accepted: kind === 'accept' || kind === 'feedback' } : c));
    else { const { error } = await supabase.rpc('resolveu_action', { complaint: id, action: kind, reason, stars }); if (error) throw new Error('This action could not be saved. Please refresh and try again.'); await refresh(); }
  }, 'Complaint updated');
  const notificationAction = (kind: 'read' | 'clear', id?: string | number) => run(async () => {
    if (!demo) { let query = kind === 'clear' ? supabase.from('notifications').delete() : supabase.from('notifications').update({ unread: false }); query = query.eq('user_id', userRef.current ?? ''); if (id) query = query.eq('id', String(id)); const { error } = await query; if (error) throw new Error('Could not update notifications.'); }
    setNotifs((ns) => kind === 'clear' ? [] : ns.map((n) => !id || n.id === id ? { ...n, unread: false } : n));
  });
  const signOut = (remove = false) => run(async () => {
    await queryClient.cancelQueries(); queryClient.clear();
    if (remove && !demo) await removeAccount();
    if (!demo) { const { error } = await supabase.auth.signOut(); if (error) throw new Error('Could not sign out. Try again.'); }
    userRef.current = null; setDemo(false); setComplaints([]); setNotifs([]); setProfile(emptyProfile); setPreferences(defaultPreferences); setEmail(''); setStack(['welcome']);
  }, remove ? 'Account deleted' : 'Logged out');
  return { screen: stack.at(-1), tab, setTab, detailId, lastId, email, setEmail, profile, setProfile, preferences, savePreferences, complaints, notifs, rolePicker, setRolePicker, toastMsg, toast, ready, busy, demo, saveProfile, upload, openFile, submitComplaint, message, action, notificationAction, signOut,
    push: (s: Screen) => setStack((st) => [...st, s]), replace: (s: Screen) => setStack([s]), back: () => setStack((st) => st.length > 1 ? st.slice(0,-1) : st),
    openDetail: (id: string) => { setDetailId(id); setStack((st) => [...st,'detail']); }, goTab: (t: Tab) => { setTab(t); setStack(['tabs']); },
    enterDemoStudent: () => { if (userRef.current) { toast('Log out before entering demo mode.'); return; } setDemo(true); setProfile({ name: 'Burhan Ali', program: 'BS Software Engineering', roll: 'FA23-BSE-028', phone: '+92 300 1234567', email: 'student@csu.edu.pk' }); setComplaints(COMPLAINTS); setNotifs(NOTIFICATIONS); setTab('home'); setStack(['tabs']); },
  };
}
type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) { return <Ctx.Provider value={useStoreValue()}>{children}</Ctx.Provider>; }
export function useStore() { const c = useContext(Ctx); if (!c) throw new Error('No store'); return c; }
