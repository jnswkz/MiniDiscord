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

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
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
    // Skip auth for now — redirect directly to dashboard
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className="w-full rounded-lg bg-background p-8 shadow-2xl">
      <div className="mb-6 text-center">
        <h1 className="text-[26px] font-bold leading-tight text-foreground">
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          {t("auth.gladToSeeYou")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t("auth.email")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="login-email"
            type="email"
            placeholder="name@example.com"
            className="h-11"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className="block text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t("auth.password")} <span className="text-destructive">*</span>
          </label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            className="h-11"
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
            className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
          >
            {t("auth.forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base font-medium"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
  );
}
