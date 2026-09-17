import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const pages = [
  ["Dashboard", "/dashboard", "Overview and delivery priorities"],
  ["My Work", "/my-work", "Your assigned tasks"],
  ["Tasks", "/tasks", "Manage production work"],
  ["Task Assignments", "/task-assignments", "Assign work to employees"],
  ["Planner", "/planner", "Plan upcoming delivery"],
  ["Timesheet", "/timesheet", "Track working hours"],
  ["Projects", "/projects", "Manage projects and deadlines"],
  ["Sales Tracker", "/sales", "Sales & Marketing: leads, follow-ups, conversions, and performance"],
  ["Clients", "/clients", "Manage client relationships"],
  ["Teams", "/teams", "Organize your teams"],
  ["Employees", "/employees", "Manage employee information"],
  ["Performance", "/performance", "Review team performance"],
  ["Reports", "/reports", "Explore business reports"],
  ["Settings", "/settings", "Your profile and preferences"],
];

export default function WorkspaceSearch() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = pages.filter(([name, , description]) =>
    `${name} ${description}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goTo(path: string) {
    setOpen(false);
    setQuery("");
    input.current?.blur();
    navigate(path);
  }

  return (
    <div className="future-search relative min-w-0 flex-1 lg:max-w-xl" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={input}
        type="search"
        aria-label="Find a workspace page"
        aria-expanded={open}
        aria-controls="workspace-search-results"
        placeholder="Find anything in your workspace…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && open && results.length) {
            event.preventDefault();
            goTo(results[0][1]);
          }
        }}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 sm:h-12 sm:pr-20"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 px-1.5 py-1 text-[10px] text-slate-500 sm:block">Ctrl K</kbd>
      {open && (
        <div id="workspace-search-results" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <p className="px-3 py-2 text-xs font-semibold text-slate-500">Workspace pages</p>
          {results.length ? results.map(([name, path, description]) => (
            <button key={path} type="button" onClick={() => goTo(path)} className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-slate-900">
              <span className="block text-sm font-semibold text-slate-900">{name}</span>
              <span className="block text-xs text-slate-500">{description}</span>
            </button>
          )) : <p role="status" className="px-3 py-4 text-sm text-slate-500">No matching pages. Try projects, clients, or reports.</p>}
        </div>
      )}
    </div>
  );
}
