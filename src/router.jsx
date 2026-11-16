import { createHashRouter, Outlet } from "react-router";
import AppSideBar from "@/components/AppSideBar";
import LoadingScreen from "@/components/SplashPage";
import Login from "@/pages/Login";
import Register from "./pages/Register";
import App from "./App";
import TitleBar from "@/components/TitleBar";
import AccountingDashboard from "./pages/AccountingDashboard/main";

function RootLayout() {
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
}

const router = createHashRouter([
  { path: "/splash", element: <LoadingScreen /> },
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        Component: AppSideBar,
        children: [
          { index: true, Component: App},
          { path: "settings", element: <div>Settings</div> },
        ],
      },
      { path: "/login", Component: Login},
      { path: "/register", Component: Register},
      {path:'/accountant_dashboard',Component:AccountingDashboard}
    ],
  },
]);

export default router;