import { Navigate } from "react-router";
import AccountingDashboard from "./main";
import {
  BASE,
  accountant_dashboard_sidebar_selection as menu,
} from "./sidebar/components";

const modules = import.meta.glob("./pages/*.jsx", { eager: true });
const pageFor = (id) => modules[`./pages/${id}.jsx`]?.default;

function Placeholder({ title, code }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-500">{code}</p>
    </div>
  );
}

const flatten = (items) =>
  items.flatMap((i) => [i, ...flatten(i.children ?? [])]);

export const accountantRoutes = {
  path: BASE.replace(/^\//, ""),
  Component: AccountingDashboard,
  children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    ...flatten(menu).map((item) => {
      const Page = pageFor(item.id);
      return {
        path: item.link.replace(/^\//, ""),
        element: Page ? (
          <Page />
        ) : (
          <Placeholder title={item.name} code={item.audit_code} />
        ),
      };
    }),
  ],
};
