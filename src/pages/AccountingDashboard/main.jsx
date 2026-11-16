import { StrictMode } from "react";
import * as react from 'react';
import accountant_dashboard_system_router from "./router";
import { RouterProvider } from "react-router";
export default function AccountantDashboardSystemRoot(){
  <StrictMode>
     <RouterProvider router={accountant_dashboard_system_router} />
  </StrictMode>
}