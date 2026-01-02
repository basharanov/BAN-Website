import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function toDateInputValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [types, setTypes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const editingProject = useMemo(
    () => projects.find((p) => p.id === editingId) || null,
    [projects, editingId]
  );

  const [editTypeId, setEditTypeId] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const isEditDateOrderValid =
    !editEndDate ||
    !editStartDate ||
    new Date(editEndDate) >= new Date(editStartDate);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.getProjects(),
        api.getProjectTypes(),
      ]);
      setProjects(p);
      setTypes(t);
    } catch (e) {
      setErr(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p) {
    setEditingId(p.id);
    setEditTypeId(String(p.typeId ?? p.type?.id ?? ""));
    setEditStartDate(toDateInputValue(p.startDate));
    setEditEndDate(p.endDate ? toDateInputValue(p.endDate) : "");
    setEditWebsiteUrl(p.websiteUrl || "");
    setEditDescription(p.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTypeId("");
    setEditStartDate("");
    setEditEndDate("");
    setEditWebsiteUrl("");
    setEditDescription("");
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setErr("");

    if (!isEditDateOrderValid) {
      setErr("End date cannot be earlier than start date");
      return;
    }

    try {
      const updated = await api.updateProject(editingId, {
        typeId: editTypeId ? Number(editTypeId) : undefined,
        startDate: editStartDate || undefined,
        endDate: editEndDate ? editEndDate : null, // ако го оставиш празно -> null (clear)
        websiteUrl: editWebsiteUrl.trim() ? editWebsiteUrl.trim() : null,
        description: editDescription,
      });

      setProjects((prev) =>
        prev.map((x) => (x.id === editingId ? updated : x))
      );
      cancelEdit();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function onDelete(id) {
    setErr("");
    if (!confirm(`Soft delete project #${id}?`)) return;

    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setErr(e.message || "Delete failed");
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>Projects</h1>

      {err ? (
        <div
          style={{
            padding: 12,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            marginBottom: 12,
          }}
        >
          <strong>Error:</strong> {err}
        </div>
      ) : null}

      <button onClick={load} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {loading ? <p>Loading…</p> : null}
      {!loading && projects.length === 0 ? <p>No projects found.</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <strong>#{p.id}</strong> —{" "}
                <strong>{p.type?.name || `typeId=${p.typeId}`}</strong>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(p)}>Edit</button>
                <button onClick={() => onDelete(p.id)}>Delete</button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>
                <strong>Start:</strong>{" "}
                {p.startDate ? new Date(p.startDate).toLocaleDateString() : "-"}
              </div>
              <div>
                <strong>End:</strong>{" "}
                {p.endDate ? (
                  new Date(p.endDate).toLocaleDateString()
                ) : (
                  <em>none</em>
                )}
              </div>
              <div>
                <strong>Website:</strong>{" "}
                {p.websiteUrl ? (
                  <a href={p.websiteUrl} target="_blank" rel="noreferrer">
                    {p.websiteUrl}
                  </a>
                ) : (
                  <em>none</em>
                )}
              </div>
              <div>
                <strong>Description:</strong> {p.description}
              </div>
            </div>

            {editingProject && editingProject.id === p.id ? (
              <form
                onSubmit={onSaveEdit}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #eee",
                }}
              >
                <h3>Edit project #{p.id}</h3>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Project Type
                  <select
                    value={editTypeId}
                    onChange={(e) => setEditTypeId(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                  >
                    <option value="">Select a type</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (#{t.id})
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Start Date
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  End Date (optional)
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    min={editStartDate || undefined}
                    style={{ width: "100%", padding: 8 }}
                  />
                  {editEndDate && editStartDate && !isEditDateOrderValid ? (
                    <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
                      End date cannot be earlier than start date
                    </div>
                  ) : null}
                  <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    Leave empty to clear endDate (set to null).
                  </div>
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Website URL (optional)
                  <input
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                    placeholder="https://example.com"
                  />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Description
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit">Save</button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
