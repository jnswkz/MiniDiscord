"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    console.log("Login:", data);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 800);
  }

  function handleGoogleLogin() {
    setIsGoogleLoading(true);
    console.log("Google login");
    setTimeout(() => {
      setIsGoogleLoading(false);
      router.push("/dashboard");
    }, 1200);
  }

  return (
    <div className="w-full rounded-lg bg-background/95 backdrop-blur-sm p-8 shadow-2xl border border-border/30">
      <div className="flex gap-8">
        {/* ─── Column 1: Email/Password Login ─── */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 text-center">
            <h1 className="text-[26px] font-bold leading-tight text-foreground">
              {t("auth.welcomeBack")}
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              {t("auth.gladToSeeYou")}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
                {t("auth.email")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="name@example.com"
                className="h-10"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"
              >
                {t("auth.password")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                className="h-10"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
              <Link
                href="#"
                className="mt-0.5 inline-block text-xs font-medium text-accent hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              className="h-11 w-full text-base font-medium"
              disabled={isLoading}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("auth.login")}
            </Button>

            <p className="text-sm text-muted-foreground">
              {t("auth.needAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-accent hover:underline"
              >
                {t("auth.register")}
              </Link>
            </p>
          </form>
        </div>

        {/* ─── Vertical Divider ─── */}
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            HOẶC
          </span>
          <div className="w-px flex-1 bg-border" />
        </div>

        {/* ─── Column 2: Google Login ─── */}
        <div className="flex w-[240px] shrink-0 flex-col items-center justify-center">
          <div className="flex h-[140px] w-[140px] items-center justify-center rounded-2xl bg-background-tertiary border border-border/50 mb-5">
            <GoogleIcon className="h-16 w-16" />
          </div>

          <h3 className="text-lg font-bold text-foreground text-center">
            Đăng nhập bằng Google
          </h3>
          <p className="mt-2 text-center text-xs text-muted-foreground leading-relaxed">
            Sử dụng tài khoản Google của bạn để đăng nhập nhanh chóng và an
            toàn.
          </p>

          <Button
            type="button"
            variant="outline"
            className="mt-4 h-10 w-full gap-2 text-sm font-medium"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Tiếp tục với Google
          </Button>

          <p className="mt-3 text-center text-[11px] text-muted-foreground/60 leading-relaxed">
            Hoặc, đăng nhập bằng mã bảo mật.
          </p>
        </div>
      </div>
    </div>
  );
}
