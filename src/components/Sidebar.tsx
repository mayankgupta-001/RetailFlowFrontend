import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  cartCount?: number;
}

const navigation = [
  {
    name: "Products",
    path: "/products",
    icon: Package,
  },
  {
    name: "Checkout",
    path: "/checkout",
    icon: ShoppingCart,
  },
  {
    name: "Invoices",
    path: "/invoices",
    icon: Receipt,
  },
];

const adminNavigation = [
  {
    name: "Inventory",
    path: "/inventory",
    icon: Boxes,
  },
  {
    name: "Sales Report",
    path: "/reports",
    icon: BarChart3,
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
  },
];

export default function Sidebar({ cartCount = 0 }: SidebarProps) {
  const { isAdmin, user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-950 text-white lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold shadow-lg shadow-indigo-950/40">
            R
          </div>

          <div>
            <h1 className="font-bold tracking-tight">
              RetailFlow
            </h1>

            <p className="text-xs text-slate-500">
              Retail management
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Workspace
        </p>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />

              <span>{item.name}</span>

              {item.path === "/checkout" && cartCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-indigo-700">
                  {cartCount}
                </span>
              )}
            </NavLink>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-6 border-t border-white/10" />

            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Administration
            </p>

            {adminNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </>
        )}

        <div className="my-6 border-t border-white/10" />

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </button>
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-semibold">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {user?.username || "User"}
            </p>

            <p className="text-xs text-slate-500">
              {user?.role || "User"}
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
            title="Logout"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}