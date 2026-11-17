import { Minus, Square, X } from "lucide-react";
import { Button } from "./ui/button";

const drag = { WebkitAppRegion: "drag" };
const noDrag = { WebkitAppRegion: "no-drag" };

// Calls window.electronAPI[action](); logs a warning if the preload API is missing
const callWindow = (action) => {
  const api = window.electronAPI;
  if (!api || typeof api[action] !== "function") {
    console.warn(
      `[TitleBar] window.electronAPI.${action} is not available. ` +
        "Check that the preload script is loaded and exposes it.",
    );
    return;
  }
  api[action]();
};

export default function TitleBar() {
  return (
    <div
      style={drag}
      className="h-9 bg-slate-950 text-slate-400 flex items-center justify-between px-3 select-none border-b border-slate-800 shrink-0 z-50 w-full"
    >
      {/* App Title / Logo */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
        <span>Employees Management</span>
      </div>

      {/* Window Controls (no-drag keeps them clickable) */}
      <div style={noDrag} className="flex items-center -mr-3">
        <Button
          type="button"
          style={noDrag}
          onClick={() => callWindow("minimize")}
          className="h-9 w-11 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
          variant="ghost"
          aria-label="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          style={noDrag}
          onClick={() => callWindow("maximize")}
          className="h-9 w-11 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-colors"
          variant="ghost"
          aria-label="Maximize"
        >
          <Square className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          style={noDrag}
          onClick={() => callWindow("close")}
          className="h-9 w-11 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
          variant="ghost"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
