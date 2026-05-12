import aisleImage from "./assets/aisle.jpg";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  STORES,
  INVENTORY,
  CHECKOUT_LANES,
  FOOD_PRODUCT,
  STORE_MAP,
  CATEGORIES,
  CATEGORY_ICONS,
  translations,
  type Lang,
  type TranslationKey,
} from "./data";
import {
  TopBar,
  PrimaryButton,
  SecondaryButton,
  Card,
  StatusBadge,
  Input,
  Select,
  FilterChip,
  Toggle,
  ProgressSteps,
  Toast,
  ConfirmDialog,
  useToasts,
} from "./ui";

/* ============================================================
 * GLOBAL APP CONTEXT
 * ============================================================ */
type Screen =
  | "splash"
  | "login"
  | "home"
  | "navHome"
  | "navMap"
  | "navAR"
  | "navArrived"
  | "checkoutItems"
  | "checkoutLanes"
  | "checkoutDone"
  | "helpType"
  | "helpConfirm"
  | "reportType"
  | "reportCart"
  | "reportDone"
  | "scan"
  | "product"
  | "tempGraph"
  | "vendorView"
  | "outdoor"
  | "traffic"
  | "invSelect"
  | "invResults"
  | "profile"
  | "friend"
  | "settings";

type FontSize = "standard" | "large" | "xlarge";

type AppState = {
  screen: Screen;
  history: Screen[];
  go: (s: Screen) => void;
  back: () => void;
  reset: (s?: Screen) => void;

  dark: boolean;
  setDark: (v: boolean) => void;
  notifications: boolean;
  setNotifications: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;

  // accessibility
  accessibilityMode: boolean;
  setAccessibilityMode: (v: boolean) => void;
  fontSize: FontSize;
  setFontSize: (v: FontSize) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  extraSpacing: boolean;
  setExtraSpacing: (v: boolean) => void;
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  dataToggles: { location: boolean; analytics: boolean; personalization: boolean };
  setDataToggles: (v: { location: boolean; analytics: boolean; personalization: boolean }) => void;

  // language
  lang: Lang;
  setLang: (v: Lang) => void;
  t: (k: TranslationKey) => string;

  // location
  locationGranted: boolean | null; // null = unset
  setLocationGranted: (v: boolean | null) => void;
  showLocationSheet: boolean;
  setShowLocationSheet: (v: boolean) => void;

  // user
  cartId: string;
  setCartId: (v: string) => void;
  storeId: number;
  setStoreId: (v: number) => void;
  isGuest: boolean;
  setIsGuest: (v: boolean) => void;

  // drawer
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;

  // ephemeral flow state
  selectedProductId: number | null;
  setSelectedProductId: (v: number | null) => void;
  itemCount: number;
  setItemCount: (v: number) => void;
  selectedLaneId: number | null;
  setSelectedLaneId: (v: number | null) => void;
  helpType: string;
  setHelpType: (v: string) => void;
  reportType: string;
  setReportType: (v: string) => void;
  inventoryStoreMode: string;
  setInventoryStoreMode: (v: string) => void;
  selectedInvIds: number[];
  setSelectedInvIds: (v: number[]) => void;

  toast: { msg: string; type: "success" | "error" | "info" } | null;
  showToast: (m: string, t?: "success" | "error" | "info") => void;
  clearToast: () => void;
};

const Ctx = createContext<AppState | null>(null);
export const useApp = () => useContext(Ctx)!;

function usePersisted<T>(key: string, def: T, parse: (s: string) => T = (s) => s as unknown as T) {
  const [v, setV] = useState<T>(() => {
    if (typeof window === "undefined") return def;
    try {
      const s = localStorage.getItem(key);
      return s == null ? def : parse(s);
    } catch {
      return def;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, typeof v === "object" ? JSON.stringify(v) : String(v));
    } catch { }
  }, [key, v]);
  return [v, setV] as const;
}

function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>("splash");
  const [history, setHistory] = useState<Screen[]>([]);
  const [dark, setDark] = usePersisted<boolean>("sysmart_theme", false, (s) => s === "true");
  const [notifications, setNotifications] = usePersisted<boolean>(
    "sysmart_notif",
    true,
    (s) => s === "true",
  );
  const [reduceMotion, setReduceMotion] = usePersisted<boolean>(
    "sysmart_rm",
    false,
    (s) => s === "true",
  );
  const [accessibilityMode, setAccessibilityMode] = usePersisted<boolean>(
    "sysmart_a11y",
    false,
    (s) => s === "true",
  );
  const [fontSize, setFontSize] = usePersisted<FontSize>(
    "sysmart_fontsize",
    "standard",
    (s) => s as FontSize,
  );
  const [highContrast, setHighContrast] = usePersisted<boolean>(
    "sysmart_hc",
    false,
    (s) => s === "true",
  );
  const [extraSpacing, setExtraSpacing] = usePersisted<boolean>(
    "sysmart_spacing",
    false,
    (s) => s === "true",
  );
  const [consentGiven, setConsentGiven] = usePersisted<boolean>(
    "sysmart_consent",
    false,
    (s) => s === "true",
  );
  const [dataToggles, setDataToggles] = usePersisted<{
    location: boolean;
    analytics: boolean;
    personalization: boolean;
  }>("sysmart_toggles", { location: false, analytics: false, personalization: false }, (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return { location: false, analytics: false, personalization: false };
    }
  });
  const [lang, setLang] = usePersisted<Lang>("sysmart_lang", "en", (s) =>
    s === "my" ? "my" : "en",
  );
  const [locationGrantedRaw, setLocationGrantedRaw] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    const s = localStorage.getItem("sysmart_loc");
    return s == null ? null : s === "true";
  });
  const setLocationGranted = (v: boolean | null) => {
    setLocationGrantedRaw(v);
    try {
      if (v === null) localStorage.removeItem("sysmart_loc");
      else localStorage.setItem("sysmart_loc", String(v));
    } catch { }
  };
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [cartId, setCartId] = useState("");
  const [storeId, setStoreId] = useState(1);
  const [isGuest, setIsGuest] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [itemCount, setItemCount] = useState(10);
  const [selectedLaneId, setSelectedLaneId] = useState<number | null>(null);
  const [helpType, setHelpType] = useState("");
  const [reportType, setReportType] = useState("");
  const [inventoryStoreMode, setInventoryStoreMode] = useState<string>("all");
  const [selectedInvIds, setSelectedInvIds] = useState<number[]>([]);
  const toaster = useToasts();

  const t = (k: TranslationKey) => translations[lang][k] || translations.en[k] || k;

  const go = (s: Screen) => {
    setHistory((h) => [...h, screen]);
    setScreen(s);
    setDrawerOpen(false);
  };
  const back = () => {
    setHistory((h) => {
      if (h.length === 0) {
        if (screen === "scan" || screen === "navHome" || screen === "outdoor") {
          setScreen("home");
        }
        return h;
      }
      const prev = h[h.length - 1];
      setScreen(prev);
      return h.slice(0, -1);
    });
  };
  const reset = (s: Screen = "home") => {
    setHistory([]);
    setScreen(s);
    setDrawerOpen(false);
  };

  useEffect(() => {
    if (screen === "splash") {
      const t = setTimeout(() => setScreen("login"), 1800);
      return () => clearTimeout(t);
    }
  }, [screen]);

  const value: AppState = {
    screen,
    history,
    go,
    back,
    reset,
    dark,
    setDark,
    notifications,
    setNotifications,
    reduceMotion,
    setReduceMotion,
    accessibilityMode,
    setAccessibilityMode,
    fontSize,
    setFontSize,
    extraSpacing,
    setExtraSpacing,
    highContrast,
    setHighContrast,
    consentGiven,
    setConsentGiven,
    dataToggles,
    setDataToggles,
    lang,
    setLang,
    t,
    locationGranted: locationGrantedRaw,
    setLocationGranted,
    showLocationSheet,
    setShowLocationSheet,
    cartId,
    setCartId,
    storeId,
    setStoreId,
    isGuest,
    setIsGuest,
    drawerOpen,
    setDrawerOpen,
    selectedProductId,
    setSelectedProductId,
    itemCount,
    setItemCount,
    selectedLaneId,
    setSelectedLaneId,
    helpType,
    setHelpType,
    reportType,
    setReportType,
    inventoryStoreMode,
    setInventoryStoreMode,
    selectedInvIds,
    setSelectedInvIds,
    toast: toaster.toast,
    showToast: toaster.show,
    clearToast: toaster.clear,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ============================================================
 * HELPERS
 * ============================================================ */
const qtyOf = (item: (typeof INVENTORY)[number], storeId: number): number => {
  const k = `store${storeId}_qty` as "store1_qty";
  return (item[k] as number) ?? 0;
};

function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center justify-center rounded-xl bg-[var(--sm-primary)] text-white"
        style={{ width: size, height: size }}
      >
        <svg
          width={size * 0.6}
          height={size * 0.6}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
      </div>
      <span
        className="font-bold tracking-tight text-[var(--sm-text)]"
        style={{ fontSize: size * 0.55 }}
      >
        sys<span className="text-[var(--sm-primary)]">MART</span>
      </span>
    </div>
  );
}

function CheckmarkCircle() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--sm-success)]/15">
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--sm-success)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" className="sm-check-path" />
      </svg>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)] px-2 py-3 text-center">
      <p className="text-[11px] font-semibold uppercase text-[var(--sm-text-2)]">{label}</p>
      <p className="text-[16px] font-bold text-[var(--sm-text)]">{value}</p>
    </div>
  );
}

/* ============================================================
 * BOTTOM SHEET MODAL (generic)
 * ============================================================ */
function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-2xl bg-[var(--sm-surface)] p-5"
        style={{ animation: "slideUpSheet 0.28s cubic-bezier(0.32,0.72,0,1)" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--sm-border)]" />
        {children}
      </div>
    </div>
  );
}

/* ============================================================
 * LOCATION PERMISSION SHEET
 * ============================================================ */
