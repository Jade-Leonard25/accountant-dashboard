import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail,
  Key,
  ShieldCheck,
  ArrowRight,
  Lock,
  Loader2,
} from "lucide-react";
import { z } from "zod";
import axios from "axios";
import LogoLogin from "../assets/auth.jpeg";
import { Link } from "react-router";
import ClickSpark from "@/components/ClickSpark";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginKeySchema = z.object({
  key: z.string().min(5, "Invalid or too short key"),
});

function SubmitButton({ loading, idleLabel, loadingLabel }) {
  return (
    <motion.div
      whileHover={loading ? undefined : { scale: 1.01 }}
      whileTap={loading ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="mt-2"
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

function TabButton({ value, label, active }) {
  return (
    <ClickSpark
      sparkColor="#fff"
      shape="line"
      sparkCount={8}
      sparkSize={14}
      sparkRadius={30}
      duration={500}
    >
      <TabsTrigger
        value={value}
        className="relative w-full h-full rounded-lg text-xs font-medium cursor-pointer
          bg-transparent border-transparent shadow-none
          data-[state=active]:bg-transparent! data-[state=active]:shadow-none!
          dark:data-[state=active]:bg-transparent! dark:data-[state=active]:border-transparent!"
      >
        {active && (
          <motion.span
            layoutId="tab-pill"
            className="absolute inset-0 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span
          className={`relative z-10 transition-colors ${
            active ? "text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {label}
        </span>
      </TabsTrigger>
    </ClickSpark>
  );
}

export default function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [keyData, setKeyData] = useState({ key: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("credentials");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://system-payroll-api.developmentserver160.workers.dev/api/auth/sign-in/email",
        data,
      );
      console.log("Login successful:", response.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyLogin = async (e) => {
    e.preventDefault();
    setError("");

    const validationResult = loginKeySchema.safeParse(keyData);
    if (!validationResult.success) {
      setError(validationResult.error.issues[0].message);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:4002/api/login-key",
        keyData,
      );
      console.log("Key login successful:", response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid license key.");
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setData((item) => ({ ...item, [name]: value }));
  };

  const handleKeyInput = (e) => {
    const { name, value } = e.target;
    setKeyData((item) => ({ ...item, [name]: value }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#060911] overflow-hidden select-none text-slate-100">
      <div className="flex-1 min-h-0 flex w-full overflow-hidden">
        {/* Left Column: Brand / Illustration Splash */}
        <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 bg-linear-to-br from-indigo-950/60 via-slate-900 to-[#060911] border-r border-slate-800/60 overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600/5 blur-[100px] pointer-events-none" />
          <img
            src={LogoLogin}
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
              Streamlined workforce & payment control.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Manage employee directories, process payroll cycles, and track
              disbursements securely from your desktop terminal.
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-500 font-medium">
            Secure Enterprise Terminal • v1.0.0
          </div>
        </div>

        {/* Right Column: Clean Form Workspace */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-8 sm:px-12 py-4 bg-[#060911] overflow-y-auto">
          <div className="w-full max-w-md">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Welcome back
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Sign in with your credentials or access key.
              </p>
            </div>

            {/* Reserved slot so the error banner never pushes the layout */}
            <div className="h-10.5 my-3">
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

            {/* Fixed-size box: the same height for both tabs, so nothing above it can move */}
            <Tabs
              value={tab}
              onValueChange={setTab}
              className="w-full h-65 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/90 border border-slate-800 rounded-xl p-1 mb-5 h-11 shrink-0">
                <TabButton
                  value="credentials"
                  label="Credentials"
                  active={tab === "credentials"}
                />
                <TabButton
                  value="key"
                  label="Access Key"
                  active={tab === "key"}
                />
              </TabsList>

              <TabsContent value="credentials" className="mt-0">
                <motion.form
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4"
                >
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
                    idleLabel="Sign In"
                    loadingLabel="Signing in..."
                  />
                </motion.form>
              </TabsContent>

              <TabsContent value="key" className="mt-0">
                <motion.form
                  onSubmit={handleKeyLogin}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      License / Terminal Key
                    </label>
                    <div className="relative flex items-center">
                      <ShieldCheck className="absolute left-3.5 w-4 h-4 text-slate-500" />
                      <Input
                        type="text"
                        name="key"
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={keyData.key}
                        onChange={handleKeyInput}
                        className="h-11 pl-10 bg-slate-900/80 border-slate-800 rounded-xl text-sm font-mono tracking-wider text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <SubmitButton
                    loading={loading}
                    idleLabel="Authenticate Terminal"
                    loadingLabel="Verifying Key..."
                  />
                </motion.form>
              </TabsContent>
            </Tabs>

            <div className="mt-4 text-center">
              <Link
                to="/register"
                className="text-xs text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Don't have an account?{" "}
                <span className="text-indigo-400 font-medium">Sign up</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
