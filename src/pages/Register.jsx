import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Key, ArrowRight, Lock, Loader2 } from "lucide-react";
import { z } from "zod";
import axios from "axios";
import RegisterLogo from "../assets/register.jpeg";

// Use your deployed Cloudflare Worker URL or local Wrangler/Hono port (e.g., 8787 or 4002)
const API_BASE_URL = "https://system-payroll-api.developmentserver160.workers.dev";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

function SubmitButton({ loading, idleLabel, loadingLabel }) {
  return (
    <motion.div
      whileHover={loading ? undefined : { scale: 1.01 }}
      whileTap={loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="mt-1"
    >
      <Button
        type="submit"
        disabled={loading}
        size="md"
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/25 transition-colors flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-90"
      >
        <AnimatePresence mode="wait" initial={false}>
          {loading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              {loadingLabel}
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {idleLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setData((item) => ({ ...item, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationResult = registerSchema.safeParse(data);
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/sign-up/email`,
        data,
        { withCredentials: true }
      );
      console.log("Register successful:", response.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex bg-[#060911] overflow-hidden select-none text-slate-100">
      {/* Left Column: Brand / Illustration Splash */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-linear-to-br from-indigo-950/60 via-slate-900 to-[#060911] border-r border-slate-800/60 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] pointer-events-none" />
        <img
          src={RegisterLogo}
          alt="Visual"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#060911] via-[#060911]/60 to-transparent" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg">
            <Lock className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
            Employees Management
          </span>
        </div>

        <div className="relative z-10 space-y-3 max-w-lg">
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Set up your workspace in minutes.
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Create your account to manage employee directories, run payroll
            cycles, and track disbursements securely from your desktop terminal.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-medium">
          Secure Enterprise Terminal • v1.0.0
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-12 py-4 bg-[#060911] overflow-y-auto">
        <div className="w-full max-w-md">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create account
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Enter your details to get started.
            </p>
          </div>

          {/* Reserved slot so the error banner never pushes the layout */}
          <div className="h-[40px] my-3">
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-4 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  name="name"
                  placeholder="John Smith"
                  value={data.name}
                  onChange={handleInput}
                  className="h-11 pl-10 bg-slate-900/80 border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Work Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={data.email}
                  onChange={handleInput}
                  className="h-11 pl-10 bg-slate-900/80 border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative flex items-center">
                <Key className="absolute left-3.5 w-4 h-4 text-slate-500" />
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••••••"
                  value={data.password}
                  onChange={handleInput}
                  className="h-11 pl-10 bg-slate-900/80 border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <SubmitButton
              loading={loading}
              idleLabel="Create Account"
              loadingLabel="Creating account..."
            />
          </motion.form>

          <p className="text-center text-xs text-slate-500 mt-4">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
