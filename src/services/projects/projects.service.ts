import { supabase } from "../../lib/supabase";

import type {
  CreateProjectInput,
  Project,
  ProjectWithRelations,
  UpdateProjectInput,
} from "../../types/project";

/* =========================================================
   LOAD RELATION DATA
========================================================= */

async function getProjectRelations() {
  const [clientsResult, employeesResult, profilesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, short_name")
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("employees")
      .select("id, full_name, employee_code, profile_id")
      .order("full_name", {
        ascending: true,
      }),

    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .order("full_name", {
        ascending: true,
      }),
  ]);

  if (clientsResult.error) {
    throw new Error(
      `Unable to load clients: ${clientsResult.error.message}`,
    );
  }

  if (employeesResult.error) {
    throw new Error(
      `Unable to load employees: ${employeesResult.error.message}`,
    );
  }

  return {
    clients: clientsResult.data ?? [],
    employees: employeesResult.data ?? [],
    profiles: profilesResult.data ?? [],
  };
}

/* =========================================================
   BUILD PROJECT RELATIONS
========================================================= */

function attachRelations(
  projects: Project[],
  clients: {
    id: string;
    name: string;
    short_name: string | null;
  }[],
  employees: {
    id: string;
    full_name: string;
    employee_code: string;
    profile_id?: string | null;
  }[],
  profiles: {
    id: string;
    full_name: string;
    email?: string;
  }[] = [],
): ProjectWithRelations[] {
  const userMap = new Map<string, { id: string; full_name: string; email?: string }>();
  for (const prof of profiles) {
    if (prof.id && prof.full_name) {
      userMap.set(prof.id, prof);
    }
  }
  for (const emp of employees) {
    if (emp.id && emp.full_name && !userMap.has(emp.id)) {
      userMap.set(emp.id, { id: emp.id, full_name: emp.full_name });
    }
    if (emp.profile_id && emp.full_name && !userMap.has(emp.profile_id)) {
      userMap.set(emp.profile_id, { id: emp.profile_id, full_name: emp.full_name });
    }
  }

  return projects.map((project) => {
    const creatorObj = project.created_by ? userMap.get(project.created_by) ?? null : null;
    const creatorName = creatorObj ? creatorObj.full_name : (project.created_by ? "Admin" : null);

    return {
      ...project,

      creator_name: creatorName,
      creator: creatorObj ? { id: creatorObj.id, full_name: creatorObj.full_name, email: creatorObj.email } : null,

      client:
        clients.find(
          (client) => client.id === project.client_id,
        ) ?? null,

      lead_employee:
        employees.find(
          (employee) =>
            employee.id === project.lead_employee_id,
        ) ?? null,
    };
  });
}

/* =========================================================
   GET ALL PROJECTS
========================================================= */

export async function getProjects(): Promise<
  ProjectWithRelations[]
> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Unable to load projects: ${error.message}`,
    );
  }

  const projects = (data ?? []) as Project[];

  if (projects.length === 0) {
    return [];
  }

  const { clients, employees, profiles } =
    await getProjectRelations();

  return attachRelations(
    projects,
    clients,
    employees,
    profiles,
  );
}

/* =========================================================
   GET ACTIVE PROJECTS
========================================================= */

export async function getActiveProjects(): Promise<
  ProjectWithRelations[]
> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_active_projects_for_tasks",
  );

  let rawProjects: Project[] = [];
  if (!rpcError && rpcData) {
    rawProjects = rpcData as Project[];
  } else {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_active", true)
      .order("name", {
        ascending: true,
      });

    if (error) {
      throw new Error(
        `Unable to load active projects: ${error.message}`,
      );
    }

    rawProjects = (data ?? []) as Project[];
  }

  if (rawProjects.length === 0) {
    return [];
  }

  const { clients, employees, profiles } =
    await getProjectRelations();

  return attachRelations(
    rawProjects,
    clients,
    employees,
    profiles,
  );
}

/* =========================================================
   GET PROJECT BY ID
========================================================= */

export async function getProjectById(
  id: string,
): Promise<ProjectWithRelations | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load project: ${error.message}`,
    );
  }

  if (!data) {
    return null;
  }

  const project = data as Project;

  const { clients, employees, profiles } =
    await getProjectRelations();

  return (
    attachRelations(
      [project],
      clients,
      employees,
      profiles,
    )[0] ?? null
  );
}

/* =========================================================
   CREATE PROJECT
========================================================= */

