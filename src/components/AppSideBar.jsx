import * as sidebar from "@/components/ui/sidebar";
import { Link, Outlet, useLocation } from "react-router";
import PillNav from "@/components/PillNav";


const darkTheme = {
  "--sidebar": "#060911",
  "--sidebar-foreground": "#e2e8f0",
  "--sidebar-border": "#1e293b",
  "--border": "#1e293b",
  "--sidebar-accent": "#1e293b",
  "--sidebar-accent-foreground": "#ffffff",
};

const items = [
  { label: "Home", href: "/" },
  { label: "Login / Profile", href: "/login" },
  { label: "Settings", href: "/settings" },
];

function RouterLink({ href, ...props }) {
  return <Link to={href} {...props} />;
}

export default function AppSideBar() {
  const { pathname } = useLocation();

  return (
    <div className="relative z-0 h-full w-full transform-gpu overflow-hidden bg-gray-200">
      <sidebar.SidebarProvider
        style={darkTheme}
        className="h-full min-h-0 bg-gray-200 text-slate-900"
      >
        <sidebar.Sidebar className="bg-gray-200">
          <sidebar.SidebarHeader className="font-bold px-4 py-3 text-gray-200">
            Employees Management
          </sidebar.SidebarHeader>

          <sidebar.SidebarContent className="p-2">
            <PillNav
              className="pill-nav--vertical"
              linkComponent={RouterLink}
              items={items}
              activeHref={pathname}
              itemStyle="plain"
              hoverEffect="fill"
              indicator="pill"
              layout="split"
              surface="none"
              size="md"
              bounce={0.3}
              stretch={0.5}
              collapse="never"
              intro
            />
          </sidebar.SidebarContent>
        </sidebar.Sidebar>

        <main className="flex-1 min-w-0 overflow-y-auto p-6 text-black bg-gray-200">
          <header className="flex items-center gap-4 mb-4">
            <sidebar.SidebarTrigger />
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </header>

          <Outlet />
        </main>
      </sidebar.SidebarProvider>
    </div>
  );
}