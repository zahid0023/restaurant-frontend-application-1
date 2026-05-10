"use client"

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LoginForm } from "@/components/auth/login-form";
import "@/i18n";

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("login.title")}</h1>
        <p className="text-muted-foreground">{t("login.subtitle")}</p>
      </div>

      <LoginForm />

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t("login.noAccount")} </span>
        <Link href="/register" className="text-primary hover:underline">
          {t("login.register")}
        </Link>
      </div>
    </div>
  );
}
