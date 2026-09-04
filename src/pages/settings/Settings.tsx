import {
  Activity,
  Bell,
  CheckCircle2,
  Database,
  Mail,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  User,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";

import { supabase } from "../../lib/supabase";

/* ============================================================
   TYPES
============================================================ */

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  team_id: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  job_title: string;
  avatar_url: string;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  taskNotifications: boolean;
  performanceNotifications: boolean;
}

/* ============================================================
   CONSTANTS
============================================================ */

const NOTIFICATION_STORAGE_KEY =
  "hatsoff-internal-notification-preferences";

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  taskNotifications: true,
  performanceNotifications: true,
};

/* ============================================================
   HELPERS
============================================================ */

function formatRole(
  role: string | null | undefined,
): string {
  if (!role) {
    return "Unknown";
  }

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(
  name: string,
): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function readNotificationPreferences(): NotificationPreferences {
  try {
    const stored =
      localStorage.getItem(
        NOTIFICATION_STORAGE_KEY,
      );

    if (!stored) {
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
      };
    }

    const parsed = JSON.parse(
      stored,
    ) as Partial<NotificationPreferences>;

    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
    };
  } catch {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    };
  }
}

/**
 * Convert Supabase's inferred response into
 * the application's local Profile type.
 *
 * We intentionally go through unknown here
 * because the project does not currently provide
 * generated Supabase Database typings.
 */
function mapProfile(
  value: unknown,
): Profile {
  const row =
    value as Record<
      string,
      unknown
    >;

  return {
    id: String(row.id ?? ""),
    full_name:
      typeof row.full_name === "string"
        ? row.full_name
        : null,
    email:
      typeof row.email === "string"
        ? row.email
        : null,
    role: String(
      row.role ?? "employee",
    ),
    team_id:
      typeof row.team_id === "string"
        ? row.team_id
        : null,
    avatar_url:
      typeof row.avatar_url === "string"
        ? row.avatar_url
        : null,
    phone:
      typeof row.phone === "string"
        ? row.phone
        : null,
    job_title:
      typeof row.job_title === "string"
        ? row.job_title
        : null,
    is_active:
      typeof row.is_active === "boolean"
        ? row.is_active
        : true,
    last_seen_at:
      typeof row.last_seen_at ===
      "string"
        ? row.last_seen_at
        : null,
    created_at: String(
      row.created_at ?? "",
    ),
    updated_at: String(
      row.updated_at ?? "",
    ),
  };
}

/* ============================================================
   PAGE
============================================================ */

