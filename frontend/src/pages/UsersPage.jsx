import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function parseLines(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const editingUser = useMemo(
    () => users.find((u) => u.id === editingId) || null,
    [users, editingId]
  );

  const [editName, setEditName] = useState("");
  const [editEmailsText, setEditEmailsText] = useState("");
  const [editPhonesText, setEditPhonesText] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(user) {
    setEditingId(user.id);
    setEditName(user.name || "");
    setEditEmailsText((user.emails || []).map((x) => x.email).join("\n"));
    setEditPhonesText((user.phones || []).map((x) => x.phone).join("\n"));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditEmailsText("");
    setEditPhonesText("");
  }

  async function onSaveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    setErr("");
    const emails = parseLines(editEmailsText);
    const phones = parseLines(editPhonesText);

    try {
      const updated = await api.updateUser(editingId, {
        name: editName,
        emails,
        phones,
      });

      setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      cancelEdit();
    } catch (e) {
      setErr(e.message || "Update failed");
    }
  }

  async function onDelete(id) {
    setErr("");
    if (!confirm(`Soft delete user #${id}?`)) return;

    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
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
      <h1>Users</h1>

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
      {!loading && users.length === 0 ? <p>No users found.</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {users.map((u) => (
          <div
            key={u.id}
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
                <strong>#{u.id}</strong> — <strong>{u.name}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(u)}>Edit</button>
                <button onClick={() => onDelete(u.id)}>Delete</button>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>
                <strong>Emails:</strong>{" "}
                {(u.emails || []).length ? (
                  (u.emails || []).map((e) => e.email).join(", ")
                ) : (
                  <em>none</em>
                )}
              </div>
              <div>
                <strong>Phones:</strong>{" "}
                {(u.phones || []).length ? (
                  (u.phones || []).map((p) => p.phone).join(", ")
                ) : (
                  <em>none</em>
                )}
              </div>
            </div>

            {editingUser && editingUser.id === u.id ? (
              <form
                onSubmit={onSaveEdit}
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: "1px solid #eee",
                }}
              >
                <h3>Edit user #{u.id}</h3>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Name
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Emails (one per line) — replacing existing
                  <textarea
                    value={editEmailsText}
                    onChange={(e) => setEditEmailsText(e.target.value)}
                    rows={4}
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>

                <label style={{ display: "block", marginBottom: 8 }}>
                  Phones (one per line) — replacing existing
                  <textarea
                    value={editPhonesText}
                    onChange={(e) => setEditPhonesText(e.target.value)}
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
