"use client"

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password";
import "@/i18n";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        {t("forgotPassword.back")}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t("forgotPassword.title")}</h1>
        <p className="text-muted-foreground">{t("forgotPassword.subtitle")}</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
