"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login gagal.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Terjadi kesalahan saat login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F6F2EC] px-6 text-[#211A16]">
      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8A6348]">
            GET-HERE COFFEE
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Admin Login
          </h1>

          <p className="mt-2 text-[#6F625A]">
            Masuk untuk mengelola pesanan.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl bg-white p-8 shadow-sm"
        >

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none transition focus:border-[#8A6348]"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full rounded-2xl border border-[#E8E0D8] px-4 py-3 outline-none transition focus:border-[#8A6348]"
            />
          </div>

          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#211A16] py-3 font-semibold text-white transition hover:bg-[#8A6348] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Login"}
          </button>

        </form>

        <p className="mt-6 text-center text-xs text-[#8A7A70]">
          GET-HERE Coffee Admin Panel
        </p>

      </div>
    </main>
  );
}