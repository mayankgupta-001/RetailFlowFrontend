import { useState } from "react";
import type { Role } from "../types";
import { register } from "../api";
import { useToast } from "../contexts/ToastContext";

export default function AdminUsersPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CASHIER");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register({ username, password, role });
      showToast(`${role === "ADMIN" ? "Admin" : "Cashier"} account created`, "success");
      setUsername("");
      setPassword("");
      setRole("CASHIER");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create account", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Create account</h2>
      <form
        onSubmit={handleSubmit}
        className="border rounded-lg bg-white p-4 space-y-3"
      >
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Username
          </label>
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Password
          </label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="CASHIER">Cashier</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white rounded px-3 py-2 text-sm hover:bg-blue-700 disabled:bg-gray-300"
        >
          {submitting ? "Creating..." : "Create account"}
        </button>
      </form>
    </div>
  );
}