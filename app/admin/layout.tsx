import type React from "react"
import { AdminAuthWrapper } from "../../components/admin-auth-wrapper"
import { AdminShell } from "../../components/admin-shell"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthWrapper>
      <AdminShell>{children}</AdminShell>
    </AdminAuthWrapper>
  )
}


