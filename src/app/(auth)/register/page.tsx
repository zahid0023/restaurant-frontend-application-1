"use client"

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { RegisterForm } from "@/components/auth/register-form";
import "@/i18n";

export default function RegisterPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-bold text-2xl">{t("register.title")}</h1>
        <p className="text-muted-foreground">{t("register.subtitle")}</p>
      </div>

      <RegisterForm />

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">{t("register.haveAccount")} </span>
        <Link href="/login" className="text-primary hover:underline">
          {t("register.signIn")}
        </Link>
      </div>
    </div>
  );
}