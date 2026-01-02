import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState([]);
  const [types, setTypes] = useState([]);
  const [allAuthors, setAllAuthors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const editingPublication = useMemo(
    () => publications.find((p) => p.id === editingId) || null,
    [publications, editingId]
  );

  const [editTypeId, setEditTypeId] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // authors rows for edit
  const [editAuthorRows, setEditAuthorRows] = useState([{ authorId: "" }]);

  const selectedEditAuthorIds = useMemo(() => {
    return new Set(
      editAuthorRows.map((r) => Number(r.authorId)).filter(Number.isInteger)
    );
  }, [editAuthorRows]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [p, t, a] = await Promise.all([
        api.getPublications(),
        api.getPublicationTypes(),
        api.getAuthors(),
      ]);
      setPublications(p);
      setTypes(t);
      setAllAuthors(a);
    } catch (e) {
      setErr(e.message || "Failed to load publications");
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
    setEditYear(String(p.year ?? ""));
    setEditTitle(p.title || "");
    setEditDescription(p.description || "");

    // map from include structure: p.authors = [{ order, author: {...} }]
    const rows =
      (p.authors || [])
        .slice()
        .sort((x, y) => (x.order ?? 0) - (y.order ?? 0))
        .map((x) => ({ authorId: String(x.authorId ?? x.author?.id ?? "") })) ||
      [];

    setEditAuthorRows(rows.length > 0 ? rows : [{ authorId: "" }]);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTypeId("");
    setEditYear("");
    setEditTitle("");
    setEditDescription("");
    setEditAuthorRows([{ authorId: "" }]);
  }

  function addEditAuthorRow() {
    setEditAuthorRows((prev) => [...prev, { authorId: "" }]);
  }

  function removeEditAuthorRow(idx) {
    setEditAuthorRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeEditAuthorRow(idx, value) {
    setEditAuthorRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, authorId: value } : r))
    );
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setErr("");

    const yearNum = editYear ? Number(editYear) : NaN;
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      setErr("Year must be a valid integer");
      return;
    }
    if (!isNonEmptyString(editTitle)) {
      setErr("Title is required");
      return;
    }
    if (!editTypeId || !Number.isInteger(Number(editTypeId))) {
      setErr("Type is required");
      return;
    }

    const authorsPayload = editAuthorRows
      .map((r, idx) => ({
        authorId: Number(r.authorId),
        order: idx + 1,
      }))
      .filter((x) => Number.isInteger(x.authorId));

    try {
      const updated = await api.updatePublication(editingId, {
        typeId: Number(editTypeId),
        year: yearNum,
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        authors: authorsPayload, // replaces list (per backend logic)
      });

      setPublications((prev) =>
        prev.map((x) => (x.id === editingId ? updated : x))
      );
      cancelEdit();
    } catch (e2) {
      setErr(e2.message || "Update failed");
    }
  }

  async function onDelete(id) {
    setErr("");
    if (!confirm(`Soft delete publication #${id}?`)) return;

    try {
      await api.deletePublication(id);
      setPublications((prev) => prev.filter((p) => p.id !== id));
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
      <h1>Publications</h1>

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
      {!loading && publications.length === 0 ? (
        <p>No publications found.</p>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {publications.map((p) => {
          const authorNames =
            (p.authors || [])
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((x) => x.author?.fullName)
              .filter(Boolean) || [];

          return (
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
                  <strong>Year:</strong> {p.year ?? "-"}
                </div>
                <div>
                  <strong>Title:</strong> {p.title}
                </div>
                <div>
                  <strong>Authors:</strong>{" "}
                  {authorNames.length > 0 ? (
                    authorNames.join(", ")
                  ) : (
                    <em>none</em>
                  )}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Description:</strong>{" "}
                  {p.description ? p.description : <em>none</em>}
                </div>
              </div>

              {editingPublication && editingPublication.id === p.id ? (
                <form
                  onSubmit={onSaveEdit}
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #eee",
                    display: "grid",
                    gap: 10,
                  }}
                >
                  <h3>Edit publication #{p.id}</h3>

                  <label>
                    Publication Type
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

                  <label>
                    Year
                    <input
                      type="number"
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                      min="0"
                    />
                  </label>

                  <label>
                    Title
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </label>

                  <label>
                    Description (optional)
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={5}
                      style={{ width: "100%", padding: 8 }}
                    />
                  </label>

                  {/* Edit authors */}
                  <div
                    style={{
                      border: "1px solid #eee",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <strong>Authors</strong>
                      <button type="button" onClick={addEditAuthorRow}>
                        + Add author
                      </button>
                    </div>

                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {editAuthorRows.map((row, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "70px 1fr 90px",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontSize: 12, opacity: 0.8 }}>
                            #{idx + 1}
                          </div>

                          <select
                            value={row.authorId}
                            onChange={(e) =>
                              changeEditAuthorRow(idx, e.target.value)
                            }
                            style={{ width: "100%", padding: 8 }}
                          >
                            <option value="">Select author</option>
                            {allAuthors.map((a) => {
                              const aId = Number(a.id);
                              const isSelectedElsewhere =
                                selectedEditAuthorIds.has(aId) &&
                                Number(row.authorId) !== aId;

                              return (
                                <option
                                  key={a.id}
                                  value={a.id}
                                  disabled={isSelectedElsewhere}
                                >
                                  {a.fullName} (#{a.id})
                                </option>
                              );
                            })}
                          </select>

                          <button
                            type="button"
                            onClick={() => removeEditAuthorRow(idx)}
                            disabled={editAuthorRows.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                      Saving replaces the full authors list (in this order).
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="submit">Save</button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
