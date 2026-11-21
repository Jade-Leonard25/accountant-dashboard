import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import {
  getStayLoggedIn,
  setStayLoggedIn as persistStayLoggedIn,
  signOut,
  useSession,
} from "../auth-client";
import {
  Avatar,
  AvatarFallback,
} from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "../components/ui/drawer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "../components/ui/sidebar";
import { Switch } from "../components/ui/switch";
import { apiRequest } from "../api-client";

const SELECTED_COMPANY_KEY = "payroll_selected_company_id";

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: session } = useSession();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyTaxId, setCompanyTaxId] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const user = session?.user;
  const userName = user?.name || "Account";
  const userEmail = user?.email || "Email unavailable";
  const userRole = user?.role || "Role unavailable";

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    setCompanyError("");
    setIsCreatingCompany(true);

    try {
      const result = await apiRequest("/api/companies", {
        method: "POST",
        body: { name: companyName.trim(), taxId: companyTaxId.trim() },
      });
      if (!result?.data?.id) {
        throw new Error("The server did not return the new company ID.");
      }

      window.localStorage.setItem(SELECTED_COMPANY_KEY, result.data.id);
      setCompanyName("");
      setCompanyTaxId("");
      navigate("/createEmployees");
    } catch (createError) {
      setCompanyError(
        createError instanceof Error
          ? createError.message
          : "Could not create the company.",
      );
    } finally {
      setIsCreatingCompany(false);
    }
  };

  useEffect(() => {
    let active = true;
    getStayLoggedIn()
      .then((enabled) => {
        if (active) setStayLoggedIn(enabled);
      })
      .catch((settingsError) => {
        if (active) {
          setError(
            settingsError instanceof Error
              ? settingsError.message
              : "Could not load app settings.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleStayLoggedInChange = async (enabled) => {
    setIsSavingSettings(true);
    setError("");
    try {
      await persistStayLoggedIn(enabled);
      setStayLoggedIn(enabled);
    } catch (settingsError) {
      setError(
        settingsError instanceof Error
          ? settingsError.message
          : "Could not save this setting.",
      );
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSignOut = async () => {
    setError("");
    setIsSigningOut(true);

    try {
      const result = await signOut();
      if (result.error) {
        setError(result.error.message || "Could not log out. Please try again.");
        return;
      }

      navigate("/login", { replace: true });
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Could not log out. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
    <SidebarProvider className="h-full min-h-0 bg-background">
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border border-sidebar-border">
              <LayoutDashboard className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-semibold">Payroll</p>
              <p className="truncate text-xs text-muted-foreground">
                Admin workspace
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/dashboard" />}
                    isActive={location.pathname === "/dashboard"}
                    tooltip="Dashboard"
                  >
                    <LayoutDashboard aria-hidden="true" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/createEmployees" />}
                    isActive={location.pathname === "/createEmployees"}
                    tooltip="Employees"
                  >
                    <Users aria-hidden="true" />
                    <span>Employees</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar>
              <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-medium">{userName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {userRole}
              </p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-full min-h-0 bg-muted/30">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <div>
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Workspace overview
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Open account menu"
            >
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-40 truncate text-sm font-medium">
                  {userName}
                </p>
                <p className="max-w-40 truncate text-xs text-muted-foreground">
                  {userEmail}
                </p>
              </div>
              <Avatar>
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3 py-1">
                    <Avatar>
                      <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{userName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <UserRound aria-hidden="true" />
                <span>Role: {userRole}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings aria-hidden="true" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                <LogOut aria-hidden="true" />
                <span>{isSigningOut ? "Logging out…" : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-h-0 flex-1 space-y-6 overflow-auto p-4 md:p-6">
          {error && (
            <p
              role="alert"
              className="rounded-lg border bg-background px-4 py-3 text-sm"
            >
              {error}
            </p>
          )}

          <section className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {userName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Your admin workspace is ready.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border bg-background p-5">
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="mt-2 truncate font-medium">{userEmail}</p>
            </article>
            <article className="rounded-xl border bg-background p-5">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="mt-2 font-medium">{userRole}</p>
            </article>
            <article className="rounded-xl border bg-background p-5">
              <p className="text-sm text-muted-foreground">Workspace</p>
              <p className="mt-2 font-medium">Admin dashboard</p>
            </article>
          </section>

          <section className="rounded-xl border bg-background p-5">
            <div className="mb-4">
              <h2 className="font-medium">Create a company</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a company first so employee records can be saved to its
                payroll roster.
              </p>
            </div>
            <form
              onSubmit={handleCreateCompany}
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <label className="grid gap-2 text-sm font-medium">
                Company name
                <input
                  required
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="h-10 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Company name"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Tax ID
                <input
                  required
                  value={companyTaxId}
                  onChange={(event) => setCompanyTaxId(event.target.value)}
                  className="h-10 rounded-md border bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Company tax ID"
                />
              </label>
              <Button type="submit" disabled={isCreatingCompany}>
                {isCreatingCompany ? "Creating…" : "Create company"}
              </Button>
            </form>
            {companyError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {companyError}
              </p>
            )}
          </section>

          <section className="rounded-xl border bg-background p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-medium">Employee roster</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and edit employee records in a spreadsheet.
                </p>
              </div>
              <Button render={<Link to="/createEmployees" />} nativeButton={false}>
                <Users aria-hidden="true" />
                Create employees
              </Button>
            </div>
          </section>

          <Button
            type="button"
            variant="outline"
            className="sm:hidden"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <LogOut aria-hidden="true" />
            {isSigningOut ? "Logging out…" : "Log out"}
          </Button>
        </main>
      </SidebarInset>
    </SidebarProvider>
    <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="mx-auto w-full max-w-2xl">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>
            Choose how this app handles your account and future features.
          </DrawerDescription>
        </DrawerHeader>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 overflow-y-auto p-4 pb-8">
          <section className="space-y-4">
            <h2 className="text-sm font-medium">Sign-in</h2>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Stay logged in</p>
                <p className="text-sm text-muted-foreground">
                  Keep your account signed in when you close and reopen this app.
                </p>
              </div>
              <Switch
                checked={stayLoggedIn}
                onCheckedChange={handleStayLoggedInChange}
                disabled={isSavingSettings}
                aria-label="Stay logged in"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Log out when app closes</p>
                <p className="text-sm text-muted-foreground">
                  Sign out automatically instead of keeping your session.
                </p>
              </div>
              <Switch
                checked={!stayLoggedIn}
                onCheckedChange={(enabled) =>
                  handleStayLoggedInChange(!enabled)
                }
                disabled={isSavingSettings}
                aria-label="Log out when app closes"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium">Coming later</h2>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4 opacity-60">
              <div>
                <p className="text-sm font-medium">
                  Always ask for password in other applications
                </p>
                <p className="text-sm text-muted-foreground">
                  This setting is not available yet.
                </p>
              </div>
              <Switch
                checked={false}
                disabled
                aria-label="Always ask for password in other applications"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4 opacity-60">
              <div>
                <p className="text-sm font-medium">Automatic sync</p>
                <p className="text-sm text-muted-foreground">
                  This setting is not available yet.
                </p>
              </div>
              <Switch
                checked={false}
                disabled
                aria-label="Automatic sync"
              />
            </div>
          </section>
          {isSavingSettings && (
            <p role="status" className="text-sm text-muted-foreground">
              Saving settings…
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}
