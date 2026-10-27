CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL DEFAULT '' CHECK (length(name)<=100), program text NOT NULL DEFAULT '', roll text NOT NULL DEFAULT '' CHECK(length(roll)<=50), phone text NOT NULL DEFAULT '' CHECK(length(phone)<=30), avatar text NOT NULL DEFAULT '', preferences jsonb NOT NULL DEFAULT '{"anonymous":false,"Complaint updates":true,"Messages":true,"Escalations":true,"Resolution updates":false}'::jsonb
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING(id=auth.uid());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING(id=auth.uid()) WITH CHECK(id=auth.uid());
CREATE TABLE public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, role text NOT NULL DEFAULT 'student' CHECK(role IN ('student','staff','admin')), UNIQUE(user_id,role));
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.resolveu_signup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id) VALUES(NEW.id); INSERT INTO public.user_roles(user_id,role) VALUES(NEW.id,'student'); RETURN NEW; END $$;
CREATE TRIGGER resolveu_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.resolveu_signup();
INSERT INTO public.profiles(id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id,role) SELECT id,'student' FROM auth.users ON CONFLICT DO NOTHING;
CREATE SEQUENCE public.complaint_tracking_seq;
CREATE TABLE public.complaints (
 id text PRIMARY KEY DEFAULT ('CMP-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.complaint_tracking_seq')::text,6,'0')),
 user_id uuid NOT NULL DEFAULT auth.uid(), title text NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 80), category text NOT NULL CHECK(category IN ('Academic','Examination/Result','Fee & Finance','Hostel','Transport','Harassment','Faculty Behavior','Facilities','Other')),
 description text NOT NULL CHECK(length(trim(description)) BETWEEN 6 AND 1000), anonymous boolean NOT NULL DEFAULT false,
 attachments text[] NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted','Under Review','In Progress','Escalated','Resolved','Rejected','Overdue')), level integer NOT NULL DEFAULT 1 CHECK(level BETWEEN 1 AND 5), timeline jsonb NOT NULL DEFAULT '[]', reject_reason text, rating integer CHECK(rating BETWEEN 1 AND 5), feedback text CHECK(length(feedback)<=1000), accepted boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), due_at timestamptz NOT NULL DEFAULT now()+interval '3 days'
);
GRANT SELECT,INSERT ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
GRANT USAGE ON SEQUENCE public.complaint_tracking_seq TO authenticated,service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY complaints_read ON public.complaints FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY complaints_insert ON public.complaints FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND status='Submitted' AND level=1 AND accepted=false AND rating IS NULL AND feedback IS NULL AND jsonb_array_length(timeline)=0 AND reject_reason IS NULL AND array_length(attachments,1)<=3 OR user_id=auth.uid() AND status='Submitted' AND level=1 AND accepted=false AND rating IS NULL AND feedback IS NULL AND jsonb_array_length(timeline)=0 AND reject_reason IS NULL AND cardinality(attachments)=0);
CREATE INDEX complaints_owner ON public.complaints(user_id,updated_at DESC);
CREATE TABLE public.complaint_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE, user_id uuid NOT NULL DEFAULT auth.uid(), text text NOT NULL CHECK(length(trim(text)) BETWEEN 1 AND 1000), sender text NOT NULL DEFAULT 'me' CHECK(sender IN ('me','staff')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.complaint_messages TO authenticated;
GRANT ALL ON public.complaint_messages TO service_role;
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_read ON public.complaint_messages FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.complaints WHERE id=complaint_id AND user_id=auth.uid()));
CREATE POLICY messages_insert ON public.complaint_messages FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND sender='me' AND EXISTS(SELECT 1 FROM public.complaints WHERE id=complaint_id AND user_id=auth.uid()));
CREATE TABLE public.notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, complaint_id text NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE, text text NOT NULL, unread boolean NOT NULL DEFAULT true, kind text NOT NULL DEFAULT 'review' CHECK(kind IN ('review','escalate','resolved','rejected')), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,UPDATE,DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY notifications_delete ON public.notifications FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.resolveu_complaint_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE f text; BEGIN IF cardinality(NEW.attachments)>3 THEN RAISE EXCEPTION 'Maximum 3 attachments'; END IF; FOREACH f IN ARRAY NEW.attachments LOOP IF split_part(f,'/',1)<>NEW.user_id::text THEN RAISE EXCEPTION 'Invalid attachment owner'; END IF; END LOOP; IF TG_OP='INSERT' THEN NEW.created_at=now(); NEW.updated_at=now(); NEW.due_at=now()+interval '3 days'; ELSE NEW.updated_at=now(); END IF; RETURN NEW; END $$;
CREATE TRIGGER resolveu_complaint_validate BEFORE INSERT OR UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.resolveu_complaint_validate();
CREATE FUNCTION public.resolveu_notify() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE k text; pref text; BEGIN IF TG_OP='UPDATE' AND NEW.status=OLD.status THEN RETURN NEW; END IF; k=CASE WHEN NEW.status='Resolved' THEN 'resolved' WHEN NEW.status='Rejected' THEN 'rejected' WHEN NEW.status IN ('Escalated','Overdue') THEN 'escalate' ELSE 'review' END; pref=CASE WHEN k='resolved' THEN 'Resolution updates' WHEN k='escalate' THEN 'Escalations' ELSE 'Complaint updates' END; IF COALESCE((SELECT (preferences->>pref)::boolean FROM public.profiles WHERE id=NEW.user_id),true) THEN INSERT INTO public.notifications(user_id,complaint_id,text,kind) VALUES(NEW.user_id,NEW.id,'Complaint '||NEW.id||' · '||NEW.status,k); END IF; RETURN NEW; END $$;
CREATE TRIGGER resolveu_notify AFTER INSERT OR UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.resolveu_notify();
CREATE FUNCTION public.resolveu_action(complaint text, action text, reason text DEFAULT '', stars integer DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE c public.complaints; BEGIN SELECT * INTO c FROM public.complaints WHERE id=complaint AND user_id=auth.uid() FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Complaint not found'; END IF; IF length(reason)>1000 THEN RAISE EXCEPTION 'Message too long'; END IF; IF action IN ('reopen','appeal') THEN IF (action='reopen' AND c.status<>'Resolved') OR (action='appeal' AND (c.status<>'Rejected' OR length(trim(reason))<5)) THEN RAISE EXCEPTION 'Action not allowed'; END IF; UPDATE public.complaints SET status='Under Review',accepted=false,due_at=now()+CASE level WHEN 1 THEN interval '3 days' WHEN 2 THEN interval '3 days' WHEN 3 THEN interval '5 days' WHEN 4 THEN interval '5 days' ELSE interval '7 days' END,timeline=timeline||jsonb_build_array(jsonb_build_object('level',level,'status',CASE WHEN action='appeal' THEN 'Appeal submitted' ELSE 'Reopened' END,'date',to_char(now(),'Mon DD'),'remark',reason)) WHERE id=c.id; ELSIF action IN ('accept','feedback') THEN IF c.status<>'Resolved' OR (action='feedback' AND (stars IS NULL OR stars<1 OR stars>5)) THEN RAISE EXCEPTION 'Action not allowed'; END IF; UPDATE public.complaints SET accepted=true,rating=stars,feedback=reason WHERE id=c.id; ELSE RAISE EXCEPTION 'Unknown action'; END IF; END $$;
REVOKE ALL ON FUNCTION public.resolveu_action(text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolveu_action(text,text,text,integer) TO authenticated;
CREATE FUNCTION public.resolveu_escalate() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE affected integer; BEGIN UPDATE public.complaints SET level=least(level+1,5),status=CASE WHEN level=5 THEN 'Overdue' ELSE 'Escalated' END,due_at=CASE WHEN level=5 THEN 'infinity'::timestamptz ELSE now()+CASE WHEN level=1 THEN interval '3 days' WHEN level IN(2,3) THEN interval '5 days' ELSE interval '7 days' END END,timeline=timeline||jsonb_build_array(jsonb_build_object('level',least(level+1,5),'status',CASE WHEN level=5 THEN 'Overdue' ELSE 'Escalated' END,'date',to_char(now(),'Mon DD'),'remark','Response deadline passed.')) WHERE status NOT IN ('Resolved','Rejected') AND due_at<=now(); GET DIAGNOSTICS affected=ROW_COUNT; RETURN affected; END $$;
REVOKE ALL ON FUNCTION public.resolveu_escalate() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.resolveu_escalate() TO service_role;
CREATE POLICY resolveu_files_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='resolveu-files' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY resolveu_files_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='resolveu-files' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY resolveu_files_delete ON storage.objects FOR DELETE TO authenticated USING(bucket_id='resolveu-files' AND (storage.foldername(name))[1]=auth.uid()::text);