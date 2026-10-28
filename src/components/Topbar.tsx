import {
  Bell,
  Search,
  Menu,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface TopbarProps {
  onMenuClick?: () => void;
}

const pageTitles: Record<string, string> = {
  "/products": "Products",
  "/checkout": "Checkout",
  "/invoices": "Invoices",
  "/inventory": "Inventory",
  "/reports": "Sales Report",
  "/users": "Users",
};

export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const title =
    pageTitles[location.pathname] || "RetailFlow";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {title}
          </h1>

          <p className="hidden text-xs text-slate-400 sm:block">
            Manage your retail operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          type="button"
          className="hidden rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 sm:block"
        >
          <Search size={18} />
        </button>

        {/* Notification */}
        <button
          type="button"
          className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50"
        >
          <Bell size={18} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-indigo-500" />
        </button>

        {/* User */}
        <div className="ml-2 hidden items-center gap-3 border-l border-slate-200 pl-3 sm:flex">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800">
              {user?.username}
            </p>

            <p className="text-xs text-slate-400">
              {user?.role}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}