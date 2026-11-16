// pages/AccountingDashboard/main.jsx
import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AccountantSidebar } from "./sidebar/components";

export default function AccountingDashboard({ children }) {
  // Explicitly manage sidebar open/close state so it never gets stuck
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const currentUserPermissions = [
    "view_dashboard",
    "view_ledger",
    "edit_entries",
    "manage_invoices",
    "view_reports",
    "view_tax",
    "view_audit_logs",
    "view_budgets",
    "view_analytics",
    "manage_settings",
  ];

  const handleGlobalAudit = (auditPayload) => {
    console.log("Audit Event Triggered:", auditPayload);
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen} className={'bg-gray-900'}>
      <AccountantSidebar
        userPermissions={currentUserPermissions}
        onAuditNavigate={handleGlobalAudit}
      />

      <SidebarInset>
        <header className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-gray-900 p-4">
          <SidebarTrigger className="cursor-pointer" />
          <span className="text-sm font-medium text-muted-foreground">
            Accountant Portal
          </span>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
