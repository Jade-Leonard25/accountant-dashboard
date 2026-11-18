import React from "react";
import { NavLink, useLocation } from "react-router";
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  FileBarChart2,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Settings,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const BASE = "/accountant_dashboard";

export const accountant_dashboard_sidebar_selection = [
  {
    id: "dashboard",
    name: "Dashboard",
    link: "/dashboard",
    icon: LayoutDashboard,
    audit_code: "ACC_DASH_01",
    permissions: ["view_dashboard"],
    children: [],
  },
  {
    id: "general_ledger",
    name: "General Ledger",
    link: "/ledger",
    icon: BookOpen,
    audit_code: "ACC_GL_02",
    permissions: ["view_ledger", "edit_entries"],
    children: [
      {
        id: "chart_of_accounts",
        name: "Chart of Accounts",
        link: "/ledger/accounts",
        audit_code: "ACC_GL_02_A",
      },
      {
        id: "journal_entries",
        name: "Journal Entries",
        link: "/ledger/journals",
        audit_code: "ACC_GL_02_B",
      },
      {
        id: "bank_reconciliation",
        name: "Bank Reconciliation",
        link: "/ledger/reconcile",
        audit_code: "ACC_GL_02_C",
      },
    ],
  },
  {
    id: "accounts_payable_receivable",
    name: "Invoices & Bills",
    link: "/transactions",
    icon: Receipt,
    audit_code: "ACC_APAR_03",
    permissions: ["manage_invoices", "manage_bills"],
    children: [
      {
        id: "accounts_receivable",
        name: "Accounts Receivable",
        link: "/transactions/receivable",
        audit_code: "ACC_APAR_03_A",
      },
      {
        id: "accounts_payable",
        name: "Accounts Payable",
        link: "/transactions/payable",
        audit_code: "ACC_APAR_03_B",
      },
      {
        id: "payroll",
        name: "Payroll Management",
        link: "/transactions/payroll",
        audit_code: "ACC_APAR_03_C",
      },
    ],
  },
  {
    id: "financial_reports",
    name: "Financial Reports",
    link: "/reports",
    icon: FileBarChart2,
    audit_code: "ACC_REP_04",
    permissions: ["view_reports", "export_reports"],
    children: [
      {
        id: "income_statement",
        name: "Income Statement (P&L)",
        link: "/reports/income-statement",
        audit_code: "ACC_REP_04_A",
      },
      {
        id: "balance_sheet",
        name: "Balance Sheet",
        link: "/reports/balance-sheet",
        audit_code: "ACC_REP_04_B",
      },
      {
        id: "cash_flow",
        name: "Cash Flow Statement",
        link: "/reports/cash-flow",
        audit_code: "ACC_REP_04_C",
      },
      {
        id: "trial_balance",
        name: "Trial Balance",
        link: "/reports/trial-balance",
        audit_code: "ACC_REP_04_D",
      },
    ],
  },
  {
    id: "tax_preparation",
    name: "Tax Preparation",
    link: "/tax",
    icon: Calculator,
    audit_code: "ACC_TAX_05",
    permissions: ["view_tax", "file_tax"],
    children: [
      {
        id: "tax_filings",
        name: "Tax Filings & Forms",
        link: "/tax/filings",
        audit_code: "ACC_TAX_05_A",
      },
      {
        id: "vat_sales_tax",
        name: "VAT & Sales Tax",
        link: "/tax/vat",
        audit_code: "ACC_TAX_05_B",
      },
      {
        id: "withholding_tax",
        name: "Withholding Tax",
        link: "/tax/withholding",
        audit_code: "ACC_TAX_05_C",
      },
    ],
  },
  {
    id: "audit_compliance",
    name: "Audit & Compliance",
    link: "/audit",
    icon: ShieldCheck,
    audit_code: "ACC_AUD_06",
    permissions: ["view_audit_logs", "manage_compliance"],
    children: [
      {
        id: "system_audit_trail",
        name: "System Audit Trail",
        link: "/audit/trail",
        audit_code: "ACC_AUD_06_A",
      },
      {
        id: "internal_controls",
        name: "Internal Controls",
        link: "/audit/controls",
        audit_code: "ACC_AUD_06_B",
      },
      {
        id: "period_closing",
        name: "Period Closing",
        link: "/audit/closing",
        audit_code: "ACC_AUD_06_C",
      },
    ],
  },
  {
    id: "budgeting_forecasting",
    name: "Budgeting & Forecasting",
    link: "/budgeting",
    icon: TrendingUp,
    audit_code: "ACC_BUD_07",
    permissions: ["view_budgets", "edit_budgets"],
    children: [
      {
        id: "annual_budgets",
        name: "Annual Budgets",
        link: "/budgeting/annual",
        audit_code: "ACC_BUD_07_A",
      },
      {
        id: "cash_forecast",
        name: "Cash Flow Forecast",
        link: "/budgeting/forecast",
        audit_code: "ACC_BUD_07_B",
      },
      {
        id: "variance_analysis",
        name: "Variance Analysis",
        link: "/budgeting/variance",
        audit_code: "ACC_BUD_07_C",
      },
    ],
  },
  {
    id: "advisory_insights",
    name: "Advisory & Insights",
    link: "/advisory",
    icon: Lightbulb,
    audit_code: "ACC_ADV_08",
    permissions: ["view_analytics"],
    children: [
      {
        id: "kpi_scorecard",
        name: "KPI Scorecard",
        link: "/advisory/kpis",
        audit_code: "ACC_ADV_08_A",
      },
      {
        id: "cost_analysis",
        name: "Cost & Margin Analysis",
        link: "/advisory/costs",
        audit_code: "ACC_ADV_08_B",
      },
    ],
  },
  {
    id: "settings",
    name: "System Settings",
    link: "/settings",
    icon: Settings,
    audit_code: "ACC_SET_09",
    permissions: ["manage_settings"],
    children: [
      {
        id: "fiscal_year",
        name: "Fiscal Year & Currency",
        link: "/settings/fiscal",
        audit_code: "ACC_SET_09_A",
      },
      {
        id: "user_roles",
        name: "Roles & Permissions",
        link: "/settings/roles",
        audit_code: "ACC_SET_09_B",
      },
    ],
  },
];

