import { StoreProvider, useStore } from "./store";
import { Toast } from "./ui";
import { EnterEmail, EnterOtp, NewName, ProfileGate, RequestAccess, RolePicker, Splash, Unavailable, Welcome } from "./auth";
import { Detail, EditProfile, NotifSettings, Privacy, SubmitFlow, Success, Tabs } from "./student";

function Screens() {
  const { screen, toastMsg } = useStore();
  const map = {
    splash: Splash, welcome: Welcome, email: EnterEmail, otp: EnterOtp, name: NewName, unavailable: Unavailable,
    requestAccess: RequestAccess, profileGate: ProfileGate, tabs: Tabs, submit: SubmitFlow, success: Success,
    detail: Detail, editProfile: EditProfile, notifSettings: NotifSettings, privacy: Privacy,
  } as const;
  const S = map[screen ?? "welcome"];
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <S />
      <RolePicker />
      <Toast message={toastMsg} />
    </div>
  );
}

export function ResolveUApp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stage sm:p-8">
      <div className="relative h-[100dvh] w-full overflow-hidden sm:h-[844px] sm:w-[390px] sm:rounded-[52px] sm:shadow-phone sm:ring-[12px] sm:ring-bezel">
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-[70] hidden h-7 w-28 -translate-x-1/2 rounded-full bg-bezel sm:block" />
        <StoreProvider><Screens /></StoreProvider>
      </div>
    </div>
  );
}
