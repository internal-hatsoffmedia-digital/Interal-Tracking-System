import { supabase } from "../../lib/supabase";

import type {
  CreateEmployeeInput,
  EmployeeWithTeam,
  UpdateEmployeeInput,
} from "../../types/employee";


/* =========================================================
   PROFILE OPTION
========================================================= */

export interface EmployeeProfileOption {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  job_title: string | null;
}


/* =========================================================
   EMPLOYEE SELECT
========================================================= */

const employeeSelect = `
  id,
  profile_id,
  employee_code,
  full_name,
  email,
  phone,
  job_title,
  team_id,
  joining_date,
  is_active,
  created_at,
  updated_at,
  teams (
    id,
    name
  )
`;


/* =========================================================
   NORMALIZE EMPLOYEE
========================================================= */

function normalizeEmployee(
  employee: any,
): EmployeeWithTeam {
  return {
    ...employee,

    team: Array.isArray(employee.teams)
      ? employee.teams[0] ?? null
      : employee.teams ?? null,
  } as EmployeeWithTeam;
}


/* =========================================================
   GET ALL EMPLOYEES
========================================================= */

export async function getEmployees(): Promise<
  EmployeeWithTeam[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .select(employeeSelect)
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    normalizeEmployee,
  );
}


/* =========================================================
   GET ACTIVE EMPLOYEES
========================================================= */

export async function getActiveEmployees(): Promise<
  EmployeeWithTeam[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .select(employeeSelect)
    .eq("is_active", true)
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    normalizeEmployee,
  );
}


/* =========================================================
   GET EMPLOYEE BY ID
========================================================= */

export async function getEmployeeById(
  id: string,
): Promise<EmployeeWithTeam | null> {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .select(employeeSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return normalizeEmployee(data);
}


/* =========================================================
   GET AVAILABLE PROFILES
=========================================================

   Only existing profiles that are not already linked
   to an employee record are returned.

   We intentionally DO NOT create Auth users here.
========================================================= */

export async function getAvailableEmployeeProfiles(): Promise<
  EmployeeProfileOption[]
> {
  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      `
        id,
        full_name,
        email,
        phone,
        job_title
      `,
    )
    .eq("is_active", true)
    .order("full_name", {
      ascending: true,
    });

  if (profileError) {
    throw profileError;
  }


  const {
    data: employeeProfiles,
    error: employeeProfileError,
  } = await supabase
    .from("employees")
    .select("profile_id");

  if (employeeProfileError) {
    throw employeeProfileError;
  }


  const linkedProfileIds =
    new Set(
      (employeeProfiles ?? []).map(
        (employee) =>
          employee.profile_id,
      ),
    );


  return (
    profileData ?? []
  ).filter(
    (profile) =>
      !linkedProfileIds.has(
        profile.id,
      ),
  ) as EmployeeProfileOption[];
}


/* =========================================================
   CREATE EMPLOYEE
========================================================= */

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeWithTeam> {
  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .insert({
      profile_id:
        input.profile_id,

      employee_code:
        input.employee_code.trim(),

      full_name:
        input.full_name.trim(),

      email:
        input.email.trim(),

      phone:
        input.phone?.trim() ||
        null,

      job_title:
        input.job_title?.trim() ||
        null,

      team_id:
        input.team_id ||
        null,

      joining_date:
        input.joining_date ||
        null,

      is_active: true,
    })
    .select(employeeSelect)
    .single();

  if (error) {
    throw error;
  }

  return normalizeEmployee(data);
}


/* =========================================================
   UPDATE EMPLOYEE
========================================================= */

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeWithTeam> {
  const updates = {
    ...(input.employee_code !==
      undefined && {
      employee_code:
        input.employee_code.trim(),
    }),

    ...(input.full_name !==
      undefined && {
      full_name:
        input.full_name.trim(),
    }),

    ...(input.email !==
      undefined && {
      email:
        input.email.trim(),
    }),

    ...(input.phone !==
      undefined && {
      phone:
        input.phone?.trim() ||
        null,
    }),

    ...(input.job_title !==
      undefined && {
      job_title:
        input.job_title?.trim() ||
        null,
    }),

    ...(input.team_id !==
      undefined && {
      team_id:
        input.team_id ||
        null,
    }),

    ...(input.joining_date !==
      undefined && {
      joining_date:
        input.joining_date ||
        null,
    }),

    ...(input.is_active !==
      undefined && {
      is_active:
        input.is_active,
    }),
  };


  const {
    data,
    error,
  } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select(employeeSelect)
    .single();

  if (error) {
    throw error;
  }

  return normalizeEmployee(data);
}


/* =========================================================
   SET EMPLOYEE STATUS
========================================================= */

export async function setEmployeeStatus(
  id: string,
  isActive: boolean,
): Promise<EmployeeWithTeam> {
  return updateEmployee(
    id,
    {
      is_active: isActive,
    },
  );
}


/* =========================================================
   ASSIGN EMPLOYEE TO TEAM
========================================================= */

export async function assignEmployeeToTeam(
  employeeId: string,
  teamId: string | null,
): Promise<EmployeeWithTeam> {
  return updateEmployee(
    employeeId,
    {
      team_id: teamId,
    },
  );
}