export async function createProject(
  input: CreateProjectInput,
): Promise<Project> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!input.client_id) {
    throw new Error("Client is required.");
  }

  if (!input.name?.trim()) {
    throw new Error("Project name is required.");
  }

  const totalAssets = Math.max(
    0,
    Number(
      input.total_assets_required ?? 0,
    ),
  );

  const completedAssets = Math.max(
    0,
    Number(
      input.completed_assets ?? 0,
    ),
  );

  if (completedAssets > totalAssets) {
    throw new Error(
      "Completed assets cannot be greater than total assets.",
    );
  }

  const pendingAssets = Math.max(
    0,
    totalAssets - completedAssets,
  );

  let creatorTeamId: string | null = null;
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("team_id")
      .eq("id", user.id)
      .maybeSingle();
    creatorTeamId = profile?.team_id ?? null;
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.client_id,

      name: input.name.trim(),

      series_title:
        input.series_title?.trim() || null,

      description:
        input.description?.trim() || null,

      total_assets_required:
        totalAssets,

      completed_assets:
        completedAssets,

      pending_assets:
        pendingAssets,

      lead_employee_id:
        input.lead_employee_id || null,

      start_date:
        input.start_date || null,

      target_deadline:
        input.target_deadline || null,

      status: input.status,

      health: input.health,

      invoice_status:
        input.invoice_status,

      is_active: true,

      created_by: user?.id ?? null,

      team_id: creatorTeamId,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to create project: ${error.message}`,
    );
  }

  return data as Project;
}

/* =========================================================
   UPDATE PROJECT
========================================================= */

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const updates: Record<string, unknown> = {};

  if (input.client_id !== undefined) {
    updates.client_id = input.client_id;
  }

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new Error(
        "Project name cannot be empty.",
      );
    }

    updates.name = name;
  }

  if (input.series_title !== undefined) {
    updates.series_title =
      input.series_title?.trim() || null;
  }

  if (input.description !== undefined) {
    updates.description =
      input.description?.trim() || null;
  }

  if (
    input.total_assets_required !==
    undefined
  ) {
    updates.total_assets_required =
      Math.max(
        0,
        Number(
          input.total_assets_required,
        ),
      );
  }

  if (
    input.completed_assets !==
    undefined
  ) {
    updates.completed_assets =
      Math.max(
        0,
        Number(
          input.completed_assets,
        ),
      );
  }

  /*
   * Recalculate pending assets whenever
   * total or completed assets change.
   */

  if (
    input.total_assets_required !==
      undefined ||
    input.completed_assets !==
      undefined
  ) {
    const {
      data: currentProject,
      error: currentError,
    } = await supabase
      .from("projects")
      .select(
        "total_assets_required, completed_assets",
      )
      .eq("id", id)
      .single();

    if (currentError) {
      throw new Error(
        `Unable to read current project progress: ${currentError.message}`,
      );
    }

    const total =
      input.total_assets_required !==
      undefined
        ? Math.max(
            0,
            Number(
              input.total_assets_required,
            ),
          )
        : Number(
            currentProject.total_assets_required ??
              0,
          );

    const completed =
      input.completed_assets !==
      undefined
        ? Math.max(
            0,
            Number(
              input.completed_assets,
            ),
          )
        : Number(
            currentProject.completed_assets ??
              0,
          );

    if (completed > total) {
      throw new Error(
        "Completed assets cannot be greater than total assets.",
      );
    }

    updates.pending_assets = Math.max(
      0,
      total - completed,
    );
  }

  /*
   * Only use a manually supplied pending
   * value when progress fields weren't
   * changed.
   */

  if (
    input.pending_assets !== undefined &&
    input.total_assets_required ===
      undefined &&
    input.completed_assets ===
      undefined
  ) {
    updates.pending_assets =
      Math.max(
        0,
        Number(
          input.pending_assets,
        ),
      );
  }

  if (
    input.lead_employee_id !==
    undefined
  ) {
    updates.lead_employee_id =
      input.lead_employee_id || null;
  }

  if (input.start_date !== undefined) {
    updates.start_date =
      input.start_date || null;
  }

  if (
    input.target_deadline !==
    undefined
  ) {
    updates.target_deadline =
      input.target_deadline || null;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.health !== undefined) {
    updates.health = input.health;
  }

  if (
    input.invoice_status !==
    undefined
  ) {
    updates.invoice_status =
      input.invoice_status;
  }

  if (input.is_active !== undefined) {
    updates.is_active = input.is_active;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error(
      "No project changes were provided.",
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update project: ${error.message}`,
    );
  }

  return data as Project;
}

/* =========================================================
   SET PROJECT ACTIVE STATUS
========================================================= */

export async function setProjectStatus(
  id: string,
  isActive: boolean,
): Promise<Project> {
  return updateProject(id, {
    is_active: isActive,
  });
}

/* =========================================================
   UPDATE PROJECT PROGRESS
========================================================= */

export async function updateProjectProgress(
  id: string,
  completedAssets: number,
): Promise<Project> {
  const {
    data: project,
    error: fetchError,
  } = await supabase
    .from("projects")
    .select(
      "total_assets_required",
    )
    .eq("id", id)
    .single();

  if (fetchError) {
    throw new Error(
      `Unable to load project progress: ${fetchError.message}`,
    );
  }

  const total = Number(
    project.total_assets_required ?? 0,
  );

  const completed = Math.max(
    0,
    Math.min(
      Number(completedAssets),
      total,
    ),
  );

  const pending = Math.max(
    0,
    total - completed,
  );

  const { data, error } = await supabase
    .from("projects")
    .update({
      completed_assets: completed,
      pending_assets: pending,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to update project progress: ${error.message}`,
    );
  }

  return data as Project;
}
