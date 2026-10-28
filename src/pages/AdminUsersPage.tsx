import { useState } from "react";
import {
  UserPlus,
  Shield,
  User,
} from "lucide-react";

import type { Role } from "../types";

import { register } from "../api";

import {
  useToast,
} from "../contexts/ToastContext";

export default function AdminUsersPage() {
  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState<Role>("CASHIER");

  const [submitting, setSubmitting] =
    useState(false);

  const { showToast } =
    useToast();

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setSubmitting(true);

    try {
      await register({
        username,
        password,
        role,
      });

      showToast(
        `${
          role === "ADMIN"
            ? "Admin"
            : "Cashier"
        } account created`,
        "success"
      );

      setUsername("");
      setPassword("");
      setRole("CASHIER");
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to create account",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
          <UserPlus size={16} />
          Administration
        </div>

        <h1 className="rf-page-title">
          Create account
        </h1>

        <p className="rf-page-subtitle">
          Add a new administrator or cashier
          account.
        </p>
      </div>

      <div className="rf-card p-6 sm:p-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Username
            </label>

            <input
              required
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value
                )
              }
              placeholder="Enter username"
              className="rf-input"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>

            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Minimum 6 characters"
              className="rf-input"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              Account role
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  setRole(
                    "CASHIER"
                  )
                }
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  role === "CASHIER"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <User size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Cashier
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Handle checkout and
                    invoices.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setRole(
                    "ADMIN"
                  )
                }
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  role === "ADMIN"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Admin
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Full system management
                    access.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={submitting}
              className="rf-button-primary w-full py-3"
            >
              <UserPlus size={17} />

              {submitting
                ? "Creating..."
                : "Create account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}