// backend/routes/eLibraryRoute.js
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

/**
 * GET /e-library -> list (only not soft-deleted)
 */
router.get("/", async (_req, res) => {
  try {
    const items = await prisma.eLibraryItem.findMany({
      where: { deletedAt: null },
      orderBy: { id: "desc" },
    });

    return res.json(items);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /e-library/:id -> single (only not soft-deleted)
 */
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid item id" });

  try {
    const item = await prisma.eLibraryItem.findFirst({
      where: { id, deletedAt: null },
    });

    if (!item) return res.status(404).json({ error: "Item not found" });

    return res.json(item);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /e-library -> create
 * Body: { author, title, organization }
 */
router.post("/", async (req, res) => {
  const body = req.body || {};

  if (!isNonEmptyString(body.author)) {
    return res.status(400).json({
      error: "author is required and must be a non-empty string",
    });
  }

  if (!isNonEmptyString(body.title)) {
    return res.status(400).json({
      error: "title is required and must be a non-empty string",
    });
  }

  const organizationClean = cleanOptionalString(body.organization);
  if (organizationClean === "INVALID") {
    return res.status(400).json({
      error: "organization must be a string or null",
    });
  }

  try {
    const created = await prisma.eLibraryItem.create({
      data: {
        author: body.author.trim(),
        title: body.title.trim(),
        organization: organizationClean,
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

/**
 * PUT /e-library/:id -> update (only not soft-deleted)
 * Allows partial update:
 * { author?, title?, organization? }
 */
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};

  if (!id) return res.status(400).json({ error: "Invalid item id" });

  if (body.author !== undefined && !isNonEmptyString(body.author)) {
    return res.status(400).json({ error: "author must be a non-empty string" });
  }
  if (body.title !== undefined && !isNonEmptyString(body.title)) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }
  const organizationClean = cleanOptionalString(body.organization);
  if (body.organization !== undefined && organizationClean === "INVALID") {
    return res.status(400).json({
      error: "organization must be a string or null",
    });
  }

  try {
    const existing = await prisma.eLibraryItem.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Item not found" });

    const updated = await prisma.eLibraryItem.update({
      where: { id },
      data: {
        ...(body.author !== undefined ? { author: body.author.trim() } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.organization !== undefined
          ? { organization: organizationClean }
          : {}),
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
      return res.status(404).json({ error: "Item not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /e-library/:id -> soft delete
 */
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid item id" });

  try {
    const existing = await prisma.eLibraryItem.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ error: "Item not found" });

    await prisma.eLibraryItem.update({
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
