import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export default function CreatePublicationPage() {
  const [year, setYear] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState("");

  // authors selection rows: [{ authorId: "" }]
  const [authorRows, setAuthorRows] = useState([{ authorId: "" }]);

  const [types, setTypes] = useState([]);
  const [authors, setAuthors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      setLoading(true);
      try {
        const [t, a] = await Promise.all([
          api.getPublicationTypes(),
          api.getAuthors(),
        ]);
        setTypes(t);
        setAuthors(a);
      } catch (e) {
        setErr(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedAuthorIds = useMemo(() => {
    return new Set(
      authorRows.map((r) => Number(r.authorId)).filter(Number.isInteger)
    );
  }, [authorRows]);

  function addAuthorRow() {
    setAuthorRows((prev) => [...prev, { authorId: "" }]);
  }

  function removeAuthorRow(idx) {
    setAuthorRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeAuthorRow(idx, value) {
    setAuthorRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, authorId: value } : r))
    );
  }

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      const yearNum = Number(year);

      const filteredAuthors = authorRows
        .map((r, idx) => ({
          authorId: Number(r.authorId),
          order: idx + 1,
        }))
        .filter((x) => Number.isInteger(x.authorId));

      const created = await api.createPublication({
        year: yearNum,
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        typeId: Number(typeId),
        authors: filteredAuthors,
      });

      setSuccess(`Created publication #${created.id}`);
      setYear("");
      setTitle("");
      setDescription("");
      setTypeId("");
      setAuthorRows([{ authorId: "" }]);
    } catch (e2) {
      setErr(e2.message || "Create failed");
    }
  }

  const yearNum = Number(year);
  const canSubmit =
    Number.isInteger(yearNum) &&
    yearNum > 0 &&
    isNonEmptyString(title) &&
    typeId &&
    Number.isInteger(Number(typeId));

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>Create Publication</h1>

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
          Publication Type
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            disabled={loading}
          >
            <option value="">
              {loading ? "Loading types..." : "Select a type"}
            </option>
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
            value={year}
            onChange={(e) => setYear(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="2023"
            min="0"
          />
        </label>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="Technologies for Intelligent and Inclusive Education"
          />
        </label>

        <label>
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            style={{ width: "100%", padding: 8 }}
            placeholder="Full citation / ISBN / DOI / pages..."
          />
        </label>

        {/* Authors */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>Authors (optional)</strong>
            <button type="button" onClick={addAuthorRow}>
              + Add author
            </button>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            {authorRows.map((row, idx) => (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 90px",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.8 }}>#{idx + 1}</div>

                <select
                  value={row.authorId}
                  onChange={(e) => changeAuthorRow(idx, e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                  disabled={loading}
                >
                  <option value="">Select author</option>
                  {authors.map((a) => {
                    // позволява да избираш пак вече избран, само ако е текущия ред
                    const aId = Number(a.id);
                    const isSelectedElsewhere =
                      selectedAuthorIds.has(aId) &&
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
                  onClick={() => removeAuthorRow(idx)}
                  disabled={authorRows.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
            Author order is taken from the row order (1, 2, 3...).
          </div>
        </div>

        <button type="submit" disabled={!canSubmit}>
          Create
        </button>
      </form>
    </div>
  );
}
