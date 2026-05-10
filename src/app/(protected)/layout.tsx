"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { PortalHeader } from "@/layouts/portal/portal-header"
import { PortalSidebar } from "@/layouts/portal/portal-sidebar"
import { getToken } from "../../services/api"

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace("/login")
      return
    }
    // Sync localStorage token to cookie so middleware stays in sync
    document.cookie = `access_token=${token}; path=/; SameSite=Lax`
    setReady(true)
  }, [router])

  if (!ready) return null

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <PortalSidebar />
        <div className="flex flex-1 flex-col">
          <PortalHeader />
          <main className="flex-1 overflow-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
