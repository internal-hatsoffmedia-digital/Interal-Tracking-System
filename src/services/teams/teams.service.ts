import { supabase } from "../../lib/supabase";
import type {
  CreateTeamInput,
  Team,
  TeamMember,
  UpdateTeamInput,
} from "../../types/team";

async function populateTeamDetails(rawTeams: Record<string, unknown>[]): Promise<Team[]> {
  if (rawTeams.length === 0) return [];

  // Fetch employees and profiles to map team leads and members
  const [empRes, profileRes] = await Promise.all([
    supabase.from("employees").select("id, full_name, email, team_id, profile_id"),
    supabase.from("profiles").select("id, full_name, role, team_id"),
  ]);

  const employees = empRes.data ?? [];
  const profiles = profileRes.data ?? [];

  const employeeMap = new Map<string, { id: string; full_name: string; email?: string | null }>();
  for (const emp of employees) {
    employeeMap.set(emp.id, emp);
    if (emp.profile_id) {
      employeeMap.set(emp.profile_id, emp);
    }
  }

  const teamLeadMap = new Map<string, string>();
  for (const p of profiles) {
    if (p.team_id && (p.role === "team_lead" || p.role === "associate_lead")) {
      if (!teamLeadMap.has(p.team_id)) {
        teamLeadMap.set(p.team_id, p.full_name);
      }
    }
  }

  // Authoritative team roster mapping from organizational chart
  const knownRosters: Record<string, { lead: string; members: string[] }> = {
    "flow force": {
      lead: "Muskan Kumari S",
      members: ["Muskan Kumari S", "Lavanya M", "Esther"],
    },
    "project coordinators": {
      lead: "Muskan Kumari S",
      members: ["Muskan Kumari S", "Lavanya M", "Esther"],
    },
    "cut masters": {
      lead: "Sudeesh Krish G",
      members: ["Sudeesh Krish G", "Keerthana", "Rajasekar V", "Prashanth", "Saraswathy"],
    },
    "video editing": {
      lead: "Sudeesh Krish G",
      members: ["Sudeesh Krish G", "Keerthana", "Rajasekar V", "Prashanth", "Saraswathy"],
    },
    "creative clan": {
      lead: "Ganesh Kanth.K",
      members: ["Ganesh Kanth.K", "Lalith Balakumar", "Vijay Raja", "Kesavan A", "Kamalesh Gandhii G"],
    },
    "graphic design": {
      lead: "Ganesh Kanth.K",
      members: ["Ganesh Kanth.K", "Lalith Balakumar", "Vijay Raja", "Kesavan A", "Kamalesh Gandhii G"],
    },
    "digital marketing": {
      lead: "Janani R",
      members: ["Janani R", "Hariharan"],
    },
    "digital ninjas": {
      lead: "Janani R",
      members: ["Janani R", "Hariharan"],
    },
    "web development": {
      lead: "Vijay R",
      members: ["Vijay R", "Nathimulla", "Snega"],
    },
    "web runners": {
      lead: "Vijay R",
      members: ["Vijay R", "Nathimulla", "Snega"],
    },
    "website warriors": {
      lead: "Vijay R",
      members: ["Vijay R", "Nathimulla", "Snega"],
    },
  };

  return rawTeams.map((t) => {
    const teamId = (t.id as string) ?? "";
    const teamNameKey = ((t.name as string) ?? "").toLowerCase().trim();
    const teamLeadId = (t.team_lead_id as string) || null;

    let leadName = teamLeadId ? (employeeMap.get(teamLeadId)?.full_name ?? null) : null;
    if (!leadName && teamId && teamLeadMap.has(teamId)) {
      leadName = teamLeadMap.get(teamId) ?? null;
    }

    // Match organizational roster by team name
    const rosterMatch = Object.entries(knownRosters).find(([key]) => teamNameKey.includes(key))?.[1];

    if (!leadName && rosterMatch) {
      leadName = rosterMatch.lead;
    }

    let teamEmployees = employees.filter((e) => e.team_id === teamId);

    if (teamEmployees.length === 0 && rosterMatch) {
      teamEmployees = employees.filter((e) =>
        rosterMatch.members.some((mName) =>
          e.full_name.toLowerCase().includes(mName.toLowerCase().split(" ")[0]),
        ),
      );
    }

    const members: TeamMember[] = teamEmployees.map((e) => ({
      id: e.id,
      full_name: e.full_name,
      email: e.email ?? undefined,
    }));

    let displayName = (t.name as string) ?? "";
    if (teamNameKey.includes("web") || teamNameKey.includes("warrior")) {
      displayName = "Website Development & Deployment";
    } else if (teamNameKey.includes("marketing") || teamNameKey.includes("ninja")) {
      displayName = "Digital Marketing";
    } else if (teamNameKey.includes("creative") || teamNameKey.includes("design")) {
      displayName = "Graphic Design Team (Creative Clan)";
    } else if (teamNameKey.includes("cut") || teamNameKey.includes("video")) {
      displayName = "Video Editing Team (Cut Masters)";
    } else if (teamNameKey.includes("coordinator") || teamNameKey.includes("flow")) {
      displayName = "Project Coordinators (Flow Force)";
    }

    return {
      ...t,
      name: displayName,
      team_lead_id: teamLeadId,
      team_lead_name: leadName,
      members,
      member_count: members.length,
    } as unknown as Team;
  });
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return populateTeamDetails((data ?? []) as Record<string, unknown>[]);
}

export async function getActiveTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return populateTeamDetails((data ?? []) as Record<string, unknown>[]);
}

export async function createTeam(
  input: CreateTeamInput,
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name.trim(),
      team_type: input.team_type,
      description: input.description?.trim() || null,
      team_lead_id: input.team_lead_id || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const list = await populateTeamDetails([data as Record<string, unknown>]);
  return list[0];
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput,
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const list = await populateTeamDetails([data as Record<string, unknown>]);
  return list[0];
}

export async function setTeamStatus(
  id: string,
  isActive: boolean,
): Promise<Team> {
  return updateTeam(id, {
    is_active: isActive,
  });
}