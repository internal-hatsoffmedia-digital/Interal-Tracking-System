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
        supabase.from("tasks").select("id, status, created_at, due_date").is("archived_at", null),
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
    ? "Administrator"
    : userRole === "associate_lead"
    ? "Associate Lead"
    : userRole === "team_lead"
    ? "Team Lead"
    : userRole === "manager"
    ? "Manager"
    : userRole === "director"
    ? "Director"
    : "Employee";

  return <div className="future-briefing">
    <div className="future-briefing-intro"><div className="future-eyebrow"><span/>YOUR DAY AT A GLANCE</div><h1>Welcome, {displayName}<span className="future-heading-dot">.</span></h1><p>{roleTitle} · {currentTime || 'Today'}</p>
    <div className="future-briefing-context"><span>{loading?'…':stats.activeProjects} active projects</span><span>{loading?'…':stats.onHold} on hold</span></div>
    <div className="future-hero-actions"><button className="future-primary" onClick={()=>navigate('/tasks?status=internal_review')}>Review submitted work ({stats.internalReview})<ArrowUpRight size={16}/></button><button className="future-secondary" onClick={handleCopyDigest}><Copy size={15}/>{copied?'Summary copied':'Copy work summary'}</button></div>
    <button className="future-text-link" onClick={()=>navigate('/reports')}>View reports <ArrowUpRight size={14}/></button>
    </div><div className="studio-progress-card"><span className="future-eyebrow">TASK OVERVIEW</span><h2>Your team’s progress</h2><div className="studio-progress-ring"><svg viewBox="0 0 160 160" role="img" aria-label={loading ? 'Loading task completion' : `${stats.deliveredThisWeek} of ${stats.totalTasks} tasks delivered`}><circle cx="80" cy="80" r="65" fill="none" stroke="var(--line)" strokeWidth="13"/><circle cx="80" cy="80" r="65" fill="none" stroke="var(--studio-green)" opacity={stats.deliveredThisWeek > 0 ? 1 : 0} strokeWidth="13" strokeLinecap="round" pathLength="100" strokeDasharray={`${stats.totalTasks ? stats.deliveredThisWeek / stats.totalTasks * 100 : 0} 100`} transform="rotate(-90 80 80)"/></svg><div><strong>{loading?'…':stats.totalTasks}</strong><span>Total tasks</span></div></div><div className="studio-progress-legend"><span><i/>Delivered</span><strong>{loading?'…':stats.deliveredThisWeek}</strong><span><i/>Remaining</span><strong>{loading?'…':Math.max(0,stats.totalTasks-stats.deliveredThisWeek)}</strong></div><p>{loading?'Loading your workspace…':stats.totalTasks?'A live view of your studio workload.':'Your first task will appear here.'}</p></div><div className="future-briefing-metrics">{[
      {label:'Work in progress',value:stats.inProgress,note:'Tasks being worked on',color:'amber'},
      {label:'Team review',value:stats.internalReview,note:'Waiting for coordinator review',color:'amber'},
      {label:'Client review',value:stats.clientReview,note:'Waiting for client approval',color:'peach'},
      {label:'Delivered',value:stats.deliveredThisWeek,note:'Completed and approved',color:'lime'},
    ].map((m,i)=><div className={'future-metric '+m.color} key={m.label}><div><span>{m.label}</span><span className="future-metric-index">0{i+1}</span></div><strong>{loading?'…':m.value}</strong><p>{m.note}</p></div>)}</div>
    <div className="future-briefing-footer"><span><Activity size={14}/>Workspace overview</span><div className="future-segmented"><button aria-pressed={viewMode==='executive'} onClick={()=>onToggleViewMode('executive')}><Gauge size={15}/>Overview</button><button aria-pressed={viewMode==='operations'} onClick={()=>onToggleViewMode('operations')}><Zap size={15}/>Work details</button></div></div>
  </div>;
}
