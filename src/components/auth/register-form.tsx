"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { register } from "@/services/auth"

export function RegisterForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    user_name: "",
    password: "",
    confirm_password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success(t("register.successToast"))
      router.push("/login")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>{t("register.cardTitle")}</CardTitle>
        <CardDescription>{t("register.cardDesc")}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="user_name">{t("login.email")}</FieldLabel>
              <Input
                id="user_name"
                name="user_name"
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={form.user_name}
                onChange={handleChange}
                required
              />
              <FieldDescription>{t("register.emailDesc")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">{t("login.password")}</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <FieldDescription>{t("register.passwordDesc")}</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm_password">
                {t("register.confirmPassword")}
              </FieldLabel>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={handleChange}
                required
              />
              <FieldDescription>{t("register.confirmPasswordDesc")}</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? t("register.submitting") : t("register.submit")}
                </Button>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
