import { useState } from "react";
import { api } from "../api";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function CreateELibraryPage() {
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      const created = await api.createELibraryItem({
        author: author.trim(),
        title: title.trim(),
        organization: organization.trim() ? organization.trim() : null,
      });

      setSuccess(`Created e-library item #${created.id}`);
      setAuthor("");
      setTitle("");
      setOrganization("");
    } catch (e2) {
      setErr(e2.message || "Create failed");
    }
  }

  const canSubmit = isNonEmptyString(author) && isNonEmptyString(title);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>Create E-Library Item</h1>

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

      {success ? (
        <div
          style={{
            padding: 12,
            background: "#e7ffe5",
            border: "1px solid #b9ffb3",
            marginBottom: 12,
          }}
        >
          {success}
        </div>
      ) : null}

      <form
        onSubmit={onCreate}
        style={{
          display: "grid",
          gap: 10,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <label>
          Author
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="Весела Георгиева"
          />
        </label>

        <label>
          Title
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
            placeholder="Заглавие..."
          />
        </label>

        <label>
          Organization
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="ИИКТ-БАН / Тракийски университет..."
          />
        </label>

        <button type="submit" disabled={!canSubmit}>
          Create
        </button>
      </form>
    </div>
  );
}
