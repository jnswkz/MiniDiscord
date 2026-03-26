"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusAvatar } from "@/components/ui/StatusAvatar";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/ScrollArea";
import {
  User,
  Globe,
  LogOut,
  X,
  Edit2,
  Pencil,
  Camera,
  Sparkles,
  Check,
} from "lucide-react";
import { CURRENT_USER } from "@/lib/mock-data";
import { useTranslation, useI18nStore, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type SettingsTab = "account" | "language";

const LANGUAGES: { key: Locale; label: string; nativeLabel: string }[] = [
  { key: "en", label: "English", nativeLabel: "English" },
  { key: "vi", label: "Tiếng Việt", nativeLabel: "Vietnamese" },
];

const TIME_FORMATS = [
  { key: "auto", label: { en: "Auto", vi: "Tự động" } },
  { key: "12h", label: { en: "12 hour", vi: "12 giờ" } },
  { key: "24h", label: { en: "24 hour", vi: "24 giờ" } },
] as const;

/* ─── Avatar with popup ────────────────────────────────────────────── */
function AvatarWithPopup() {
  const { locale } = useTranslation();
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    }
    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopup]);

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={() => setShowPopup(!showPopup)}
        className="group relative cursor-pointer"
      >
        <StatusAvatar
          src={CURRENT_USER.avatarUrl}
          fallback={CURRENT_USER.username}
          status={CURRENT_USER.status}
          size="xl"
        />
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>

      {showPopup && (
        <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-lg bg-background-tertiary p-2 shadow-xl border border-border min-w-[180px]">
          <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground hover:bg-accent hover:text-white transition-colors cursor-pointer">
            <Camera className="h-3.5 w-3.5" />
            {locale === "vi" ? "Đổi Ảnh Đại Diện" : "Change Avatar"}
          </button>
          <button className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-foreground hover:bg-accent hover:text-white transition-colors cursor-pointer">
            <Sparkles className="h-3.5 w-3.5" />
            {locale === "vi" ? "Thay Đổi Trang Trí" : "Change Decoration"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── My Account tab (with Bảo mật / Trạng thái sub-tabs) ──────────── */
type AccountSubTab = "security" | "standing";

function SecurityContent() {
  const { locale } = useTranslation();

  return (
    <div className="mt-4">
      <div className="overflow-hidden rounded-lg">
        {/* Profile banner */}
        <div className="h-[100px] bg-accent" />

        {/* Profile card */}
        <div className="relative bg-background-secondary px-4 pb-4">
          <div className="relative -mt-10 mb-3 flex items-end justify-between">
            <AvatarWithPopup />
            <Button variant="outline" size="sm" className="text-xs h-8">
              <Edit2 className="mr-1.5 h-3 w-3" />
              {locale === "vi"
                ? "Chỉnh Sửa Hồ Sơ Người Dùng"
                : "Edit User Profile"}
            </Button>
          </div>

          {/* Info fields */}
          <div className="space-y-3 rounded-lg bg-background-tertiary p-4">
            <InfoRow
              label={locale === "vi" ? "Tên hiển thị" : "Display Name"}
              value={CURRENT_USER.username}
            />
            <InfoRow
              label={locale === "vi" ? "Tên đăng nhập" : "Username"}
              value={CURRENT_USER.username.toLowerCase()}
            />
            <InfoRow label="Email" value={CURRENT_USER.email} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StandingContent() {
  const { locale } = useTranslation();

  const STEPS = locale === "vi"
    ? ["Hoàn toàn ổn!", "Bị giới hạn", "Giới hạn ở\nmức độ\nnghiêm trọng", "Rủi ro cao", "Bị đình chỉ"]
    : ["All good!", "Limited", "Severely\nLimited", "At Risk", "Suspended"];

  const activeStep = 0; // Account is in good standing

  return (
    <div className="mt-6">
      {/* Status card */}
      <div className="flex items-start gap-4">
        <StatusAvatar
          src={CURRENT_USER.avatarUrl}
          fallback={CURRENT_USER.username}
          status={CURRENT_USER.status}
          size="xl"
        />
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-base text-foreground">
            {locale === "vi" ? "Tài khoản của bạn " : "Your account is "}
            <span className="font-bold text-success">
              {locale === "vi" ? "hoàn toàn ổn" : "in good standing"}
            </span>
          </p>
          <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
            {locale === "vi"
              ? <>Cảm ơn vì đã tuân thủ <span className="text-accent hover:underline cursor-pointer">Điều Khoản Dịch Vụ</span> và <span className="text-accent hover:underline cursor-pointer">Nguyên Tắc Cộng Đồng</span> của Discord. Nếu bạn vi phạm các quy tắc, quy tắc bị vi phạm sẽ hiện thị tại đây.</>
              : <>Thanks for following Discord&apos;s <span className="text-accent hover:underline cursor-pointer">Terms of Service</span> and <span className="text-accent hover:underline cursor-pointer">Community Guidelines</span>. If you break any rules, violations will appear here.</>}
          </p>
        </div>
      </div>

      {/* Standing progress bar */}
      <div className="mt-8">
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                    i === activeStep
                      ? "border-success bg-success"
                      : i < activeStep
                        ? "border-success bg-success"
                        : "border-muted-foreground/30 bg-transparent"
                  )}
                >
                  {i <= activeStep && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </div>
                <p className={cn(
                  "mt-2 text-center text-[11px] leading-tight whitespace-pre-line",
                  i === activeStep ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {step}
                </p>
              </div>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1",
                    i < activeStep ? "bg-success" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountTab() {
  const { locale } = useTranslation();
  const [subTab, setSubTab] = useState<AccountSubTab>("security");

  const SUB_TABS: { key: AccountSubTab; label: string }[] = [
    { key: "security", label: locale === "vi" ? "Bảo mật" : "Security" },
    { key: "standing", label: locale === "vi" ? "Trạng thái" : "Standing" },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-border">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={cn(
              "pb-2 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
              subTab === tab.key
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "security" && <SecurityContent />}
      {subTab === "standing" && <StandingContent />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { locale } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase text-muted-foreground">
          {label}
        </p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
      <Button variant="outline" size="sm" className="text-xs h-7">
        {locale === "vi" ? "Chỉnh sửa" : "Edit"}
      </Button>
    </div>
  );
}

/* ─── Language & Time tab ──────────────────────────────────────────── */
function LanguageTab() {
  const { locale } = useTranslation();
  const setLocale = useI18nStore((s) => s.setLocale);
  const [timeFormat, setTimeFormat] = useState<string>("auto");

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-4">
        {locale === "vi" ? "Ngôn Ngữ & Thời Gian" : "Language & Time"}
      </h2>

      {/* Language */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {locale === "vi" ? "Chọn Ngôn ngữ" : "Select Language"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {locale === "vi"
            ? "Chọn ngôn ngữ bạn muốn MiniDiscord hiển thị."
            : "Choose the language you want MiniDiscord to display."}
        </p>

        <div className="mt-3 space-y-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.key}
              onClick={() => setLocale(lang.key)}
              className={cn(
                "group flex w-full items-center justify-between rounded-md px-3 py-2.5 transition-all cursor-pointer",
                locale === lang.key
                  ? "bg-accent/20 ring-1 ring-accent"
                  : "bg-background-tertiary hover:bg-secondary/50 hover:ring-1 hover:ring-border"
              )}
            >
              <span className="text-sm text-foreground">
                {lang.label}
              </span>
              {locale === lang.key && (
                <Check className="h-4 w-4 text-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Time format */}
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {locale === "vi" ? "Định dạng thời gian" : "Time Format"}
        </h3>

        <div className="mt-3 space-y-2.5">
          {TIME_FORMATS.map((fmt) => (
            <label
              key={fmt.key}
              onClick={() => setTimeFormat(fmt.key)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={cn(
                  "flex h-[16px] w-[16px] items-center justify-center rounded-full border-2 transition-colors",
                  timeFormat === fmt.key
                    ? "border-accent"
                    : "border-muted-foreground/40 group-hover:border-muted-foreground"
                )}
              >
                {timeFormat === fmt.key && (
                  <div className="h-2 w-2 rounded-full bg-accent" />
                )}
              </div>
              <span className="text-sm text-foreground">
                {fmt.label[locale]}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Settings Overlay ────────────────────────────────────────── */
export function SettingsOverlay({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const { locale } = useTranslation();
  const router = useRouter();

  const TABS: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
    {
      key: "account",
      label: locale === "vi" ? "Tài Khoản Của Tôi" : "My Account",
      icon: User,
    },
    {
      key: "language",
      label: locale === "vi" ? "Ngôn Ngữ & Thời Gian" : "Language & Time",
      icon: Globe,
    },
  ];

  function handleLogout() {
    onClose();
    router.push("/login");
  }

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Settings container — centered, smaller than viewport */}
      <div className="relative z-10 flex w-[calc(100vw-80px)] max-w-[960px] h-[calc(100vh-80px)] max-h-[680px] rounded-lg overflow-hidden shadow-2xl border border-border/50 animate-in fade-in zoom-in-95 duration-200">
        {/* ─── Left sidebar ─── */}
        <div className="flex w-[218px] shrink-0 flex-col bg-background-secondary">
          {/* User header */}
          <div className="flex items-center gap-2.5 px-3 pt-4 pb-3">
            <StatusAvatar
              src={CURRENT_USER.avatarUrl}
              fallback={CURRENT_USER.username}
              status={CURRENT_USER.status}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground leading-tight">
                {CURRENT_USER.username}
              </p>
              <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-accent transition-colors cursor-pointer">
                <span>
                  {locale === "vi" ? "Chỉnh sửa hồ sơ" : "Edit Profile"}
                </span>
                <Pencil className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-2.5 pb-2">
            <div className="flex h-7 items-center rounded bg-background-tertiary px-2">
              <span className="text-[11px] text-muted-foreground">
                {locale === "vi" ? "Tìm kiếm" : "Search"}
              </span>
            </div>
          </div>

          {/* Section title */}
          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {locale === "vi" ? "Cài đặt người dùng" : "User Settings"}
          </p>

          {/* Tabs */}
          <ScrollArea className="flex-1 px-2">
            <nav className="space-y-0.5">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-[5px] text-[13px] transition-colors cursor-pointer",
                      activeTab === tab.key
                        ? "bg-secondary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Separator + Logout */}
            <div className="my-2 border-t border-border" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded px-2 py-[5px] text-[13px] text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{locale === "vi" ? "Đăng Xuất" : "Log Out"}</span>
            </button>
          </ScrollArea>
        </div>

        {/* ─── Right content ─── */}
        <div className="flex flex-1 flex-col min-w-0 bg-background">
          {/* Top bar: title + close */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <h1 className="text-sm font-bold text-foreground uppercase tracking-wide">
              {activeTab === "account"
                ? locale === "vi"
                  ? "Tài Khoản Của Tôi"
                  : "My Account"
                : locale === "vi"
                  ? "Ngôn Ngữ & Thời Gian"
                  : "Language & Time"}
            </h1>

            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/40 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-semibold text-muted-foreground">
                ESC
              </span>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 px-6 pb-6">
            <div className="max-w-[580px] mx-auto">
              {activeTab === "account" && <AccountTab />}
              {activeTab === "language" && <LanguageTab />}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