function LocationSheet() {
  const a = useApp();
  if (!a.showLocationSheet) return null;
  const grant = (v: boolean) => {
    a.setLocationGranted(v);
    a.setShowLocationSheet(false);
    a.showToast(
      v ? "📍 " + a.t("locationActive") + " — " + a.t("nearestToYou") : a.t("locationOff"),
      v ? "success" : "info",
    );
  };
  return (
    <BottomSheet open onClose={() => a.setShowLocationSheet(false)}>
      <div className="text-center">
        <div className="mx-auto mb-2 text-[44px]">📍</div>
        <h3 className="text-[18px] font-semibold text-[var(--sm-text)]">{a.t("allowLocation")}</h3>
        <p className="mt-2 text-[14px] text-[var(--sm-text-2)]">{a.t("locationDesc")}</p>
      </div>
      <div className="mt-5 space-y-2">
        <PrimaryButton onClick={() => grant(true)}>{a.t("allowBtn")}</PrimaryButton>
        <button
          onClick={() => grant(false)}
          className="h-12 w-full text-[15px] font-medium text-[var(--sm-text-2)]"
        >
          {a.t("notNow")}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ============================================================
 * SCREENS
 * ============================================================ */
function SplashScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--sm-bg)] text-center sm-fade-in">
      <Logo size={56} />
      <p className="text-[15px] text-[var(--sm-text-2)]">Your Smart Supermarket Assistant</p>
      <div className="mt-6 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-[var(--sm-primary)]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function LoginScreen() {
  const a = useApp();
  const [cart, setCart] = useState("");
  const [store, setStore] = useState("1");
  const [err, setErr] = useState("");

  const start = () => {
    if (!cart.trim()) {
      setErr(a.t("cartError"));
      return;
    }
    a.setCartId(cart.trim());
    a.setStoreId(Number(store));
    a.setIsGuest(false);
    a.reset("home");
    setTimeout(() => a.showToast(a.t("cartLinked"), "success"), 100);
  };
  const browse = () => {
    a.setCartId("");
    a.setIsGuest(true);
    a.setStoreId(Number(store));
    a.reset("home");
  };

  return (
    <div className="flex min-h-full flex-col px-6 pb-8 pt-12 sm-fade-in">
      <div className="flex justify-center">
        <Logo size={56} />
      </div>
      <h1 className="mt-8 text-center text-[24px] font-bold text-[var(--sm-text)]">
        {a.t("welcome")}
      </h1>
      <p className="mt-2 text-center text-[15px] text-[var(--sm-text-2)]">{a.t("linkCart")}</p>
      <div className="mt-8 space-y-4">
        <Select
          label={a.t("selectStore")}
          value={store}
          onChange={setStore}
          options={STORES.map((s) => ({ value: String(s.id), label: s.name }))}
        />
        <Input
          label="Cart ID"
          value={cart}
          onChange={(v) => {
            setCart(v);
            setErr("");
          }}
          placeholder={a.t("enterCart")}
          error={err}
        />
      </div>
      <div className="mt-8 space-y-3">
        {/* Compact Consent Banner (HCI Principle: Informed Consent) */}
        {!a.consentGiven && (
          <div className="mb-4 rounded-xl border border-[var(--sm-primary)]/20 bg-[var(--sm-primary)]/5 p-4">
            <p className="mb-2 text-[14px] font-bold text-[var(--sm-text)]">
              🛡️ {a.t("consentBanner")}
            </p>
            <p className="mb-3 text-[12px] leading-relaxed text-[var(--sm-text-2)]">
              {a.t("consentText")}
            </p>
            <button
              onClick={() => a.setConsentGiven(true)}
              className="flex h-10 w-full items-center justify-center rounded-lg bg-[var(--sm-primary)] text-[13px] font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              ✅ {a.t("acceptContinue")}
            </button>
          </div>
        )}

        <PrimaryButton disabled={!a.consentGiven} onClick={start}>
          {a.t("startShopping")}
        </PrimaryButton>
        <button
          disabled={!a.consentGiven}
          onClick={browse}
          className={`h-12 w-full text-[15px] font-medium transition ${!a.consentGiven ? "opacity-50 grayscale" : "text-[var(--sm-secondary)] underline-offset-4 hover:underline"}`}
        >
          {a.t("browseWithout")}
        </button>
      </div>
    </div>
  );
}

/* ===== HOME ===== */
function HomeScreen() {
  const a = useApp();
  const store = STORES.find((s) => s.id === a.storeId)!;
  const [cartReqOpen, setCartReqOpen] = useState(false);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    const g = h < 12 ? a.t("goodMorning") : h < 18 ? a.t("goodAfternoon") : a.t("goodEvening");
    return `${g}, ${a.isGuest ? a.t("guest") : a.t("shopper")}`;
  }, [a.lang, a.isGuest]);

  // Trigger location sheet on first visit if user has cart
  useEffect(() => {
    if (a.locationGranted === null) {
      const t = setTimeout(() => a.setShowLocationSheet(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  type Svc = {
    icon: string;
    titleK: TranslationKey;
    descK: TranslationKey;
    to: Screen;
    lock: boolean;
  };
  const services: Svc[] = [
    { icon: "🗺️", titleK: "indoorNav", descK: "indoorNavDesc", to: "navHome", lock: a.isGuest },
    {
      icon: "🏁",
      titleK: "fastestCheckout",
      descK: "fastestCheckoutDesc",
      to: "checkoutItems",
      lock: a.isGuest,
    },
    { icon: "🤝", titleK: "iNeedHelp", descK: "iNeedHelpDesc", to: "helpType", lock: a.isGuest },
    {
      icon: "⚠️",
      titleK: "reportIssue",
      descK: "reportIssueDesc",
      to: "reportType",
      lock: a.isGuest,
    },
    { icon: "🌡️", titleK: "foodTracker", descK: "foodTrackerDesc", to: "scan", lock: a.isGuest },
    {
      icon: "🚗",
      titleK: "outdoorServices",
      descK: "outdoorServicesDesc",
      to: "outdoor",
      lock: false,
    },
  ];

  const handleService = (s: Svc) => {
    if (s.lock) {
      setCartReqOpen(true);
      return;
    }
    a.go(s.to);
  };

  return (
    <div className="pb-4 sm-fade-in">
      <div className="flex h-14 items-center gap-2 border-b border-[var(--sm-border)] bg-[var(--sm-surface)] px-3">
        <button
          aria-label="Menu"
          onClick={() => a.setDrawerOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--sm-text)]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="flex flex-1 justify-center">
          <Logo size={28} />
        </div>
        <button
          aria-label="Toggle dark mode"
          onClick={() => a.setDark(!a.dark)}
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--sm-text)]"
        >
          {a.dark ? "☀️" : "🌙"}
        </button>
        <button
          aria-label="Notifications"
          onClick={() => a.showToast("No new notifications", "info")}
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--sm-text)]"
        >
          🔔
        </button>
      </div>

      {a.isGuest && (
        <div className="flex items-center justify-between gap-2 bg-[var(--sm-warning)]/10 px-4 py-2 text-[12.5px]">
          <span className="font-semibold text-[var(--sm-warning)]">👤 {a.t("guestMode")}</span>
          <button
            onClick={() => a.reset("login")}
            className="font-semibold text-[var(--sm-secondary)] underline"
          >
            {a.t("login")}
          </button>
        </div>
      )}

      <div className="px-4 pt-5">
        <h2 className="text-[22px] font-bold text-[var(--sm-text)]">{greeting} 👋</h2>
        <div className="mt-1 flex items-center gap-2 text-[14px] text-[var(--sm-text-2)]">
          <span>
            {store.name} · {a.cartId ? `${a.cartId} linked` : a.t("guestMode")}
          </span>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button
          onClick={() => a.go("invSelect")}
          className="flex h-[52px] w-full items-center gap-3 rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)] px-4 text-left"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--sm-text-2)]"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <span className="flex-1 text-[15px] text-[var(--sm-text-2)]">
            {a.t("searchPlaceholder")}
          </span>
        </button>
      </div>

      {a.isGuest ? (
        <div className="mx-4 mt-5 rounded-xl border-2 border-dashed border-[var(--sm-primary)]/40 bg-[var(--sm-primary)]/5 p-4">
          <p className="text-[14px] font-semibold text-[var(--sm-text)]">
            🛒 {a.t("linkCartUnlock")}
          </p>
          <button
            onClick={() => a.reset("login")}
            className="mt-3 h-10 rounded-lg bg-[var(--sm-primary)] px-4 text-[13px] font-semibold text-white"
          >
            {a.t("linkMyCart")}
          </button>
        </div>
      ) : (
        <div className="mt-5 flex gap-3 overflow-x-auto px-4 pb-1">
          <StatusMini
            icon="🅿️"
            label={`${store.parking_available} ${a.t("of")} ${store.parking_total} ${a.t("spotsFree")}`}
            status={store.parking_available > 1 ? "green" : "yellow"}
          />
          <StatusMini
            icon="🚦"
            label={`${a.t("trafficLabel")}: ${a.t(("traffic" + store.traffic) as any)}`}
            status={
              store.traffic_level === 1 ? "green" : store.traffic_level === 2 ? "yellow" : "red"
            }
          />
          <StatusMini icon="🛒" label={a.t("laneFastest")} status="green" />
        </div>
      )}

      <div className="px-4 pt-6">
        <h3 className="mb-3 text-[15px] font-semibold text-[var(--sm-text-2)]">
          {a.t("services")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {services.map((s) => (
            <Card
              key={s.titleK}
              onClick={() => handleService(s)}
              className={`!p-3.5 ${s.lock ? "opacity-80" : ""}`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[28px]">{s.icon}</span>
                {s.lock && (
                  <span className="text-[var(--sm-text-2)]" title={a.t("cartRequired")}>
                    🔒
                  </span>
                )}
              </div>
              <p className="mt-2 text-[14px] font-semibold text-[var(--sm-text)]">
                {a.t(s.titleK)}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--sm-text-2)]">
                {s.lock ? a.t("cartRequired") : a.t(s.descK)}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <CartRequiredSheet open={cartReqOpen} onClose={() => setCartReqOpen(false)} />
    </div>
  );
}

function StatusMini({
  icon,
  label,
  status,
}: {
  icon: string;
  label: string;
  status: "green" | "yellow" | "red";
}) {
  const dot =
    status === "green"
      ? "bg-[var(--sm-success)]"
      : status === "yellow"
        ? "bg-[var(--sm-warning)]"
        : "bg-[var(--sm-error)]";
  return (
    <div className="flex min-w-[160px] shrink-0 items-center gap-3 rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)] px-3 py-2.5">
      <span className="text-[22px]">{icon}</span>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
        </div>
        <p className="text-[12.5px] font-medium leading-tight text-[var(--sm-text)]">{label}</p>
      </div>
    </div>
  );
}

function CartRequiredSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const a = useApp();
  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="text-center">
        <div className="mx-auto mb-2 text-[44px]">🛒</div>
        <h3 className="text-[18px] font-semibold text-[var(--sm-text)]">{a.t("cartRequired")}</h3>
        <p className="mt-2 text-[14px] text-[var(--sm-text-2)]">{a.t("cartRequiredDesc")}</p>
      </div>
      <div className="mt-5 space-y-2">
        <PrimaryButton
          onClick={() => {
            onClose();
            a.reset("login");
          }}
        >
          {a.t("linkMyCart")}
        </PrimaryButton>
        <button
          onClick={onClose}
          className="h-12 w-full text-[15px] font-medium text-[var(--sm-text-2)]"
        >
          {a.t("continueGuest")}
        </button>
      </div>
    </BottomSheet>
  );
}

/* ===== INDOOR NAVIGATION ===== */
function NavHomeScreen() {
  const a = useApp();
  const [tab, setTab] = useState<"cat" | "search">("cat");
  const [search, setSearch] = useState("");
  const [openCat, setOpenCat] = useState<string | null>(null);

  const cats = CATEGORIES.filter((c) => c !== "All");
  const filtered = INVENTORY.filter((i) =>
    search.trim() === "" ? false : i.name.toLowerCase().includes(search.toLowerCase()),
  );

  const pickProduct = (id: number) => {
    a.setSelectedProductId(id);
    setOpenCat(null);
    a.go("navMap");
  };

  return (
    <>
      <TopBar
        title={a.t("indoorNavigation")}
        onBack={a.back}
        right={
          <button
            onClick={() => {
              a.setSelectedProductId(null);
              a.showToast("Reset", "info");
            }}
            aria-label="Reset"
            className="flex h-10 w-10 items-center justify-center text-[20px]"
          >
            ↺
          </button>
        }
      />
      <div className="px-4 pt-3 pb-6 sm-fade-in">
        <div className="flex rounded-full bg-[var(--sm-border)]/40 p-1">
          {(["cat", "search"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex h-10 flex-1 items-center justify-center rounded-full text-[13px] font-semibold transition ${tab === v ? "bg-[var(--sm-surface)] text-[var(--sm-text)] shadow" : "text-[var(--sm-text-2)]"}`}
            >
              {v === "cat" ? a.t("browseCategory") : a.t("searchByName")}
            </button>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-[var(--sm-border)] bg-[var(--sm-surface)] p-2.5 text-[12px] text-[var(--sm-text-2)]">
          📡 {a.t("indoorWifi")}
        </div>

        {tab === "cat" ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {cats.map((c) => {
              const count = INVENTORY.filter((i) => i.category === c).length;
              return (
                <Card key={c} onClick={() => setOpenCat(c)} className="!p-4">
                  <div className="text-[34px]">{CATEGORY_ICONS[c] || "📦"}</div>
                  <p className="mt-2 text-[14px] font-semibold text-[var(--sm-text)]">{c}</p>
                  <p className="text-[11.5px] text-[var(--sm-text-2)]">
                    {count} {a.t("items")}
                  </p>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Input value={search} onChange={setSearch} placeholder={a.t("searchPlaceholder")} />
            <div className="space-y-2">
              {filtered.length === 0 && search.trim() !== "" && (
                <p className="py-8 text-center text-[13px] text-[var(--sm-text-2)]">
                  No products found. Try browsing by category.
                </p>
              )}
              {filtered.map((p) => {
                const q = qtyOf(p, a.storeId);
                return (
                  <Card key={p.id} onClick={() => pickProduct(p.id)} className="!p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[24px]">{CATEGORY_ICONS[p.category]}</span>
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-[var(--sm-text)]">{p.name}</p>
                        <p className="text-[12px] text-[var(--sm-text-2)]">
                          {p.category} · Aisle {p.aisle} · {p.price.toFixed(3)} KD
                        </p>
                      </div>
                      <StatusBadge
                        status={q === 0 ? "red" : q < 3 ? "yellow" : "green"}
                        label={q === 0 ? "Out" : `${q}`}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {openCat && (
        <CategorySheet category={openCat} onClose={() => setOpenCat(null)} onPick={pickProduct} />
      )}
    </>
  );
}

function CategorySheet({
  category,
  onClose,
  onPick,
}: {
  category: string;
  onClose: () => void;
  onPick: (id: number) => void;
}) {
  const a = useApp();
  const items = INVENTORY.filter((i) => i.category === category);
  return (
    <BottomSheet open onClose={onClose}>
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-semibold text-[var(--sm-text)]">
          {CATEGORY_ICONS[category]} {category}
        </h3>
        <span className="text-[12px] text-[var(--sm-text-2)]">
          {items.length} {a.t("items")}
        </span>
      </div>
      <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
        {items.map((p) => {
          const q = qtyOf(p, a.storeId);
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--sm-border)] p-2.5"
            >
              <div className="flex-1">
                <p className="text-[14px] font-semibold text-[var(--sm-text)]">{p.name}</p>
                <p className="text-[11.5px] text-[var(--sm-text-2)]">
                  Aisle {p.aisle} · {p.price.toFixed(3)} KD
                </p>
              </div>
              <StatusBadge
                status={q === 0 ? "red" : q < 3 ? "yellow" : "green"}
                label={q === 0 ? "Out" : `${q}`}
              />
              <button
                onClick={() => onPick(p.id)}
                className="h-9 rounded-lg bg-[var(--sm-primary)] px-3 text-[12.5px] font-semibold text-white"
              >
                {a.t("navigate")}
              </button>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function StoreMap({ highlight, compact }: { highlight?: string; compact?: boolean }) {
  const u = STORE_MAP.user_position;
  const target = highlight ? STORE_MAP.sections.find((s) => s.name === highlight) : null;
  const targetX = target ? target.x + target.w / 2 : null;
  const targetY = target ? target.y + target.h / 2 : null;
  const sourceSection = STORE_MAP.sections.find(
    (s) => u.x >= s.x && u.x <= s.x + s.w && u.y >= s.y && u.y <= s.y + s.h,
  );
  const blockedSections = STORE_MAP.sections.filter(
    (s) => s.id !== sourceSection?.id && s.id !== target?.id,
  );
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const roundPoint = (x: number, y: number) => ({ x: Math.round(clamp(x, 2, 98)), y: Math.round(clamp(y, 2, 98)) });
  const start = roundPoint(u.x, u.y);
  const end = targetX !== null && targetY !== null ? roundPoint(targetX, targetY) : null;
  const isBlocked = (x: number, y: number) => {
    const padding = 1;
    return blockedSections.some(
      (s) =>
        x >= s.x - padding &&
        x <= s.x + s.w + padding &&
        y >= s.y - padding &&
        y <= s.y + s.h + padding,
    );
  };
  const keyOf = (x: number, y: number) => `${x},${y}`;
  const parseKey = (k: string) => {
    const [x, y] = k.split(",").map(Number);
    return { x, y };
  };
  const findRoute = () => {
    if (!end) return [] as { x: number; y: number }[];
    const queue: { x: number; y: number }[] = [start];
    const visited = new Set<string>([keyOf(start.x, start.y)]);
    const parent = new Map<string, string>();
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const;
    while (queue.length) {
      const cur = queue.shift()!;
      if (cur.x === end.x && cur.y === end.y) break;
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        if (nx < 2 || nx > 98 || ny < 2 || ny > 98) continue;
        if (isBlocked(nx, ny)) continue;
        const nk = keyOf(nx, ny);
        if (visited.has(nk)) continue;
        visited.add(nk);
        parent.set(nk, keyOf(cur.x, cur.y));
        queue.push({ x: nx, y: ny });
      }
    }
    const endKey = keyOf(end.x, end.y);
    if (!visited.has(endKey)) return [start, end];
    const fullPath: { x: number; y: number }[] = [];
    let cursor = endKey;
    while (cursor) {
      fullPath.push(parseKey(cursor));
      const next = parent.get(cursor);
      if (!next) break;
      cursor = next;
    }
    fullPath.reverse();
    if (fullPath.length <= 2) return fullPath;
    const simplified: { x: number; y: number }[] = [fullPath[0]];
    for (let i = 1; i < fullPath.length - 1; i++) {
      const prev = fullPath[i - 1];
      const curr = fullPath[i];
      const next = fullPath[i + 1];
      const d1x = curr.x - prev.x;
      const d1y = curr.y - prev.y;
      const d2x = next.x - curr.x;
      const d2y = next.y - curr.y;
      if (d1x !== d2x || d1y !== d2y) simplified.push(curr);
    }
    simplified.push(fullPath[fullPath.length - 1]);
    return simplified;
  };
  const route = findRoute();
  const routePoints = route.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)] ${compact ? "aspect-[5/4]" : "aspect-[4/5]"}`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="sm-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="var(--sm-border)" strokeWidth="0.3" opacity="0.2" />
          </pattern>
          <filter id="sm-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="0.7" floodColor="#0ea5e9" floodOpacity="0.6" />
          </filter>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="url(#sm-grid)" />
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          fill="none"
          stroke="var(--sm-border)"
          strokeWidth="0.6"
        />
        {STORE_MAP.sections.map((s) => (
          <g key={s.id}>
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx="2"
              fill={s.color}
              fillOpacity={highlight && s.name !== highlight ? 0.25 : 0.85}
            />
            <text
              x={s.x + s.w / 2}
              y={s.y + s.h / 2 + 1}
              textAnchor="middle"
              fill="white"
              fontSize="3"
              fontWeight="700"
            >
              {s.name}
            </text>
          </g>
        ))}
        {target && (
          <>
            <polyline
              points={routePoints}
              fill="none"
              stroke="#bae6fd"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            <polyline
              points={routePoints}
              fill="none"
              stroke="var(--sm-secondary)"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="2 1.2"
              filter="url(#sm-soft-glow)"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1.8s" repeatCount="indefinite" />
            </polyline>
          </>
        )}
        {target && (
          <g>
            <circle
              cx={targetX!}
              cy={targetY!}
              r="3"
              fill="#ef4444"
              stroke="white"
              strokeWidth="0.5"
            />
            <circle
              cx={targetX!}
              cy={targetY!}
              r="5"
              fill="none"
              stroke="#ef4444"
              strokeWidth="0.6"
              opacity="0.6"
            >
              <animate attributeName="r" from="4" to="7" dur="1.2s" repeatCount="indefinite" />
              <animate
                attributeName="opacity"
                from="0.7"
                to="0"
                dur="1.2s"
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={targetX!}
              y={targetY! - 4.8}
              textAnchor="middle"
              fill="#ef4444"
              fontSize="2.7"
              fontWeight="800"
            >
              DEST
            </text>
          </g>
        )}
        <circle cx={u.x} cy={u.y} r="2.5" fill="#22c55e" stroke="white" strokeWidth="0.6" />
        <circle cx={u.x} cy={u.y} r="4" fill="none" stroke="#22c55e" strokeWidth="0.4">
          <animate attributeName="r" from="3" to="6" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold text-white">
        🟢 You are here
      </div>
    </div>
  );
}

function NavMapScreen() {
  const a = useApp();
  const [resetOpen, setResetOpen] = useState(false);
  const product = a.selectedProductId ? INVENTORY.find((i) => i.id === a.selectedProductId) : null;
  const section = product ? STORE_MAP.sections.find((s) => s.name === product.category) : null;
  const q = product ? qtyOf(product, a.storeId) : 0;

  if (!product) {
    return (
      <>
        <TopBar title={a.t("indoorNavigation")} onBack={a.back} />
        <div className="p-6 text-center text-[14px] text-[var(--sm-text-2)]">
          Pick a product first.
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title={`${product.name} — Aisle ${product.aisle}`}
        onBack={a.back}
        right={
          <button
            onClick={() => setResetOpen(true)}
            aria-label="Reset"
            className="flex h-10 w-10 items-center justify-center text-[20px]"
          >
            ↺
          </button>
        }
      />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <StoreMap highlight={section?.name} />
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[var(--sm-text-2)]">Walking time</span>
            <span className="text-[14px] font-semibold text-[var(--sm-text)]">
              ~45 seconds away
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-[16px] font-semibold text-[var(--sm-text)]">{product.name}</h3>
            <p className="text-[13px] text-[var(--sm-text-2)]">
              Aisle {product.aisle} · {product.category} · {product.price.toFixed(3)} KD
            </p>
          </div>
          <div className="mt-2">
            <StatusBadge
              status={q === 0 ? "red" : "green"}
              label={q === 0 ? a.t("outOfStock") : `${q} in stock`}
            />
          </div>
        </Card>

        {q === 0 ? (
          <Card className="!bg-[var(--sm-error)]/10 !border-[var(--sm-error)]/30">
            <p className="text-[14px] font-semibold text-[var(--sm-error)]">{a.t("outOfStock")}</p>
            <button
              onClick={() => {
                a.setSelectedInvIds([product.id]);
                a.setInventoryStoreMode("all");
                a.go("invResults");
              }}
              className="mt-2 text-[13px] font-semibold text-[var(--sm-secondary)] underline"
            >
              {a.t("findAtOther")} →
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <SecondaryButton onClick={() => a.go("navAR")}>{a.t("switchToAR")}</SecondaryButton>
            <PrimaryButton onClick={() => a.go("navArrived")}>{a.t("iAmHere")}</PrimaryButton>
          </div>
        )}
      </div>
      <ConfirmDialog
        open={resetOpen}
        title={a.t("resetNavigation")}
        message={a.t("clearNavigation")}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          setResetOpen(false);
          a.setSelectedProductId(null);
          a.reset("navHome");
        }}
      />
    </>
  );
}

function NavARScreen() {
  const a = useApp();
  const product = a.selectedProductId ? INVENTORY.find((i) => i.id === a.selectedProductId) : null;
  return (
    <>
      <TopBar title={a.t("arNavigation")} onBack={a.back} />
      <div className="p-4 sm-fade-in">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-black">
          <img
            src={aisleImage}
            alt="Supermarket aisle view"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" />
          <div className="absolute inset-4 border-2 border-white/40">
            <div className="absolute -left-0.5 -top-0.5 h-5 w-5 border-l-4 border-t-4 border-white" />
            <div className="absolute -right-0.5 -top-0.5 h-5 w-5 border-r-4 border-t-4 border-white" />
            <div className="absolute -bottom-0.5 -left-0.5 h-5 w-5 border-b-4 border-l-4 border-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 border-b-4 border-r-4 border-white" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <div className="text-[80px]">⬆️</div>
            <p className="text-[18px] font-semibold">
              {a.t("headTo")} {product?.category}
            </p>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[13px] font-semibold backdrop-blur">
              12m {a.t("ahead")}
            </span>
          </div>
        </div>
        <Card className="mt-4">
          <p className="text-[14px] font-semibold text-[var(--sm-text)]">{product?.name}</p>
          <p className="text-[12.5px] text-[var(--sm-text-2)]">
            Aisle {product?.aisle} — {product?.category}
          </p>
        </Card>
        <p className="mt-3 text-center text-[12px] text-[var(--sm-text-2)]">{a.t("arHelp")}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => a.go("navMap")}
            className="flex h-[52px] w-full items-center justify-center rounded-lg border-2 border-[var(--sm-primary)] bg-transparent px-2 text-[16px] font-semibold text-[var(--sm-primary)] transition active:scale-[0.98]"
          >
            Switch to Map View
          </button>
          <PrimaryButton onClick={() => a.go("navArrived")}>{a.t("iAmHere")}</PrimaryButton>
        </div>
      </div>
    </>
  );
}

function NavArrivedScreen() {
  const a = useApp();
  const product = a.selectedProductId ? INVENTORY.find((i) => i.id === a.selectedProductId) : null;
  return (
    <>
      <TopBar title={a.t("arrived")} onBack={a.back} />
      <div className="flex flex-col items-center px-6 pt-10 pb-6 text-center sm-fade-in">
        <CheckmarkCircle />
        <h2 className="mt-4 text-[22px] font-bold text-[var(--sm-text)]">{a.t("arrived")}</h2>
        <p className="mt-2 text-[14px] text-[var(--sm-text)]">{product?.name}</p>
        <p className="mt-1 text-[13px] text-[var(--sm-text-2)]">
          {a.t("foundIn")} {product?.aisle} — {product?.category}
        </p>
        <div className="mt-8 grid w-full grid-cols-2 gap-3">
          <SecondaryButton
            onClick={() => {
              a.setSelectedProductId(null);
              a.reset("navHome");
            }}
          >
            {a.t("findAnother")}
          </SecondaryButton>
          <PrimaryButton onClick={() => a.reset("checkoutItems")}>
            {a.t("goToCheckout")}
          </PrimaryButton>
        </div>
      </div>
    </>
  );
}

/* ===== CHECKOUT ===== */
function CheckoutItemsScreen() {
  const a = useApp();
  const dec = () => a.setItemCount(Math.max(1, a.itemCount - 1));
  const inc = () => a.setItemCount(Math.min(99, a.itemCount + 1));
  return (
    <>
      <TopBar title={a.t("fastestCheckout")} onBack={a.back} />
      <div className="flex flex-col items-center px-6 pt-8 pb-6 sm-fade-in">
        <div className="text-[64px]">🛒</div>
        <h2 className="mt-4 text-center text-[20px] font-semibold text-[var(--sm-text)]">
          {a.t("howManyItems")}
        </h2>
        <div className="mt-8 flex w-full items-center justify-center gap-4">
          <button
            onClick={dec}
            aria-label="Decrease"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--sm-border)] text-[28px] font-bold text-[var(--sm-text)] active:scale-95"
          >
            −
          </button>
          <div className="min-w-[100px] text-center text-[48px] font-bold text-[var(--sm-text)]">
            {a.itemCount}
          </div>
          <button
            onClick={inc}
            aria-label="Increase"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--sm-border)] text-[28px] font-bold text-[var(--sm-text)] active:scale-95"
          >
            +
          </button>
        </div>
        <div className="mt-10 w-full">
          <PrimaryButton onClick={() => a.go("checkoutLanes")}>{a.t("findBestLane")}</PrimaryButton>
        </div>
      </div>
    </>
  );
}

function CheckoutLanesScreen() {
  const a = useApp();
  const recommendedId = a.itemCount <= 15 ? 4 : a.itemCount <= 30 ? 3 : 7;
  const recommended = CHECKOUT_LANES.find((l) => l.id === recommendedId)!;
  const others = CHECKOUT_LANES.filter((l) => l.id !== recommendedId);

  return (
    <>
      <TopBar title="Choose Your Lane" onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <h2 className="text-[20px] font-semibold text-[var(--sm-text)]">
          {a.t("recommendedLane")}
        </h2>
        <Card className="border-2 !border-[var(--sm-success)]">
          <div className="mb-2 inline-flex rounded-full bg-[var(--sm-success)] px-2.5 py-0.5 text-[11px] font-bold text-white">
            BEST CHOICE
          </div>
          <LaneRow lane={recommended} large />
          <div className="mt-3">
            <PrimaryButton
              onClick={() => {
                a.setSelectedLaneId(recommended.id);
                a.go("checkoutDone");
              }}
            >
              {a.t("navigateToLane")}
            </PrimaryButton>
          </div>
        </Card>
        <h3 className="pt-2 text-[14px] font-semibold text-[var(--sm-text-2)]">Other lanes</h3>
        <div className="space-y-2">
          {others.map((l) => (
            <Card key={l.id}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <LaneRow lane={l} />
                </div>
                <button
                  onClick={() => {
                    a.setSelectedLaneId(l.id);
                    a.go("checkoutDone");
                  }}
                  className="h-10 rounded-lg border-2 border-[var(--sm-primary)] px-4 text-[13px] font-semibold text-[var(--sm-primary)]"
                >
                  Select
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function LaneRow({ lane, large }: { lane: (typeof CHECKOUT_LANES)[number]; large?: boolean }) {
  const status = lane.status as "green" | "yellow" | "red";
  return (
    <div>
      <div className="flex items-center gap-2">
        <p
          className={`font-semibold text-[var(--sm-text)] ${large ? "text-[18px]" : "text-[15px]"}`}
        >
          {lane.lane}
        </p>
        <StatusBadge status={status} label={lane.wait_time} />
      </div>
      <p className="mt-1 text-[13px] text-[var(--sm-text-2)]">
        {lane.queue} people in queue · ~{lane.items_avg} items avg
      </p>
    </div>
  );
}

function CheckoutDoneScreen() {
  const a = useApp();
  const lane = CHECKOUT_LANES.find((l) => l.id === a.selectedLaneId);
  return (
    <>
      <TopBar title="Lane Confirmed" onBack={a.back} />
      <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center sm-fade-in">
        <CheckmarkCircle />
        <h2 className="mt-4 text-[22px] font-bold text-[var(--sm-text)]">
          {lane?.lane} {a.t("laneSelected")}
        </h2>
        <p className="mt-2 text-[14px] text-[var(--sm-text-2)]">
          Head to the checkout area near the entrance.
        </p>
        <div className="mt-5 w-full">
          <div className="aspect-[5/4] w-full">
            <StoreMap highlight="Checkout" compact />
          </div>
        </div>
        <div className="mt-5 w-full">
          <PrimaryButton onClick={() => a.reset("home")}>{a.t("done")}</PrimaryButton>
        </div>
      </div>
    </>
  );
}

/* ===== HELP ===== */
function HelpTypeScreen() {
  const a = useApp();
  const opts = [
    {
      id: "staff",
      icon: "🧑‍💼",
      titleK: "staffAssistance" as TranslationKey,
      desc: "General help in the store",
    },
    {
      id: "medical",
      icon: "🚑",
      titleK: "medicalEmergency" as TranslationKey,
      desc: "Urgent medical attention needed",
    },
    {
      id: "product",
      icon: "📦",
      titleK: "productAssistance" as TranslationKey,
      desc: "Help finding or reaching a product",
    },
    {
      id: "access",
      icon: "♿",
      titleK: "accessibilitySupport" as TranslationKey,
      desc: "Mobility or accessibility assistance",
    },
  ];
  const select = (id: string) => {
    a.setHelpType(id);
    a.go("helpConfirm");
  };
  return (
    <>
      <TopBar title={a.t("iNeedHelp")} onBack={a.back} />
      <div className="space-y-3 px-4 pt-4 pb-6 sm-fade-in">
        <h2 className="text-[20px] font-semibold text-[var(--sm-text)]">{a.t("whatHelp")}</h2>
        <div className="space-y-2 pt-2">
          {opts.map((o) => (
            <Card key={o.id} onClick={() => select(o.id)} className="!p-3.5">
              <div className="flex items-center gap-3">
                <span className="text-[28px]">{o.icon}</span>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-[var(--sm-text)]">{a.t(o.titleK)}</p>
                  <p className="text-[12.5px] text-[var(--sm-text-2)]">{o.desc}</p>
                </div>
                <span className="text-[var(--sm-text-2)]">›</span>
              </div>
            </Card>
          ))}
        </div>
        <button
          onClick={() => select("emergency")}
          className="mt-4 flex h-[60px] w-full items-center justify-center rounded-lg bg-[var(--sm-error)] text-[16px] font-bold text-white shadow-lg active:scale-[0.98]"
        >
          🆘 {a.t("emergency")}
        </button>
      </div>
    </>
  );
}

function HelpConfirmScreen() {
  const a = useApp();
  const [confirmCancel, setConfirmCancel] = useState(false);
  return (
    <>
      <TopBar title="Help Requested" onBack={a.back} />
      <div className="space-y-5 px-4 pt-4 pb-6 sm-fade-in">
        <ProgressSteps steps={["Select", "Notified", "Arriving"]} current={1} />
        <Card className="border-2 !border-[var(--sm-primary)]">
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sm-primary)]/15 text-[28px]">
              🤝
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-[var(--sm-text-2)]">
              Ticket #SYS-2847
            </p>
            <h2 className="mt-1 text-[18px] font-bold text-[var(--sm-text)]">{a.t("helpOnWay")}</h2>
            <p className="mt-1 text-[14px] text-[var(--sm-text-2)]">{a.t("estimatedResponse")}</p>
          </div>
        </Card>
        <button
          onClick={() => setConfirmCancel(true)}
          className="h-12 w-full text-[14px] font-medium text-[var(--sm-error)] underline-offset-4 hover:underline"
        >
          {a.t("cancel")}
        </button>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel help request?"
        message="The staff member will no longer be notified."
        confirmLabel={a.t("cancel")}
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          a.reset("home");
          a.showToast("Help request canceled", "info");
        }}
      />
    </>
  );
}

/* ===== REPORT ===== */
function ReportTypeScreen() {
  const a = useApp();
  const opts = [
    { id: "wheel", icon: "🛞", titleK: "brokenWheel" as TranslationKey },
    { id: "scanner", icon: "📡", titleK: "scannerIssue" as TranslationKey },
    { id: "battery", icon: "🔋", titleK: "batteryIssue" as TranslationKey },
    { id: "nav", icon: "🧭", titleK: "navigationIssue" as TranslationKey },
    { id: "other", icon: "❓", titleK: "otherIssue" as TranslationKey },
  ];
  return (
    <>
      <TopBar title={a.t("reportCartIssue")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <h2 className="text-[20px] font-semibold text-[var(--sm-text)]">
          What's the issue with your cart?
        </h2>
        <div className="space-y-2">
          {opts.map((o) => (
            <Card
              key={o.id}
              onClick={() => {
                a.setReportType(o.id);
                a.go("reportDone");
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-[24px]">{o.icon}</span>
                <p className="flex-1 text-[15px] font-semibold text-[var(--sm-text)]">
                  {a.t(o.titleK)}
                </p>
                <span className="text-[var(--sm-text-2)]">›</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}

function ReportCartScreen() {
  const a = useApp();
  return (
    <>
      <TopBar title="Confirm Cart" onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <ProgressSteps steps={["Select Issue", "Cart ID", "Submit"]} current={1} />
        <Card>
          <p className="text-[13px] text-[var(--sm-text-2)]">Reporting issue for</p>
          <p className="mt-1 text-[22px] font-bold text-[var(--sm-text)]">
            {a.cartId || "Cart-01"}
          </p>
        </Card>
        <PrimaryButton onClick={() => a.go("reportDone")}>
          {a.t("confirm")} & {a.t("submit")}
        </PrimaryButton>
      </div>
    </>
  );
}

function ReportDoneScreen() {
  const a = useApp();
  const [confirmCancel, setConfirmCancel] = useState(false);

  return (
    <>
      <TopBar title="Submitted" onBack={a.back} />
      <div className="flex flex-col items-center px-6 pt-6 pb-6 text-center sm-fade-in">
        <div className="mt-6">
          <CheckmarkCircle />
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-[var(--sm-text)]">
          {a.t("reportSubmitted")}
        </h2>
        <p className="mt-1 text-[12px] font-semibold uppercase tracking-wider text-[var(--sm-text-2)]">
          Ticket #RPT-5521
        </p>
        <div className="mt-8 w-full space-y-3">
          <PrimaryButton onClick={() => a.reset("home")}>Return to Home</PrimaryButton>
          <button
            onClick={() => setConfirmCancel(true)}
            className="h-12 w-full text-[14px] font-medium text-[var(--sm-error)] underline-offset-4 hover:underline"
          >
            {a.t("cancel")}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={confirmCancel}
        title="Cancel report?"
        message="The staff member will no longer be notified."
        confirmLabel={a.t("cancel")}
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          a.reset("home");
          a.showToast("Report canceled", "info");
        }}
      />
    </>
  );
}

/* ===== FOOD TRACKER ===== */
function ScanScreen() {
  const a = useApp();
  const [tab, setTab] = useState<"nfc" | "manual">("nfc");
  const [code, setCode] = useState("");
  return (
    <>
      <TopBar title={a.t("foodTracker")} onBack={a.back} />
      <div className="px-4 pt-3 pb-6 sm-fade-in">
        <div className="flex rounded-full bg-[var(--sm-border)]/40 p-1">
          {(["nfc", "manual"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`flex h-10 flex-1 items-center justify-center rounded-full text-[13px] font-semibold transition ${tab === v ? "bg-[var(--sm-surface)] text-[var(--sm-text)] shadow" : "text-[var(--sm-text-2)]"}`}
            >
              {v === "nfc" ? "NFC Tap" : a.t("manualEntry")}
            </button>
          ))}
        </div>
        {tab === "nfc" ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <div className="relative flex h-44 w-44 items-center justify-center">
              <div className="sm-nfc-ring" />
              <div className="sm-nfc-ring" style={{ animationDelay: "0.5s" }} />
              <div className="sm-nfc-ring" style={{ animationDelay: "1s" }} />
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[var(--sm-primary)] text-[44px] text-white">
                📱
              </div>
            </div>
            <h2 className="mt-6 text-[18px] font-semibold text-[var(--sm-text)]">
              {a.t("nfcInstruction")}
            </h2>
            <div className="mt-8 w-full">
              <PrimaryButton onClick={() => a.go("product")}>{a.t("simulateScan")}</PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <Input
              label="Product code"
              value={code}
              onChange={setCode}
              placeholder={a.t("manualEntry")}
            />
            <PrimaryButton onClick={() => a.go("product")}>{a.t("search")}</PrimaryButton>
          </div>
        )}
      </div>
    </>
  );
}

function ProductScreen() {
  const a = useApp();
  const p = FOOD_PRODUCT;
  return (
    <>
      <TopBar title={a.t("productDetails")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <div className="flex justify-center">
          {/* <div className="inline-flex items-center gap-2 rounded-full bg-[var(--sm-success)] px-4 py-1.5 text-[14px] font-bold text-white">
            ✓ {a.t("fresh")}
          </div> */}
        </div>
        <Card>
          <h2 className="text-[20px] font-bold text-[var(--sm-text)]">{p.name}</h2>
          <p className="text-[13px] text-[var(--sm-text-2)]">{p.producer}</p>
          <div className="mt-3 grid grid-cols-2 gap-y-2 text-[13px]">
            <span className="text-[var(--sm-text-2)]">{a.t("productionDate")}</span>
            <span className="text-right font-semibold text-[var(--sm-text)]">20 Apr 2025</span>
            <span className="text-[var(--sm-text-2)]">{a.t("expiryDate")}</span>
            <span className="text-right">
              {(() => {
                const expiry = new Date("2025-05-20");
                const today = new Date();
                const daysLeft = Math.ceil(
                  (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                );
                const isExpired = daysLeft < 0;
                const isWarning = daysLeft >= 0 && daysLeft <= 7;
                const isOk = daysLeft > 7;
                const bg = isExpired
                  ? "bg-[var(--sm-error)]/15 text-[var(--sm-error)] border border-[var(--sm-error)]/30"
                  : isWarning
                    ? "bg-[var(--sm-warning)]/15 text-[var(--sm-warning)] border border-[var(--sm-warning)]/30"
                    : "bg-[var(--sm-success)]/15 text-[var(--sm-success)] border border-[var(--sm-success)]/30";
                const icon = isExpired ? "⛔" : isWarning ? "⚠️" : "✅";
                const label = isExpired
                  ? `Expired ${Math.abs(daysLeft)}d ago`
                  : daysLeft === 0
                    ? "Expires today"
                    : `${daysLeft}d left`;
                return (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${bg}`}
                  >
                    {icon} 20 May 2025 · {label}
                  </span>
                );
              })()}
            </span>
            <span className="text-[var(--sm-text-2)]">Optimal storage</span>
            <span className="text-right font-semibold text-[var(--sm-text)]">
              {p.opt_storage_temp}°C
            </span>
          </div>
        </Card>
        <div>
          <h3 className="mb-2 text-[15px] font-semibold text-[var(--sm-text)]">
            Supply chain timeline
          </h3>
          <Card>
            <div className="space-y-4">
              {p.distribution.map((d, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${d.depart || i === p.distribution.length - 1 ? "bg-[var(--sm-success)]" : "bg-[var(--sm-border)]"} text-[12px] text-white`}
                    >
                      ✓
                    </div>
                    {i < p.distribution.length - 1 && (
                      <div
                        className="my-1 w-0.5 flex-1 bg-[var(--sm-border)]"
                        style={{ minHeight: 28 }}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-[14px] font-semibold text-[var(--sm-text)]">{d.plant}</p>
                    <p className="text-[12px] text-[var(--sm-text-2)]">Arrived: {d.arrive}</p>
                    <p className="text-[12px] text-[var(--sm-text-2)]">
                      {d.depart ? `Departed: ${d.depart}` : "Currently here"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <PrimaryButton onClick={() => a.go("tempGraph")}>{a.t("viewTempHistory")}</PrimaryButton>
        <SecondaryButton onClick={() => a.go("vendorView")}>
          View for Authorities/Vendor
        </SecondaryButton>
      </div>
    </>
  );
}

function TempGraphScreen() {
  const a = useApp();
  const data = FOOD_PRODUCT.temp_log;
  const W = 320,
    H = 200,
    padL = 32,
    padR = 12,
    padT = 16,
    padB = 28;
  const minY = -1,
    maxY = 5;
  const x = (i: number) => padL + (i * (W - padL - padR)) / (data.length - 1);
  const y = (v: number) => padT + ((maxY - v) * (H - padT - padB)) / (maxY - minY);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.temp)}`).join(" ");
  const min = Math.min(...data.map((d) => d.temp));
  const max = Math.max(...data.map((d) => d.temp));
  const avg = (data.reduce((s, d) => s + d.temp, 0) / data.length).toFixed(2);

  return (
    <>
      <TopBar title="Temperature History" onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <Card className="!bg-[var(--sm-success)]/10 !border-[var(--sm-success)]/30">
          <p className="text-[14px] font-semibold text-[var(--sm-success)]">
            ✓ {a.t("storageConditionsSafe")}
          </p>
        </Card>
        <Card>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
            <rect
              x={padL}
              y={y(4)}
              width={W - padL - padR}
              height={y(0) - y(4)}
              fill="var(--sm-success)"
              opacity="0.12"
            />
            {[-1, 0, 1, 2, 3, 4, 5].map((v) => (
              <g key={v}>
                <line
                  x1={padL}
                  y1={y(v)}
                  x2={W - padR}
                  y2={y(v)}
                  stroke="var(--sm-border)"
                  strokeWidth="0.5"
                />
                <text
                  x={padL - 4}
                  y={y(v) + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--sm-text-2)"
                >
                  {v}°
                </text>
              </g>
            ))}
            <path d={path} fill="none" stroke="var(--sm-secondary)" strokeWidth="2" />
            {data.map((d, i) => {
              const spike = d.temp >= 3.5;
              return (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(d.temp)}
                  r={spike ? 4 : 3}
                  fill={spike ? "var(--sm-warning)" : "var(--sm-secondary)"}
                  stroke="var(--sm-surface)"
                  strokeWidth="1"
                />
              );
            })}
            {data.map(
              (d, i) =>
                i % 2 === 0 && (
                  <text
                    key={i}
                    x={x(i)}
                    y={H - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--sm-text-2)"
                  >
                    {d.time}
                  </text>
                ),
            )}
          </svg>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Min" value={`${min}°C`} />
          <Stat label="Max" value={`${max}°C`} />
          <Stat label="Avg" value={`${avg}°C`} />
        </div>
        <SecondaryButton onClick={() => a.back()}>Back to Product</SecondaryButton>
      </div>
    </>
  );
}

function VendorViewScreen() {
  const a = useApp();
  const p = FOOD_PRODUCT;
  return (
    <>
      <TopBar
        title="Authority Log View"
        onBack={a.back}
        right={
          <span className="rounded-full bg-[var(--sm-error)]/15 px-2 py-1 text-[11px] font-semibold text-[var(--sm-error)]">
            🔒
          </span>
        }
      />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <div className="overflow-hidden rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)]">
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--sm-bg)] text-[var(--sm-text-2)]">
              <tr>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Arrived</th>
                <th className="p-2 text-left">Departed</th>
              </tr>
            </thead>
            <tbody>
              {p.distribution.map((d, i) => (
                <tr key={i} className="border-t border-[var(--sm-border)] text-[var(--sm-text)]">
                  <td className="p-2 font-medium">{d.plant}</td>
                  <td className="p-2">{d.arrive}</td>
                  <td className="p-2">{d.depart || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ===== OUTDOOR ===== */
function OutdoorScreen() {
  const a = useApp();
  return (
    <>
      <TopBar title={a.t("outdoorServices")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <h2 className="text-[20px] font-semibold text-[var(--sm-text)]">{a.t("planYourVisit")}</h2>
        <Card onClick={() => a.go("traffic")} className="!p-4">
          <div className="flex items-center gap-3">
            <span className="text-[36px]">🚗</span>
            <div className="flex-1">
              <p className="text-[16px] font-semibold text-[var(--sm-text)]">
                {a.t("trafficParking")}
              </p>
              <p className="text-[12.5px] text-[var(--sm-text-2)]">Real-time parking and traffic</p>
            </div>
            <span className="text-[var(--sm-text-2)]">›</span>
          </div>
        </Card>
        <Card onClick={() => a.go("invSelect")} className="!p-4">
          <div className="flex items-center gap-3">
            <span className="text-[36px]">🔍</span>
            <div className="flex-1">
              <p className="text-[16px] font-semibold text-[var(--sm-text)]">
                {a.t("storeInventory")}
              </p>
              <p className="text-[12.5px] text-[var(--sm-text-2)]">Search across all branches</p>
            </div>
            <span className="text-[var(--sm-text-2)]">›</span>
          </div>
        </Card>
      </div>
    </>
  );
}

function TrafficScreen() {
  const a = useApp();
  // Sort nearest first if location granted
  const stores = a.locationGranted
    ? [...STORES].sort((x, y) => parseFloat(x.distance) - parseFloat(y.distance))
    : STORES;
  return (
    <>
      <TopBar
        title={a.t("trafficParking")}
        onBack={a.back}
        right={
          a.locationGranted ? (
            <span className="rounded-full bg-[var(--sm-success)]/20 px-2 py-1 text-[10.5px] font-semibold text-[var(--sm-success)]">
              📍 {a.t("locationActive")}
            </span>
          ) : null
        }
      />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        {a.locationGranted === null && (
          <Card
            onClick={() => a.setShowLocationSheet(true)}
            className="!bg-[var(--sm-secondary)]/10 !border-[var(--sm-secondary)]/30"
          >
            <p className="text-[13px] text-[var(--sm-text)]">
              📍 Tap to enable location for nearest stores
            </p>
          </Card>
        )}
        {a.locationGranted === false && (
          <Card className="!bg-[var(--sm-warning)]/10 !border-[var(--sm-warning)]/30">
            <p className="text-[13px] text-[var(--sm-text)]">
              📍 {a.t("locationOff")}. Enable in Profile → Settings.
            </p>
          </Card>
        )}
        <h2 className="text-[20px] font-semibold text-[var(--sm-text)]">{a.t("nearbyStores")}</h2>
        {a.locationGranted && (
          <p className="text-[12px] text-[var(--sm-text-2)]">{a.t("basedOnLocation")}</p>
        )}
        {stores.map((s, i) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[var(--sm-text)]">{s.name}</h3>
              {a.locationGranted && i === 0 && (
                <span className="rounded-full bg-[var(--sm-success)]/20 px-2 py-0.5 text-[10.5px] font-semibold text-[var(--sm-success)]">
                  {a.t("nearestToYou")}
                </span>
              )}
            </div>
            <p className="text-[13px] text-[var(--sm-text-2)]">
              {s.distance} · {s.travel_time} away
            </p>
            <div className="mt-3">
              <p className="mb-1 text-[12px] font-semibold text-[var(--sm-text-2)]">
                Parking ({s.parking_available}/{s.parking_total})
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: s.parking_total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-7 w-7 rounded-full border-2 ${i < s.parking_available ? "border-[var(--sm-success)] bg-[var(--sm-success)]/20" : "border-[var(--sm-error)] bg-[var(--sm-error)]/20"}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge
                status={s.traffic_level === 1 ? "green" : s.traffic_level === 2 ? "yellow" : "red"}
                label={`Traffic: ${s.traffic}`}
              />
              <StatusBadge
                status={s.crowd === "Low" ? "green" : s.crowd === "Moderate" ? "yellow" : "red"}
                label={`Crowd: ${s.crowd}`}
              />
            </div>
            <div className="mt-3">
              <PrimaryButton
                onClick={() => {
                  a.setStoreId(s.id);
                  a.showToast(`${s.name} set as your store`, "success");
                  a.back();
                }}
              >
                {a.t("setAsMyStore")}
              </PrimaryButton>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

/* ===== INVENTORY SEARCH ===== */
function InvSelectScreen() {
  const a = useApp();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const list = INVENTORY.filter(
    (i) =>
      (cat === "All" || i.category === cat) &&
      (search === "" || i.name.toLowerCase().includes(search.toLowerCase())),
  );
  const toggle = (id: number) => {
    a.setSelectedInvIds(
      a.selectedInvIds.includes(id)
        ? a.selectedInvIds.filter((x) => x !== id)
        : [...a.selectedInvIds, id],
    );
  };
  return (
    <>
      <TopBar title={a.t("storeInventory")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--sm-text-2)]">
            Step 1 · Choose store
          </p>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {STORES.map((s) => (
              <button
                key={s.id}
                onClick={() => a.setInventoryStoreMode(String(s.id))}
                className={`flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-[12px] font-semibold transition ${a.inventoryStoreMode === String(s.id)
                  ? "bg-[var(--sm-primary)] text-white shadow"
                  : "bg-[var(--sm-border)]/40 text-[var(--sm-text-2)]"
                  }`}
              >
                {s.name.replace("Sultan ", "")}
              </button>
            ))}
            <button
              onClick={() => a.setInventoryStoreMode("all")}
              className={`flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-[12px] font-semibold transition ${a.inventoryStoreMode === "all"
                ? "bg-[var(--sm-primary)] text-white shadow"
                : "bg-[var(--sm-border)]/40 text-[var(--sm-text-2)]"
                }`}
            >
              Compare All
            </button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[var(--sm-text-2)]">
            Step 2 · Pick items
          </p>
          <Input value={search} onChange={setSearch} placeholder="Search products..." />
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {CATEGORIES.map((c) => (
              <FilterChip key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {list.map((i) => {
            const sel = a.selectedInvIds.includes(i.id);
            return (
              <Card
                key={i.id}
                onClick={() => toggle(i.id)}
                className={`!p-3 ${sel ? "!border-[var(--sm-primary)] !border-2" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded border-2 ${sel ? "border-[var(--sm-primary)] bg-[var(--sm-primary)] text-white" : "border-[var(--sm-border)]"}`}
                  >
                    {sel && "✓"}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-[var(--sm-text)]">{i.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded-full bg-[var(--sm-border)]/50 px-2 py-0.5 text-[11px] text-[var(--sm-text-2)]">
                        {i.category}
                      </span>
                      <span className="text-[12px] text-[var(--sm-text-2)]">
                        {i.price.toFixed(3)} KD
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
          {list.length === 0 && (
            <p className="text-center text-[13px] text-[var(--sm-text-2)]">
              No products match your search.
            </p>
          )}
        </div>
      </div>
      {/* Sticky bar — floats above bottom nav, scrolls with content */}
      <div className="sm-sticky-bar">
        <PrimaryButton disabled={a.selectedInvIds.length === 0} onClick={() => a.go("invResults")}>
          {a.selectedInvIds.length === 0
            ? a.t("selectItems")
            : `${a.t("searchSelected")} (${a.selectedInvIds.length} ${a.t("itemsSelected")})`}
        </PrimaryButton>
      </div>
    </>
  );
}

function InvResultsScreen() {
  const a = useApp();
  const items = INVENTORY.filter((i) => a.selectedInvIds.includes(i.id));
  const compareMode = a.inventoryStoreMode === "all";
  const singleStoreId = compareMode ? 1 : parseInt(a.inventoryStoreMode, 10);
  const singleStore = STORES.find((s) => s.id === singleStoreId);
  return (
    <>
      <TopBar
        title="Search Results"
        onBack={a.back}
        right={
          !compareMode && singleStore ? (
            <span className="text-[12px] font-semibold text-[var(--sm-text-2)]">
              {singleStore.name.replace("Sultan ", "")}
            </span>
          ) : undefined
        }
      />
      <div className="space-y-3 px-4 pt-4 pb-6 sm-fade-in">
        {items.length === 0 ? (
          <p className="py-12 text-center text-[14px] text-[var(--sm-text-2)]">
            No items selected.
          </p>
        ) : compareMode ? (
          <Card className="!p-0 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--sm-bg)] text-[var(--sm-text-2)]">
                <tr>
                  <th className="p-2 text-left">Product</th>
                  {STORES.map((s) => (
                    <th key={s.id} className="p-2 text-center">
                      {s.name.split(" ")[1]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id} className="border-t border-[var(--sm-border)]">
                    <td className="p-2 font-medium text-[var(--sm-text)]">{i.name}</td>
                    {STORES.map((s) => (
                      <td key={s.id} className="p-2 text-center">
                        <QtyCell q={qtyOf(i, s.id)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((i) => {
              const q = qtyOf(i, singleStoreId);
              return (
                <Card key={i.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[15px] font-semibold text-[var(--sm-text)]">{i.name}</p>
                      <p className="text-[12px] text-[var(--sm-text-2)]">
                        Aisle {i.aisle} · {i.price.toFixed(3)} KD
                      </p>
                    </div>
                    <QtyCell q={q} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function QtyCell({ q }: { q: number }) {
  if (q === 0)
    return (
      <span className="text-[13px] font-semibold text-[var(--sm-error)] line-through">Out</span>
    );
  const cls = q > 3 ? "text-[var(--sm-success)]" : "text-[var(--sm-warning)]";
  return (
    <span
      className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-current/10 px-2 text-[13px] font-bold ${cls}`}
    >
      {q}
    </span>
  );
}

/* ===== PROFILE ===== */
function ProfileScreen() {
  const a = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);
  return (
    <>
      <TopBar title={a.t("myProfile")} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sm-primary)] text-[20px] font-bold text-white">
              {a.isGuest ? "G" : "SH"}
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-[var(--sm-text)]">
                {a.isGuest ? a.t("guestMode") : "Shopper"}
              </p>
              <p className="text-[12.5px] text-[var(--sm-text-2)]">
                {a.cartId || "No cart"} · {STORES.find((s) => s.id === a.storeId)!.name}
              </p>
            </div>
          </div>
        </Card>

        <Card className="!p-0">
          <div className="divide-y divide-[var(--sm-border)]">
            <SettingRow icon="🌙" label={a.t("darkMode")} checked={a.dark} onChange={a.setDark} />
            <SettingRow
              icon="🔔"
              label={a.t("notifications")}
              checked={a.notifications}
              onChange={a.setNotifications}
            />
            <RowLink icon="⚙️" label={a.t("settings")} onClick={() => a.go("settings")} />
            <RowLink
              icon="🌐"
              label={a.t("language")}
              right={
                <span className="text-[13px] text-[var(--sm-text-2)]">
                  {a.lang === "en" ? "🇬🇧 English" : "🇲🇾 Melayu"}
                </span>
              }
              onClick={() => a.go("settings")}
            />
            <RowLink
              icon="📍"
              label={a.t("locationServices")}
              right={
                <span className="text-[13px] text-[var(--sm-text-2)]">
                  {a.locationGranted ? a.t("locationActive") : "Off"}
                </span>
              }
              onClick={() => a.setShowLocationSheet(true)}
            />
            <RowLink icon="🤝" label={a.t("locateAFriend")} onClick={() => a.go("friend")} />
          </div>
        </Card>

        <button
          onClick={() => setLogoutOpen(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--sm-error)]/30 bg-[var(--sm-error)]/5 text-[15px] font-semibold text-[var(--sm-error)]"
        >
          🚪 {a.t("logout")}
        </button>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title={a.t("logout")}
        message={a.t("logoutConfirm")}
        confirmLabel={a.t("logout")}
        danger
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          a.setCartId("");
          a.setIsGuest(false);
          try {
            localStorage.removeItem("sysmart_loc");
          } catch { }
          a.reset("login");
          setTimeout(() => a.showToast(a.t("loggedOut"), "success"), 100);
        }}
      />
    </>
  );
}

function SettingRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-[56px] items-center gap-3 px-4">
      <span className="text-[20px]">{icon}</span>
      <span className="flex-1 text-[15px] text-[var(--sm-text)]">{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

function RowLink({
  icon,
  label,
  onClick,
  right,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  right?: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left"
    >
      <span className="text-[20px]">{icon}</span>
      <span className="flex-1 text-[15px] text-[var(--sm-text)]">{label}</span>
      {right || <span className="text-[var(--sm-text-2)]">›</span>}
    </button>
  );
}

function FriendScreen() {
  const a = useApp();
  const [cart, setCart] = useState("");
  const [result, setResult] = useState<string | null>(null);
  return (
    <>
      <TopBar title={a.t("locateAFriend")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        <Input
          label="Friend's Cart ID"
          value={cart}
          onChange={setCart}
          placeholder="e.g. Cart-03"
        />
        <PrimaryButton onClick={() => setResult(cart || "Cart-03")}>Find Cart</PrimaryButton>
        {result && (
          <>
            <Card>
              <p className="text-[13px] text-[var(--sm-text-2)]">Found</p>
              <p className="mt-1 text-[16px] font-bold text-[var(--sm-text)]">{result} is near</p>
              <p className="text-[15px] text-[var(--sm-primary)]">Dairy Section (Aisle 4)</p>
            </Card>
            <StoreMap highlight="Dairy" compact />
          </>
        )}
      </div>
    </>
  );
}

/* ===== SETTINGS — accessibility + language ===== */
function SettingsScreen() {
  const a = useApp();
  return (
    <>
      <TopBar title={a.t("settings")} onBack={a.back} />
      <div className="space-y-4 px-4 pt-4 pb-6 sm-fade-in">
        {/* Language */}
        <Card>
          <p className="mb-3 text-[14px] font-semibold text-[var(--sm-text)]">
            🌐 {a.t("language")}
          </p>
          <div className="flex rounded-full bg-[var(--sm-border)]/40 p-1">
            {(
              [
                { v: "en", l: "🇬🇧 English" },
                { v: "my", l: "🇲🇾 Bahasa Melayu" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => a.setLang(o.v)}
                className={`flex h-10 flex-1 items-center justify-center rounded-full text-[13px] font-semibold transition ${a.lang === o.v ? "bg-[var(--sm-surface)] text-[var(--sm-text)] shadow" : "text-[var(--sm-text-2)]"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </Card>
        {/* Accessibility */}
        <Card className="!p-0">
          <div className="border-b border-[var(--sm-border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[20px]">♿</span>
              <span className="flex-1 text-[15px] font-semibold text-[var(--sm-text)]">
                {a.t("accessibilityMode")}
              </span>
              <Toggle
                checked={a.accessibilityMode}
                onChange={a.setAccessibilityMode}
                label="Accessibility"
              />
            </div>
          </div>

          {a.accessibilityMode && (
            <>
              {/* Font size */}
              <div className="border-b border-[var(--sm-border)] px-4 py-3">
                <p className="mb-2 text-[13px] font-semibold text-[var(--sm-text)]">
                  {a.t("fontSize")}
                </p>
                <div className="flex rounded-full bg-[var(--sm-border)]/40 p-1">
                  {(["standard", "large", "xlarge"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => a.setFontSize(v)}
                      className={`flex h-9 flex-1 items-center justify-center rounded-full text-[12px] font-semibold transition ${a.fontSize === v ? "bg-[var(--sm-surface)] text-[var(--sm-text)] shadow" : "text-[var(--sm-text-2)]"}`}
                    >
                      {a.t(v)}
                    </button>
                  ))}
                </div>
              </div>
              <SettingRow
                icon="🌗"
                label={a.t("highContrast")}
                checked={a.highContrast}
                onChange={a.setHighContrast}
              />
              <SettingRow
                icon="↕️"
                label={a.t("extraSpacing")}
                checked={a.extraSpacing}
                onChange={a.setExtraSpacing}
              />
              <SettingRow
                icon="🎬"
                label="Reduce motion"
                checked={a.reduceMotion}
                onChange={a.setReduceMotion}
              />
            </>
          )}
        </Card>

        {/* Privacy Settings (HCI Principle: User Control) */}
        <Card className="!p-0">
          <div className="border-b border-[var(--sm-border)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[20px]">🛡️</span>
              <span className="flex-1 text-[15px] font-semibold text-[var(--sm-text)]">
                {a.t("privacySettings")}
              </span>
            </div>
          </div>
          <div className="border-b border-[var(--sm-border)]">
            <div className="flex min-h-[56px] items-center gap-3 px-4">
              <span className="text-[20px]">📍</span>
              <div className="flex-1">
                <p className="text-[15px] text-[var(--sm-text)]">Location (GPS)</p>
                <p className="text-[11px] text-[var(--sm-text-2)]">
                  {a.locationGranted ? "Tracking active" : "Not sharing"}
                </p>
              </div>
              <Toggle
                checked={a.dataToggles.location}
                onChange={(v) => {
                  a.setDataToggles({ ...a.dataToggles, location: v });
                  if (!v) {
                    a.setLocationGranted(false);
                    a.showToast("GPS location revoked", "info");
                  } else {
                    a.setShowLocationSheet(true);
                  }
                }}
                label="Location Toggle"
              />
            </div>
          </div>
          <div className="border-b border-[var(--sm-border)]">
            <SettingRow
              icon="📊"
              label={a.t("analytics")}
              checked={a.dataToggles.analytics}
              onChange={(v) => a.setDataToggles({ ...a.dataToggles, analytics: v })}
            />
            <p className="px-12 pb-3 text-[11px] text-[var(--sm-text-2)]">{a.t("analyticsDesc")}</p>
          </div>
          <div className="">
            <SettingRow
              icon="👤"
              label={a.t("personalization")}
              checked={a.dataToggles.personalization}
              onChange={(v) => a.setDataToggles({ ...a.dataToggles, personalization: v })}
            />
            <p className="px-12 pb-3 text-[11px] text-[var(--sm-text-2)]">
              {a.t("personalizationDesc")}
            </p>
          </div>
        </Card>

        <p className="text-center text-[12px] text-[var(--sm-text-2)]">
          All settings persist on this device.
        </p>
      </div>
    </>
  );
}

/* ============================================================
 * SIDE DRAWER
 * ============================================================ */
function SideDrawer() {
  const a = useApp();
  const [logoutOpen, setLogoutOpen] = useState(false);
  if (!a.drawerOpen) return null;

  type Item = { icon: string; label: string; to: Screen; lock?: boolean };
  const items: Item[] = [
    { icon: "🏠", label: a.t("home"), to: "home" },
    { icon: "🗺️", label: a.t("indoorNavigation"), to: "navHome", lock: a.isGuest },
    { icon: "🏁", label: a.t("fastestCheckout"), to: "checkoutItems", lock: a.isGuest },
    { icon: "🤝", label: a.t("iNeedHelp"), to: "helpType", lock: a.isGuest },
    { icon: "⚠️", label: a.t("reportIssue"), to: "reportType", lock: a.isGuest },
    { icon: "🌡️", label: a.t("foodTracker"), to: "scan", lock: a.isGuest },
    { icon: "🚗", label: a.t("outdoorServices"), to: "outdoor" },
    { icon: "👤", label: a.t("myProfile"), to: "profile" },
  ];

  const tap = (it: Item) => {
    if (it.lock) {
      a.showToast(a.t("cartRequired"), "error");
      return;
    }
    a.reset(it.to);
  };

  return (
    <div className="fixed inset-0 z-40 flex" onClick={() => a.setDrawerOpen(false)}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-full w-[300px] max-w-[85%] flex-col bg-[var(--sm-surface)] shadow-2xl sm-drawer-in"
      >
        <div className="flex items-center justify-between border-b border-[var(--sm-border)] px-4 py-3">
          <Logo size={28} />
          <button
            onClick={() => a.setDrawerOpen(false)}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center text-[18px]"
          >
            ✕
          </button>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--sm-bg)] p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--sm-primary)] text-[16px] font-bold text-white">
              {a.isGuest ? "G" : "SH"}
            </div>
            <div>
              <p className="text-[14px] font-bold text-[var(--sm-text)]">
                {a.isGuest ? a.t("guestMode") : "Shopper"}
              </p>
              <p className="text-[11.5px] text-[var(--sm-text-2)]">
                {STORES.find((s) => s.id === a.storeId)!.name}
              </p>
              {a.cartId && <p className="text-[11px] text-[var(--sm-text-2)]">{a.cartId}</p>}
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-0.5 px-2">
            {items.map((it) => (
              <button
                key={it.to + it.label}
                onClick={() => tap(it)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] ${a.screen === it.to ? "bg-[var(--sm-primary)]/10 font-semibold text-[var(--sm-primary)]" : "text-[var(--sm-text)]"}`}
              >
                <span className="text-[18px]">{it.icon}</span>
                <span className="flex-1">{it.label}</span>
                {it.lock && <span className="text-[12px] text-[var(--sm-text-2)]">🔒</span>}
              </button>
            ))}
          </div>
          <div className="my-2 border-t border-[var(--sm-border)]" />
          <div className="space-y-0.5 px-2">
            <button
              onClick={() => a.reset("settings")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[14px] text-[var(--sm-text)]"
            >
              <span className="text-[18px]">⚙️</span>
              <span className="flex-1">{a.t("settings")}</span>
            </button>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-[18px]">🌙</span>
              <span className="flex-1 text-[14px] text-[var(--sm-text)]">{a.t("darkMode")}</span>
              <Toggle checked={a.dark} onChange={a.setDark} label="Dark" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-[18px]">🌐</span>
              <span className="flex-1 text-[14px] text-[var(--sm-text)]">{a.t("language")}</span>
              <div className="flex overflow-hidden rounded-full border border-[var(--sm-border)] text-[11px]">
                <button
                  onClick={() => a.setLang("en")}
                  className={`px-2.5 py-1 ${a.lang === "en" ? "bg-[var(--sm-primary)] text-white" : "text-[var(--sm-text-2)]"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => a.setLang("my")}
                  className={`px-2.5 py-1 ${a.lang === "my" ? "bg-[var(--sm-primary)] text-white" : "text-[var(--sm-text-2)]"}`}
                >
                  MY
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-[var(--sm-border)] p-3">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--sm-error)]/10 text-[14px] font-semibold text-[var(--sm-error)]"
          >
            🚪 {a.t("logout")}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={logoutOpen}
        title={a.t("logout")}
        message={a.t("logoutConfirm")}
        confirmLabel={a.t("logout")}
        danger
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          a.setCartId("");
          a.setIsGuest(false);
          try {
            localStorage.removeItem("sysmart_loc");
          } catch { }
          a.reset("login");
          setTimeout(() => a.showToast(a.t("loggedOut"), "success"), 100);
        }}
      />
    </div>
  );
}

/* ============================================================
 * BOTTOM NAV
 * ============================================================ */
function BottomNav() {
  const a = useApp();
  const [cartReqOpen, setCartReqOpen] = useState(false);
  const tabs: { id: Screen; label: string; icon: string; lockGuest?: boolean }[] = [
    { id: "home", label: a.t("home"), icon: "🏠" },
    { id: "scan", label: a.t("scan"), icon: "📷", lockGuest: true },
    { id: "navHome", label: a.t("navigate"), icon: "🗺️", lockGuest: true },
    { id: "outdoor", label: a.t("services"), icon: "⚙️" },
    { id: "profile", label: a.t("myProfile"), icon: "👤" },
  ];
  const activeMap: Record<string, Screen[]> = {
    home: ["home"],
    scan: ["scan", "product", "tempGraph", "vendorView"],
    navHome: ["navHome", "navMap", "navAR", "navArrived"],
    outdoor: ["outdoor", "traffic", "invSelect", "invResults"],
    profile: ["profile", "friend", "settings"],
  };
  const tap = (t: (typeof tabs)[number]) => {
    if (t.lockGuest && a.isGuest) {
      setCartReqOpen(true);
      return;
    }
    a.reset(t.id);
  };
  return (
    <>
      <div className="flex h-16 items-stretch border-t border-[var(--sm-border)] bg-[var(--sm-surface)] pb-1">
        {tabs.map((t) => {
          const active = activeMap[t.id]?.includes(a.screen);
          return (
            <button
              key={t.id}
              onClick={() => tap(t)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 active:scale-95"
            >
              <span
                className={`leading-none transition ${active ? "text-[22px]" : "text-[20px] opacity-60"}`}
              >
                {t.icon}
              </span>
              <span
                className={`text-[11px] ${active ? "font-bold text-[var(--sm-primary)]" : "text-[var(--sm-text-2)]"}`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
      <CartRequiredSheet open={cartReqOpen} onClose={() => setCartReqOpen(false)} />
    </>
  );
}

/* ============================================================
 * SHELL
 * ============================================================ */
function CurrentScreen() {
  const a = useApp();
  switch (a.screen) {
    case "splash":
      return <SplashScreen />;
    case "login":
      return <LoginScreen />;
    case "home":
      return <HomeScreen />;
    case "navHome":
      return <NavHomeScreen />;
    case "navMap":
      return <NavMapScreen />;
    case "navAR":
      return <NavARScreen />;
    case "navArrived":
      return <NavArrivedScreen />;
    case "checkoutItems":
      return <CheckoutItemsScreen />;
    case "checkoutLanes":
      return <CheckoutLanesScreen />;
    case "checkoutDone":
      return <CheckoutDoneScreen />;
    case "helpType":
      return <HelpTypeScreen />;
    case "helpConfirm":
      return <HelpConfirmScreen />;
    case "reportType":
      return <ReportTypeScreen />;
    case "reportCart":
      return <ReportCartScreen />;
    case "reportDone":
      return <ReportDoneScreen />;
    case "scan":
      return <ScanScreen />;
    case "product":
      return <ProductScreen />;
    case "tempGraph":
      return <TempGraphScreen />;
    case "vendorView":
      return <VendorViewScreen />;
    case "outdoor":
      return <OutdoorScreen />;
    case "traffic":
      return <TrafficScreen />;
    case "invSelect":
      return <InvSelectScreen />;
    case "invResults":
      return <InvResultsScreen />;
    case "profile":
      return <ProfileScreen />;
    case "friend":
      return <FriendScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return null;
  }
}

function Shell() {
  const a = useApp();

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("sm-dark", a.dark);
    document.documentElement.classList.toggle("sm-hc", a.accessibilityMode && a.highContrast);
  }, [a.dark, a.accessibilityMode, a.highContrast]);

  const showChrome = a.screen !== "splash" && a.screen !== "login";
  const showNav = showChrome;

  const fontCls = a.accessibilityMode
    ? a.fontSize === "xlarge"
      ? "sm-font-xlarge"
      : a.fontSize === "large"
        ? "sm-font-large"
        : "sm-font-standard"
    : "";
  const motionCls = a.reduceMotion ? "sm-no-motion" : "";
  const a11yCls = a.accessibilityMode ? "sm-a11y" : "";
  const spacingCls = a.accessibilityMode && a.extraSpacing ? "sm-spacing" : "";

  return (
    <div className={`sm-stage ${a.dark ? "sm-dark sm-dark-stage" : ""}`}>
      <div className={`sm-frame ${fontCls} ${motionCls} ${a11yCls} ${spacingCls}`}>
        <div className="sm-notch" />
        {showChrome && (
          <div className="sm-statusbar">
            <span>9:41</span>
            <span className="flex items-center gap-1">
              <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
                <path d="M1 7h2v3H1zm4-2h2v5H5zm4-2h2v7H9zm4-2h2v9h-2z" />
              </svg>
              <span>100%</span>
            </span>
          </div>
        )}
        {/* sm-app-body wraps content+nav so zoom scales both together */}
        <div className="sm-app-body">
          <div className="sm-content sm-bg-root">
            <CurrentScreen />
          </div>
          {showNav && <BottomNav />}
        </div>
        {a.toast && <Toast message={a.toast.msg} type={a.toast.type} onDone={a.clearToast} />}
        <SideDrawer />
        <LocationSheet />
      </div>
    </div>
  );
}

export default function SysmartApp() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
