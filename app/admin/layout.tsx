import type React from "react"
import { AdminSidebar } from "../../components/admin-sidebar"
import { AdminAuthWrapper } from "../../components/admin-auth-wrapper"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthWrapper>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </AdminAuthWrapper>
  )
}


