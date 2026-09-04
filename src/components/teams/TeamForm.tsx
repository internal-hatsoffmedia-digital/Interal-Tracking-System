import { useEffect, useState } from "react";
import { X } from "lucide-react";

import type { Team } from "../../types/team";
import {
  createTeam,
  updateTeam,
} from "../../services/teams/teams.service";

interface TeamFormProps {
  team: Team | null;
  onClose: () => void;
  onSaved: () => void;
}

const teamTypes = [
  { value: "editing", label: "Editing" },
  { value: "design", label: "Design" },
  { value: "social_media", label: "Social Media" },
  { value: "production", label: "Production" },
  { value: "management", label: "Management" },
  { value: "other", label: "Other" },
];

function TeamForm({
  team,
  onClose,
  onSaved,
}: TeamFormProps) {
  const [name, setName] = useState("");
  const [teamType, setTeamType] = useState("editing");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(team);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setTeamType(team.team_type);
      setDescription(team.description ?? "");
    } else {
      setName("");
      setTeamType("editing");
      setDescription("");
    }

    setErrorMessage("");
  }, [team]);

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage("Team name is required.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (team) {
        await updateTeam(team.id, {
          name: name.trim(),
          team_type: teamType,
          description: description.trim(),});
      } else {
        await createTeam({
          name: name.trim(),
          team_type: teamType,
          description: description.trim(),
          team_lead_id: null,
        });
      }

      onSaved();
    } catch (error) {
      console.error("Team save error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {isEditing ? "Edit Team" : "Create Team"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {isEditing
                ? "Update your team information."
                : "Add a new team to your organization."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="team-name"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Team Name
            </label>

            <input
              id="team-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="e.g. Video Editing Team"
              required
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
            />
          </div>

          <div>
            <label
              htmlFor="team-type"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Team Type
            </label>

            <select
              id="team-type"
              value={teamType}
              onChange={(event) =>
                setTeamType(event.target.value)
              }
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-900"
            >
              {teamTypes.map((type) => (
                <option
                  key={type.value}
                  value={type.value}
                >
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="team-description"
              className="mb-2 block text-xs font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="team-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Briefly describe this team's responsibilities..."
              rows={4}
              disabled={isSubmitting}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-10 rounded-xl px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeamForm;