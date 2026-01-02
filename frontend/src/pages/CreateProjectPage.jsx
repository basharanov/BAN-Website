import { useEffect, useState } from "react";
import { api } from "../api";

export default function CreateProjectPage() {
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState(""); // yyyy-mm-dd (optional)
  const [description, setDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [typeId, setTypeId] = useState("");

  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadTypes() {
      setErr("");
      setLoadingTypes(true);
      try {
        const data = await api.getProjectTypes();
        setTypes(data);
      } catch (e) {
        setErr(e.message || "Failed to load project types");
      } finally {
        setLoadingTypes(false);
      }
    }
    loadTypes();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      const created = await api.createProject({
        startDate,
        endDate: endDate ? endDate : null,
        description: description.trim(),
        websiteUrl: websiteUrl.trim() ? websiteUrl.trim() : null,
        typeId: Number(typeId),
      });

      setSuccess(`Created project #${created.id}`);
      setStartDate("");
      setEndDate("");
      setDescription("");
      setWebsiteUrl("");
      setTypeId("");
    } catch (e) {
      setErr(e.message || "Create failed");
    }
  }
  const isDateOrderValid =
    !endDate || !startDate || new Date(endDate) >= new Date(startDate);

  const canSubmit =
    typeId &&
    Number.isInteger(Number(typeId)) &&
    startDate &&
    description.trim().length > 0 &&
    isDateOrderValid;

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, Arial",
      }}
    >
      <h1>Create Project</h1>

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
          Project Type
          <select
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            disabled={loadingTypes}
          >
            <option value="">
              {loadingTypes ? "Loading types..." : "Select a type"}
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (#{t.id})
              </option>
            ))}
          </select>
        </label>

        <label>
          Start Date
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          End Date (optional)
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            style={{ width: "100%", padding: 8 }}
          />
          {endDate && startDate && !isDateOrderValid ? (
            <div style={{ color: "red", fontSize: 12, marginTop: 4 }}>
              End date cannot be earlier than start date
            </div>
          ) : null}
        </label>

        <label>
          Website URL (optional)
          <input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            placeholder="https://example.com"
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
            placeholder="Short description of the project..."
          />
        </label>

        <button type="submit" disabled={!canSubmit}>
          Create
        </button>
      </form>
    </div>
  );
}
