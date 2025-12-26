import { useState } from "react";
import { api } from "../api";

function parseLines(text) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CreateUserPage() {
  const [name, setName] = useState("");
  const [emailsText, setEmailsText] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  async function onCreate(e) {
    e.preventDefault();
    setErr("");
    setSuccess("");

    try {
      const created = await api.createUser({
        name: name.trim(),
        emails: parseLines(emailsText),
        phones: parseLines(phonesText),
      });

      setSuccess(`Created user #${created.id}`);
      setName("");
      setEmailsText("");
      setPhonesText("");
    } catch (e) {
      setErr(e.message || "Create failed");
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
      <h1>Create User</h1>

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
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Emails (one per line)
          <textarea
            value={emailsText}
            onChange={(e) => setEmailsText(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
            placeholder={"john.doe@gmail.com\njohn@company.com"}
          />
        </label>

        <label>
          Phones (one per line)
          <textarea
            value={phonesText}
            onChange={(e) => setPhonesText(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
            placeholder={"+15551234567\n+15559876543"}
          />
        </label>

        <button type="submit" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </div>
  );
}