export default function Settings() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [form, setForm] =
    useState<ProfileForm>({
      full_name: "",
      email: "",
      phone: "",
      job_title: "",
      avatar_url: "",
    });

  const [
    notificationPreferences,
    setNotificationPreferences,
  ] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<
    "checking" | "connected" | "error"
  >("checking");

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  const loadSettings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");
        setConnectionStatus(
          "checking",
        );

        /* -----------------------------------------------
           Get authenticated user
        ------------------------------------------------ */

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "No authenticated user found.",
          );
        }

        /* -----------------------------------------------
           Load own profile
        ------------------------------------------------ */

        const {
          data,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            [
              "id",
              "full_name",
              "email",
              "role",
              "team_id",
              "avatar_url",
              "phone",
              "job_title",
              "is_active",
              "last_seen_at",
              "created_at",
              "updated_at",
            ].join(", "),
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        /* -----------------------------------------------
           Profile does not exist
        ------------------------------------------------ */

        if (!data) {
          const fallbackProfile: Profile = {
            id: user.id,
            full_name:
              typeof user.user_metadata
                ?.full_name === "string"
                ? user.user_metadata
                    .full_name
                : null,
            email:
              user.email ?? null,
            role: "employee",
            team_id: null,
            avatar_url:
              typeof user.user_metadata
                ?.avatar_url === "string"
                ? user.user_metadata
                    .avatar_url
                : null,
            phone:
              user.phone ?? null,
            job_title: null,
            is_active: true,
            last_seen_at: null,
            created_at:
              user.created_at,
            updated_at:
              user.updated_at ??
              user.created_at,
          };

          setProfile(
            fallbackProfile,
          );

          setForm({
            full_name:
              fallbackProfile.full_name ??
              "",
            email:
              fallbackProfile.email ??
              "",
            phone:
              fallbackProfile.phone ??
              "",
            job_title:
              fallbackProfile.job_title ??
              "",
            avatar_url:
              fallbackProfile.avatar_url ??
              "",
          });
        } else {
          /* ---------------------------------------------
             Map Supabase response safely
          --------------------------------------------- */

          const currentProfile =
            mapProfile(data);

          setProfile(
            currentProfile,
          );

          setForm({
            full_name:
              currentProfile.full_name ??
              "",
            email:
              currentProfile.email ??
              "",
            phone:
              currentProfile.phone ??
              "",
            job_title:
              currentProfile.job_title ??
              "",
            avatar_url:
              currentProfile.avatar_url ??
              "",
          });
        }

        /* -----------------------------------------------
           Load notification preferences
        ------------------------------------------------ */

        setNotificationPreferences(
          readNotificationPreferences(),
        );

        setConnectionStatus(
          "connected",
        );
      } catch (err) {
        console.error(
          "Failed to load settings:",
          err,
        );

        setConnectionStatus(
          "error",
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load settings.",
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleFormChange = (
    field: keyof ProfileForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccess("");
  };

  /* ==========================================================
     SAVE PROFILE
  ========================================================== */

  const handleSaveProfile =
    async () => {
      if (!profile) {
        setError(
          "Profile information is not available.",
        );

        return;
      }

      const fullName =
        form.full_name.trim();

      if (!fullName) {
        setError(
          "Full name is required.",
        );

        return;
      }

      try {
        setSaving(true);
        setError("");
        setSuccess("");

        const {
          data,
          error: updateError,
        } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone:
              form.phone.trim() ||
              null,
            job_title:
              form.job_title.trim() ||
              null,
            avatar_url:
              form.avatar_url.trim() ||
              null,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", profile.id)
          .select(
            [
              "id",
              "full_name",
              "email",
              "role",
              "team_id",
              "avatar_url",
              "phone",
              "job_title",
              "is_active",
              "last_seen_at",
              "created_at",
              "updated_at",
            ].join(", "),
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        /* -----------------------------------------------
           Map updated Supabase response safely
        ------------------------------------------------ */

        const updatedProfile =
          mapProfile(data);

        setProfile(
          updatedProfile,
        );

        setForm({
          full_name:
            updatedProfile.full_name ??
            "",
          email:
            updatedProfile.email ??
            "",
          phone:
            updatedProfile.phone ??
            "",
          job_title:
            updatedProfile.job_title ??
            "",
          avatar_url:
            updatedProfile.avatar_url ??
            "",
        });

        setSuccess(
          "Profile updated successfully.",
        );
      } catch (err) {
        console.error(
          "Failed to update profile:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to update profile.",
        );
      } finally {
        setSaving(false);
      }
    };

  /* ==========================================================
     NOTIFICATION CHANGE
  ========================================================== */

  const handleNotificationChange =
    (
      key: keyof NotificationPreferences,
      enabled: boolean,
    ) => {
      const nextPreferences: NotificationPreferences =
        {
          ...notificationPreferences,
          [key]: enabled,
        };

      setNotificationPreferences(
        nextPreferences,
      );

      try {
        localStorage.setItem(
          NOTIFICATION_STORAGE_KEY,
          JSON.stringify(
            nextPreferences,
          ),
        );

        setSuccess(
          "Notification preferences saved.",
        );

        setError("");
      } catch {
        setError(
          "Unable to save notification preferences.",
        );
      }
    };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
              <SettingsIcon className="h-4 w-4" />

              Settings
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Manage your profile,
              notifications, and account
              preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadSettings()
            }
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="min-w-0">
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 break-words">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {success && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* ====================================================
            MAIN LAYOUT
        ==================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ==================================================
              LEFT COLUMN
          ================================================== */}

          <div className="space-y-6">

            {/* ================================================
                PROFILE
            ================================================ */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      My Profile
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Update your personal
                      information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">

                {/* Profile Preview */}

                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-900 text-xl font-bold text-white">
                    {form.avatar_url ? (
                      <img
                        src={
                          form.avatar_url
                        }
                        alt={
                          form.full_name ||
                          "Profile"
                        }
                        className="h-full w-full object-cover"
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      getInitials(
                        form.full_name ||
                          "User",
                      )
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">
                      {form.full_name ||
                        "Your Name"}
                    </p>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {form.job_title ||
                        formatRole(
                          profile?.role,
                        )}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-400">
                      {form.email ||
                        "No email"}
                    </p>
                  </div>
                </div>

                {/* Profile Fields */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* Full Name */}

                  <FormField
                    label="Full Name"
                    required
                  >
                    <input
                      type="text"
                      value={
                        form.full_name
                      }
                      onChange={(event) =>
                        handleFormChange(
                          "full_name",
                          event.target
                            .value,
                        )
                      }
                      placeholder="Enter full name"
                      className="settings-input"
                    />
                  </FormField>

                  {/* Email */}

                  <FormField label="Email">
                    <input
                      type="email"
                      value={
                        form.email
                      }
                      disabled
                      className="settings-input cursor-not-allowed bg-slate-50 text-slate-500"
                    />

                    <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                      Email is managed by
                      your authentication
                      account.
                    </p>
                  </FormField>

                  {/* Phone */}

                  <FormField label="Phone">
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                      <input
                        type="tel"
                        value={
                          form.phone
                        }
                        onChange={(
                          event,
                        ) =>
                          handleFormChange(
                            "phone",
                            event.target
                              .value,
                          )
                        }
                        placeholder="Enter phone number"
                        className="settings-input pl-9"
                      />
                    </div>
                  </FormField>

                  {/* Job Title */}

                  <FormField label="Job Title">
                    <input
                      type="text"
                      value={
                        form.job_title
                      }
                      onChange={(event) =>
                        handleFormChange(
                          "job_title",
                          event.target
                            .value,
                        )
                      }
                      placeholder="e.g. Video Editor"
                      className="settings-input"
                    />
                  </FormField>

                  {/* Avatar URL */}

                  <div className="md:col-span-2">
                    <FormField label="Avatar URL">
                      <input
                        type="url"
                        value={
                          form.avatar_url
                        }
                        onChange={(
                          event,
                        ) =>
                          handleFormChange(
                            "avatar_url",
                            event.target
                              .value,
                          )
                        }
                        placeholder="https://example.com/profile.jpg"
                        className="settings-input"
                      />

                      <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                        Use a publicly accessible
                        image URL for your profile
                        picture.
                      </p>
                    </FormField>
                  </div>
                </div>

                {/* Save */}

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={
                      handleSaveProfile
                    }
                    disabled={
                      saving ||
                      loading ||
                      !profile
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {saving
                      ? "Saving..."
                      : "Save Profile"}
                  </button>
                </div>
              </div>
            </section>

            {/* ================================================
                NOTIFICATIONS
            ================================================ */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <Bell className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Notifications
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Control the notifications
                      you receive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">

                <NotificationRow
                  icon={Mail}
                  title="Email Notifications"
                  description="Receive important system notifications by email."
                  enabled={
                    notificationPreferences.emailNotifications
                  }
                  onChange={(enabled) =>
                    handleNotificationChange(
                      "emailNotifications",
                      enabled,
                    )
                  }
                />

                <NotificationRow
                  icon={Bell}
                  title="Task Notifications"
                  description="Get notified when tasks are assigned, updated, or completed."
                  enabled={
                    notificationPreferences.taskNotifications
                  }
                  onChange={(enabled) =>
                    handleNotificationChange(
                      "taskNotifications",
                      enabled,
                    )
                  }
                />

                <NotificationRow
                  icon={Activity}
                  title="Performance Notifications"
                  description="Receive alerts related to employee performance and reporting."
                  enabled={
                    notificationPreferences.performanceNotifications
                  }
                  onChange={(enabled) =>
                    handleNotificationChange(
                      "performanceNotifications",
                      enabled,
                    )
                  }
                />
              </div>
            </section>
          </div>

          {/* ==================================================
              RIGHT COLUMN
          ================================================== */}

          <div className="space-y-6">

            {/* ================================================
                ACCOUNT
            ================================================ */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <ShieldCheck className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Account
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Account and access information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">

                <InfoRow
                  label="Role"
                  value={formatRole(
                    profile?.role,
                  )}
                />

                <InfoRow
                  label="Status"
                  value={
                    profile?.is_active
                      ? "Active"
                      : "Inactive"
                  }
                  valueClass={
                    profile?.is_active
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                />

                <InfoRow
                  label="Last Seen"
                  value={formatDate(
                    profile?.last_seen_at,
                  )}
                />

                <InfoRow
                  label="Account Created"
                  value={formatDate(
                    profile?.created_at,
                  )}
                />
              </div>
            </section>

            {/* ================================================
                SYSTEM
            ================================================ */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <Database className="h-5 w-5 text-slate-600" />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      System
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Application environment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-slate-100">

                <InfoRow
                  label="Application"
                  value="Hatsoff Internal Force"
                />

                <InfoRow
                  label="Environment"
                  value={
                    import.meta.env
                      .MODE || "unknown"
                  }
                />

                <div className="flex items-center justify-between gap-4 px-5 py-4">
                  <span className="text-xs font-medium text-slate-500">
                    Supabase
                  </span>

                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                    {connectionStatus ===
                    "connected" ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                        <span className="text-emerald-600">
                          Connected
                        </span>
                      </>
                    ) : connectionStatus ===
                      "error" ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-red-500" />

                        <span className="text-red-600">
                          Error
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

                        <span className="text-orange-600">
                          Checking...
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* ================================================
                SECURITY
            ================================================ */}

            <section className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

                <div>
                  <h3 className="text-sm font-semibold">
                    Secure Access
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    Your access to Hatsoff
                    Internal Force is controlled
                    by your assigned role and
                    database security policies.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-lg">
            <RefreshCw className="h-4 w-4 animate-spin" />

            Loading settings...
          </div>
        )}
      </div>

      {/* ======================================================
          LOCAL INPUT STYLES
      ====================================================== */}

      <style>{`
        .settings-input {
          height: 40px;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: rgb(15 23 42);
          outline: none;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            background-color 150ms ease;
        }

        .settings-input::placeholder {
          color: rgb(148 163 184);
        }

        .settings-input:focus {
          border-color: rgb(148 163 184);
          box-shadow: 0 0 0 3px rgb(241 245 249);
        }

        .settings-input:disabled {
          opacity: 0.75;
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}

/* ============================================================
   INFO ROW
============================================================ */

function InfoRow({
  label,
  value,
  valueClass = "text-slate-800",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span
        className={`max-w-[210px] truncate text-right text-xs font-semibold ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   NOTIFICATION ROW
============================================================ */

function NotificationRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (
    enabled: boolean,
  ) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 p-5">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 shrink-0 rounded-lg bg-slate-100 p-2">
          <Icon className="h-4 w-4 text-slate-600" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`${title}: ${
          enabled
            ? "enabled"
            : "disabled"
        }`}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-slate-900"
            : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}