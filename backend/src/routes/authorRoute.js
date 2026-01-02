import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Helpers
 */
function parseId(param) {
  const id = Number(param);
  return Number.isInteger(id) ? id : null;
}
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}
function cleanOptionalString(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return "INVALID";
  const t = v.trim();
  return t === "" ? null : t;
}

// GET /authors -> list (only not soft-deleted)
router.get("/", async (_req, res) => {
  try {
    const authors = await prisma.author.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
    });
    return res.json(authors);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /authors/:id -> single
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid author id" });

  try {
    const author = await prisma.author.findFirst({
      where: { id, deletedAt: null },
    });

    if (!author) return res.status(404).json({ error: "Author not found" });
    return res.json(author);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /authors -> create
// Body: { fullName, email?, orcid? }
router.post("/", async (req, res) => {
  const body = req.body || {};

  if (!isNonEmptyString(body.fullName)) {
    return res.status(400).json({ error: "fullName is required" });
  }

  const emailClean = cleanOptionalString(body.email);
  if (emailClean === "INVALID") {
    return res.status(400).json({ error: "email must be a string (or null)" });
  }

  const orcidClean = cleanOptionalString(body.orcid);
  if (orcidClean === "INVALID") {
    return res.status(400).json({ error: "orcid must be a string (or null)" });
  }

  try {
    const created = await prisma.author.create({
      data: {
        fullName: body.fullName.trim(),
        email: emailClean,
        orcid: orcidClean,
      },
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Unique constraint failed",
        fields: err.meta?.target,
      });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /authors/:id -> update
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};

  if (!id) return res.status(400).json({ error: "Invalid author id" });

  if (body.fullName !== undefined && !isNonEmptyString(body.fullName)) {
    return res
      .status(400)
      .json({ error: "fullName must be a non-empty string" });
  }

  const emailClean = cleanOptionalString(body.email);
  if (body.email !== undefined && emailClean === "INVALID") {
    return res.status(400).json({ error: "email must be a string (or null)" });
  }

  const orcidClean = cleanOptionalString(body.orcid);
  if (body.orcid !== undefined && orcidClean === "INVALID") {
    return res.status(400).json({ error: "orcid must be a string (or null)" });
  }

  try {
    const existing = await prisma.author.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Author not found" });

    const updated = await prisma.author.update({
      where: { id },
      data: {
        ...(body.fullName !== undefined
          ? { fullName: body.fullName.trim() }
          : {}),
        ...(body.email !== undefined ? { email: emailClean } : {}),
        ...(body.orcid !== undefined ? { orcid: orcidClean } : {}),
      },
    });

    return res.json(updated);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Unique constraint failed",
        fields: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Author not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /authors/:id -> soft delete
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid author id" });

  try {
    const existing = await prisma.author.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: "Author not found" });

    await prisma.author.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
