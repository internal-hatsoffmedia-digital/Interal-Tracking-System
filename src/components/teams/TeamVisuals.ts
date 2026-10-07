import {
  Code2,
  Film,
  Layers,
  Megaphone,
  Palette,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Team } from "../../types/team";

export interface TeamVisualInfo {
  department: string;
  shortLabel: string;
  icon: LucideIcon;
  gradient: string;
  darkBannerGradient: string;
  accentColor: string;
  badgeClass: string;
  avatarBg: string;
  glowClass: string;
  glowBorder: string;
}

export function formatTeamType(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getTeamVisuals(team: Team): TeamVisualInfo {
  const name = (team.name || "").toLowerCase();
  const type = (team.team_type || "").toLowerCase();

  // 1. Creative Clan / Graphic Design
  if (
    type.includes("creative") ||
    type.includes("design") ||
    name.includes("creative") ||
    name.includes("design")
  ) {
    return {
      department: "Graphic Design",
      shortLabel: "Creative Clan",
      icon: Palette,
      gradient: "from-indigo-600 to-purple-600",
      darkBannerGradient: "from-slate-950 via-indigo-950 to-slate-900",
      accentColor: "#6366f1",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
      avatarBg: "bg-indigo-100 text-indigo-700",
      glowClass: "shadow-indigo-500/10 group-hover:shadow-indigo-500/20",
      glowBorder: "border-indigo-500/20",
    };
  }

  // 2. Cut Masters / Video Editing
  if (
    type.includes("cut") ||
    type.includes("video") ||
    type.includes("editing") ||
    name.includes("cut") ||
    name.includes("video")
  ) {
    return {
      department: "Video Editing",
      shortLabel: "Cut Masters",
      icon: Film,
      gradient: "from-rose-600 to-orange-500",
      darkBannerGradient: "from-slate-950 via-rose-950 to-slate-900",
      accentColor: "#f43f5e",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      avatarBg: "bg-rose-100 text-rose-700",
      glowClass: "shadow-rose-500/10 group-hover:shadow-rose-500/20",
      glowBorder: "border-rose-500/20",
    };
  }

  // 3. Flow Force / Project Coordination
  if (
    type.includes("flow") ||
    type.includes("coordinator") ||
    type.includes("coordination") ||
    name.includes("flow") ||
    name.includes("coordinator")
  ) {
    return {
      department: "Project Coordination",
      shortLabel: "Flow Force",
      icon: Layers,
      gradient: "from-blue-600 to-cyan-500",
      darkBannerGradient: "from-slate-950 via-sky-950 to-slate-900",
      accentColor: "#0284c7",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      avatarBg: "bg-sky-100 text-sky-700",
      glowClass: "shadow-sky-500/10 group-hover:shadow-sky-500/20",
      glowBorder: "border-sky-500/20",
    };
  }

  // 4. Web Crafters / Web Development
  if (type.includes("web") || name.includes("web") || name.includes("crafter")) {
    return {
      department: "Web Development",
      shortLabel: "Web Crafters",
      icon: Code2,
      gradient: "from-emerald-600 to-teal-500",
      darkBannerGradient: "from-slate-950 via-emerald-950 to-slate-900",
      accentColor: "#059669",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      avatarBg: "bg-emerald-100 text-emerald-700",
      glowClass: "shadow-emerald-500/10 group-hover:shadow-emerald-500/20",
      glowBorder: "border-emerald-500/20",
    };
  }

  // 5. Digital Ninjas / Digital Marketing
  if (
    type.includes("digital") ||
    type.includes("marketing") ||
    type.includes("social") ||
    name.includes("digital") ||
    name.includes("marketing") ||
    name.includes("ninja")
  ) {
    return {
      department: "Digital Marketing",
      shortLabel: "Digital Ninjas",
      icon: Megaphone,
      gradient: "from-amber-500 to-orange-500",
      darkBannerGradient: "from-slate-950 via-amber-950 to-slate-900",
      accentColor: "#d97706",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      avatarBg: "bg-amber-100 text-amber-800",
      glowClass: "shadow-amber-500/10 group-hover:shadow-amber-500/20",
      glowBorder: "border-amber-500/20",
    };
  }

  // 6. Market Hunters / Sales & Business Dev
  if (
    name.includes("market") ||
    name.includes("hunter") ||
    name.includes("sales") ||
    type.includes("sales")
  ) {
    return {
      department: "Growth & Sales",
      shortLabel: "Market Hunters",
      icon: Target,
      gradient: "from-violet-600 to-pink-500",
      darkBannerGradient: "from-slate-950 via-purple-950 to-slate-900",
      accentColor: "#7c3aed",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
      avatarBg: "bg-violet-100 text-violet-700",
      glowClass: "shadow-violet-500/10 group-hover:shadow-violet-500/20",
      glowBorder: "border-violet-500/20",
    };
  }

  // 7. Default / Special Squad
  return {
    department: "Special Operations",
    shortLabel: formatTeamType(team.team_type || "Squad"),
    icon: Users,
    gradient: "from-slate-700 to-slate-900",
    darkBannerGradient: "from-slate-950 via-slate-900 to-slate-950",
    accentColor: "#334155",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    avatarBg: "bg-slate-100 text-slate-700",
    glowClass: "shadow-slate-500/5 group-hover:shadow-slate-500/15",
    glowBorder: "border-slate-500/20",
  };
}
