import { createHashRouter, Outlet, Navigate, useLocation } from "react-router";
import { useSession } from "@/lib/auth-client";
import AppSideBar from "@/components/AppSideBar";
import LoadingScreen from "@/components/SplashPage";
import Login from "@/pages/Login";
import Register from "./pages/Register";
import App from "./App";
import TitleBar from "@/components/TitleBar";
import { accountantRoutes } from "./pages/AccountingDashboard/router"; // 👈 Import sub-routes definition

const ProtectedLayout = () => {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const RootLayout = () => {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-200">
      <div className="relative z-[100] shrink-0">
        <TitleBar />
      </div>
      <div className="relative z-0 min-h-0 flex-1 transform-gpu overflow-hidden bg-gray-200">
        <Outlet />
      </div>
    </div>
  );
};

const router = createHashRouter([
  { path: "/splash", element: <LoadingScreen /> },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: "/",
            Component: AppSideBar,
            children: [
              { index: true, Component: App },
              { path: "settings", element: <div>Settings</div> },
            ],
          },
          accountantRoutes, // 👈 Spread the accountant routes object here so all sub-pages work
        ],
      },
    ],
  },
]);

export default router;