export function AccountantSidebar({ userPermissions = null, onAuditNavigate }) {
  const { pathname } = useLocation();

  const allowedMenus = userPermissions
    ? accountant_dashboard_sidebar_selection.filter((item) =>
        item.permissions.some((perm) => userPermissions.includes(perm)),
      )
    : accountant_dashboard_sidebar_selection;

  const handleAuditClick = (item) => {
    onAuditNavigate?.({
      audit_code: item.audit_code,
      section_id: item.id,
      route: `${BASE}${item.link}`,
      timestamp: new Date().toISOString(),
    });
  };

  const isActive = (link) => pathname === `${BASE}${link}`;

  return (
    <Sidebar collapsible="icon" className="h-full bg-slate-900">
      <div className="bg-slate-900 p-2">
        <SidebarHeader className="border-b bg-gray-900 px-4 py-3 font-semibold text-gray-200">
          Accounting Suite
        </SidebarHeader>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-200 dark:text-gray-200">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedMenus.map((menu) => {
                const Icon = menu.icon;
                const hasChildren = menu.children?.length > 0;

                if (!hasChildren) {
                  return (
                    <SidebarMenuItem
                      key={menu.id}
                      className={"text-black dark:text-gray-200"}
                    >
                      <SidebarMenuButton
                        asChild
                        tooltip={menu.name}
                        isActive={isActive(menu.link)}
                        className="text-black dark:text-gray-200"
                      >
                        <NavLink
                          to={`${BASE}${menu.link}`}
                          onClick={() => handleAuditClick(menu)}
                          className={"flex inline-flex gap-2"}
                        >
                          {Icon && <Icon />}
                          <span className="text-black dark:text-gray-200">
                            {menu.name}
                          </span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                const groupActive = pathname.startsWith(`${BASE}${menu.link}`);

                return (
                  <Collapsible
                    key={menu.id}
                    asChild
                    defaultOpen={groupActive}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          tooltip={menu.name}
                          className="text-black dark:text-gray-200"
                        >
                          {Icon && <Icon />}
                          <span className="text-black dark:text-gray-200">
                            {menu.name}
                          </span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {menu.children.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(subItem.link)}
                                className={
                                  "text-black dark:text-gray-200 cursor-pointer hover:text-gray-200 hover:bg-black transition duration-500 rounded py-2 px-4"
                                }
                              >
                                <NavLink
                                  to={`${BASE}${subItem.link}`}
                                  onClick={() => handleAuditClick(subItem)}
                                >
                                  <span className="text-black dark:text-gray-200 hover:text-gray-200">
                                    {subItem.name}
                                  </span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
