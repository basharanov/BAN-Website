import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function ELibraryPage() {
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const editingItem = useMemo(
    () => items.find((x) => x.id === editingId) || null,
    [items, editingId]
  );

  const [editAuthor, setEditAuthor] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editOrganization, setEditOrganization] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.getELibraryItems();
      setItems(data);
    } catch (e) {
      setErr(e.message || "Failed to load e-library items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item) {
    setEditingId(item.id);
    setEditAuthor(item.author || "");
    setEditTitle(item.title || "");
    setEditOrganization(item.organization || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditAuthor("");
    setEditTitle("");
    setEditOrganization("");
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setErr("");

    if (!isNonEmptyString(editAuthor)) return setErr("Author is required");
    if (!isNonEmptyString(editTitle)) return setErr("Title is required");

    try {
      const updated = await api.updateELibraryItem(editingId, {
        author: editAuthor.trim(),
        title: editTitle.trim(),
        organization: editOrganization.trim() ? editOrganization.trim() : null,
      });

      setItems((prev) => prev.map((x) => (x.id === editingId ? updated : x)));
      cancelEdit();
    } catch (e2) {
      setErr(e2.message || "Update failed");
    }
  }

  async function onDelete(id) {
    setErr("");
    if (!confirm(`Soft delete e-library item #${id}?`)) return;

    try {
      await api.deleteELibraryItem(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
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
      <h1>E-Library</h1>

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
      {!loading && items.length === 0 ? <p>No items found.</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div
            key={it.id}
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
                <strong>#{it.id}</strong>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(it)}>Edit</button>
                <button onClick={() => onDelete(it.id)}>Delete</button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>
                <strong>Author:</strong> {it.author}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Title:</strong> {it.title}
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Organization:</strong>{" "}
                {it.organization ? it.organization : <em></em>}
              </div>
            </div>

            {editingItem && editingItem.id === it.id ? (
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
                <h3>Edit item #{it.id}</h3>

                <label>
                  Author
                  <input
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <label>
                  Title
                  <textarea
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    rows={4}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <label>
                  Organization
                  <input
                    value={editOrganization}
                    onChange={(e) => setEditOrganization(e.target.value)}
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
