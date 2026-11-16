import { createHashRouter } from "react-router";
import AccountingDashboard from "./App";
const accountant_dashboard_system_router = createHashRouter([
    {path:'/',Component:AccountingDashboard}
])

export default accountant_dashboard_system_router