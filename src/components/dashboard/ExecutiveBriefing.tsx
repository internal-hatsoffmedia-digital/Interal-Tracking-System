import {
  Activity,
  ArrowUpRight,
  Copy,
  Gauge,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

interface ExecutiveBriefingProps {
  viewMode: "executive" | "operations";
  onToggleViewMode: (mode: "executive" | "operations") => void;
}

export default function ExecutiveBriefing({
  viewMode,
  onToggleViewMode,
}: ExecutiveBriefingProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    inProgress: 0,
    internalReview: 0,
    clientReview: 0,
    deliveredThisWeek: 0,
    onHold: 0,
    activeProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(now)
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        supabase.from("tasks").select("id, status, created_at, due_date"),
        supabase.from("projects").select("id, status"),
      ]);

      const tasks = tasksRes.data ?? [];
      const projects = projectsRes.data ?? [];

      let inProgress = 0;
      let internalReview = 0;
      let clientReview = 0;
      let delivered = 0;
      let onHold = 0;

      tasks.forEach((t) => {
        const s = (t.status || "").toLowerCase();
        if (s.includes("progress") || s.includes("editing")) inProgress++;
        if (s.includes("internal_review") || s.includes("sent_for_internal_review")) internalReview++;
        if (s.includes("client_review") || s.includes("sent_for_client_review")) clientReview++;
        if (s.includes("delivered") || s.includes("completed")) delivered++;
        if (s.includes("hold") || s.includes("blocked")) onHold++;
      });

      setStats({
        totalTasks: tasks.length,
        inProgress,
        internalReview,
        clientReview,
        deliveredThisWeek: delivered,
        onHold,
        activeProjects: projects.filter((p) => p.status !== "completed").length,
      });
    } catch (err) {
      console.error("Failed to load executive briefing stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuickStats();

    // Realtime subscription on tasks and task_assignments so completed work reflects live
    const channel = supabase
      .channel("executive-briefing-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          loadQuickStats();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignments" },
        () => {
          loadQuickStats();
        }
      )
      .subscribe();

    const pollInterval = setInterval(loadQuickStats, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const handleCopyDigest = () => {
    const roleText =
      profile?.role === "project_coordinator"
        ? "Project Coordinator"
        : "Executive Studio";

    const text = `📊 *Hatsoff Media — ${roleText} Briefing*
📅 ${currentTime || "Today"}
────────────────────────────
⚡ *Active Projects in Flight*: ${stats.activeProjects}
🎬 *In Creative Production*: ${stats.inProgress}
🔍 *Ready for Coordinator Review*: ${stats.internalReview}
👀 *Awaiting Client Approval*: ${stats.clientReview}
✅ *Approved & Delivered*: ${stats.deliveredThisWeek}
⏸️ *On Hold / Blockers*: ${stats.onHold}
────────────────────────────
*Studio Velocity*: ${stats.onHold === 0 ? "🟢 Optimal (Zero Blockers)" : "🟡 Attention Needed"}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const displayName = profile?.full_name?.split(" ")[0] || "Leader";
  const userRole = profile?.role;
  const isCoordinator = userRole === "project_coordinator";
  const isAdmin = userRole === "admin";

  const roleTitle = isCoordinator
    ? "Project Coordinator"
    : isAdmin
    ? "Studio Administrator / CEO"
    : "Team Lead";

  return <div className="future-briefing">
    <div className="future-briefing-intro"><div className="future-eyebrow"><span/>YOUR STUDIO, IN FOCUS</div><h1>Welcome, {displayName}<span className="future-heading-dot">.</span></h1><p>{roleTitle} · {currentTime || 'Today'}</p>
    <div className="future-briefing-context"><span>{loading?'…':stats.activeProjects} active projects</span><span>{loading?'…':stats.onHold} on hold</span></div>
    <div className="future-hero-actions"><button className="future-primary" onClick={()=>navigate('/tasks?status=internal_review')}>Review Completed Tasks ({stats.internalReview})<ArrowUpRight size={16}/></button><button className="future-secondary" onClick={handleCopyDigest}><Copy size={15}/>{copied?'Copied Studio Digest!':'Copy Status Digest'}</button></div>
    <button className="future-text-link" onClick={()=>navigate('/reports')}>Performance Analytics <ArrowUpRight size={14}/></button>
    </div><div className="future-briefing-metrics">{[
      {label:'Active Production',value:stats.inProgress,note:'Editing in progress',color:'violet'},
      {label:'Internal Review',value:stats.internalReview,note:'Awaiting coordinator QA',color:'pink'},
      {label:'Client Review Gate',value:stats.clientReview,note:'Awaiting client approval',color:'peach'},
      {label:'Delivered',value:stats.deliveredThisWeek,note:'Approved & delivered',color:'lime'},
    ].map((m,i)=><div className={'future-metric '+m.color} key={m.label}><div><span>{m.label}</span><span className="future-metric-index">0{i+1}</span></div><strong>{loading?'…':m.value}</strong><p>{m.note}</p></div>)}</div>
    <div className="future-briefing-footer"><span><Activity size={14}/>Workspace overview</span><div className="future-segmented"><button aria-pressed={viewMode==='executive'} onClick={()=>onToggleViewMode('executive')}><Gauge size={15}/>Executive Cockpit</button><button aria-pressed={viewMode==='operations'} onClick={()=>onToggleViewMode('operations')}><Zap size={15}/>Operations Flow</button></div></div>
  </div>;
}
