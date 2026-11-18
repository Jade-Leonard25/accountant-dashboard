import React, { useState } from "react";
import { Outlet } from "react-router";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AccountantSidebar } from "./sidebar/components";
import { useSession,signOut } from "@/lib/auth-client"; // 👈 Import useSession
import * as alertDialog from "@/components/ui/alert-dialog"; // 👈 Import alert dialog components
import {Button} from "@/components/ui/button"; // 👈 Import Button component
export default function AccountingDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Optional: Fetch actual session data & user info
  const { data: session } = useSession();
  const userName = session?.user?.name || "Accountant";

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
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={setSidebarOpen}
      className="h-full min-h-0 bg-gray-900"
    >
      <AccountantSidebar
        userPermissions={currentUserPermissions}
        onAuditNavigate={handleGlobalAudit}
      />

      <SidebarInset className="min-h-0 overflow-auto">
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b bg-gray-900 p-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="cursor-pointer" />
            <span className="text-sm font-medium text-muted-foreground">
              Accountant Portal
            </span>
          </div>
          {/* Display active logged-in user dynamically */}
          <span className="text-xs text-gray-400">
            <strong className="dark:text-gray-200 text-gray-200">{userName}</strong>
          </span>
          <alertDialog.AlertDialog>
            <alertDialog.AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Sign Out
              </Button>
            </alertDialog.AlertDialogTrigger>
            <alertDialog.AlertDialogContent>
              <alertDialog.AlertDialogHeader>
                <alertDialog.AlertDialogTitle>
                  Are you sure you want to sign out?
                </alertDialog.AlertDialogTitle>
                <alertDialog.AlertDialogDescription>
                  You will be logged out of the accountant portal.
                </alertDialog.AlertDialogDescription>
              </alertDialog.AlertDialogHeader>
              <alertDialog.AlertDialogFooter>
                <alertDialog.AlertDialogCancel>Cancel</alertDialog.AlertDialogCancel>
              
                <Button onClick={() => signOut()}>Sign Out</Button>
              </alertDialog.AlertDialogFooter>
            </alertDialog.AlertDialogContent>
          </alertDialog.AlertDialog>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
