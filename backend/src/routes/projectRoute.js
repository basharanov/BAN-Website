// backend/routes/projectRoute.js
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

function parseDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function cleanOptionalString(v) {
  // returns:
  // - undefined -> if omitted
  // - string    -> trimmed non-empty
  // - null      -> if explicitly empty string should become null
  // - "INVALID" -> invalid type
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return "INVALID";
  const t = v.trim();
  return t === "" ? null : t;
}

router.get("/", async (_req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: {
        type: true, // ProjectType
      },
      orderBy: { id: "desc" },
    });

    return res.json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/by-type/:typeId  -> list projects by type (only not soft-deleted)
router.get("/by-type/:typeId", async (req, res) => {
  const typeId = Number(req.params.typeId);

  if (!Number.isInteger(typeId)) {
    return res.status(400).json({ error: "Invalid type id" });
  }

  try {
    // optional: ensure type exists and is NOT soft-deleted
    const typeExists = await prisma.projectType.findFirst({
      where: { id: typeId, deletedAt: null },
      select: { id: true },
    });

    if (!typeExists) {
      return res.status(404).json({ error: "Project type not found" });
    }

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        typeId: typeId,
      },
      include: { type: true },
      orderBy: { id: "desc" },
    });

    return res.json(projects);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /projects/:id -> single (only not soft-deleted)
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { type: true },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json(project);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /projects -> create
// Body expected:
// {
//   "startDate": "2025-01-10" (or ISO string),
//   "endDate": "2025-12-31" (optional or null),
//   "description": "text",
//   "websiteUrl": "https://..." (optional or null),
//   "typeId": 1   OR  "typeName": "Международни проекти"
// }
router.post("/", async (req, res) => {
  const body = req.body || {};

  const startDate = parseDate(body.startDate);
  const endDate = parseDate(body.endDate);

  if (!startDate) {
    return res.status(400).json({
      error: "startDate is required and must be a valid date",
    });
  }

  if (!isNonEmptyString(body.description)) {
    return res.status(400).json({
      error: "description is required and must be a non-empty string",
    });
  }
  if (endDate && endDate < startDate) {
    return res.status(400).json({
      error: "End Date cannot be earlier than Start Date",
    });
  }
  // websiteUrl optional
  const websiteUrlClean = cleanOptionalString(body.websiteUrl);
  if (websiteUrlClean === "INVALID") {
    return res.status(400).json({
      error: "websiteUrl must be a string (or null / omit it)",
    });
  }

  // type: accept either typeId or typeName
  const hasTypeId = body.typeId !== undefined;
  const hasTypeName = body.typeName !== undefined;

  if (!hasTypeId && !hasTypeName) {
    return res.status(400).json({
      error: "Either typeId or typeName is required",
    });
  }

  if (hasTypeId && hasTypeName) {
    return res.status(400).json({
      error: "Provide only one of typeId or typeName (not both)",
    });
  }

  const typeId = hasTypeId ? Number(body.typeId) : null;
  const typeName = hasTypeName ? body.typeName : null;

  if (hasTypeId && !Number.isInteger(typeId)) {
    return res.status(400).json({ error: "typeId must be an integer" });
  }

  if (hasTypeName && !isNonEmptyString(typeName)) {
    return res
      .status(400)
      .json({ error: "typeName must be a non-empty string" });
  }

  if (endDate && endDate < startDate) {
    return res.status(400).json({
      error: "endDate cannot be earlier than startDate",
    });
  }

  try {
    // Prevent connecting to a soft-deleted type
    let typeConnect;
    if (hasTypeId) {
      const t = await prisma.projectType.findFirst({
        where: { id: typeId, deletedAt: null },
        select: { id: true },
      });
      if (!t) {
        return res.status(400).json({ error: "Invalid typeId (not found)" });
      }
      typeConnect = { connect: { id: typeId } };
    } else {
      const t = await prisma.projectType.findFirst({
        where: { name: typeName.trim(), deletedAt: null },
        select: { id: true, name: true },
      });
      if (!t) {
        return res.status(400).json({ error: "Invalid typeName (not found)" });
      }
      typeConnect = { connect: { id: t.id } };
    }

    const created = await prisma.project.create({
      data: {
        startDate,
        endDate: endDate || null,
        description: body.description.trim(),
        websiteUrl: websiteUrlClean, // undefined | string | null
        type: typeConnect,
      },
      include: { type: true },
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

// PUT /projects/:id -> update (only not soft-deleted)
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};

  if (!id) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  const startDate =
    body.startDate !== undefined ? parseDate(body.startDate) : undefined;
  const endDate =
    body.endDate !== undefined
      ? body.endDate === null
        ? null
        : parseDate(body.endDate)
      : undefined;

  if (body.startDate !== undefined && !startDate) {
    return res.status(400).json({ error: "startDate must be a valid date" });
  }

  if (body.endDate !== undefined && body.endDate !== null && !endDate) {
    return res
      .status(400)
      .json({ error: "endDate must be a valid date (or null)" });
  }

  if (body.description !== undefined) {
    if (!isNonEmptyString(body.description)) {
      return res
        .status(400)
        .json({ error: "description must be a non-empty string" });
    }
  }

  const websiteUrlClean = cleanOptionalString(body.websiteUrl);
  if (body.websiteUrl !== undefined && websiteUrlClean === "INVALID") {
    return res
      .status(400)
      .json({ error: "websiteUrl must be a string (or null)" });
  }

  const hasTypeId = body.typeId !== undefined;
  const hasTypeName = body.typeName !== undefined;

  if (hasTypeId && hasTypeName) {
    return res.status(400).json({
      error: "Provide only one of typeId or typeName (not both)",
    });
  }

  const typeId = hasTypeId ? Number(body.typeId) : null;
  if (hasTypeId && !Number.isInteger(typeId)) {
    return res.status(400).json({ error: "typeId must be an integer" });
  }
  if (hasTypeName && !isNonEmptyString(body.typeName)) {
    return res
      .status(400)
      .json({ error: "typeName must be a non-empty string" });
  }

  try {
    // ensure project exists and NOT soft-deleted
    const existing = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, startDate: true, endDate: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    const finalStartDate =
      body.startDate !== undefined
        ? new Date(body.startDate)
        : existing.startDate;

    const finalEndDate =
      body.endDate === undefined
        ? existing.endDate
        : body.endDate === null
        ? null
        : new Date(body.endDate);

    if (finalEndDate && finalEndDate < finalStartDate) {
      return res.status(400).json({
        error: "endDate cannot be earlier than startDate",
      });
    }

    // If updating type, ensure type is not soft-deleted
    let typeUpdate = {};
    if (hasTypeId) {
      const t = await prisma.projectType.findFirst({
        where: { id: typeId, deletedAt: null },
        select: { id: true },
      });
      if (!t) {
        return res.status(400).json({ error: "Invalid typeId (not found)" });
      }
      typeUpdate = { type: { connect: { id: typeId } } };
    } else if (hasTypeName) {
      const t = await prisma.projectType.findFirst({
        where: { name: body.typeName.trim(), deletedAt: null },
        select: { id: true },
      });
      if (!t) {
        return res.status(400).json({ error: "Invalid typeName (not found)" });
      }
      typeUpdate = { type: { connect: { id: t.id } } };
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(startDate !== undefined ? { startDate } : {}),
        ...(body.endDate !== undefined ? { endDate } : {}),
        ...(body.description !== undefined
          ? { description: body.description.trim() }
          : {}),
        ...(body.websiteUrl !== undefined
          ? { websiteUrl: websiteUrlClean }
          : {}),
        ...typeUpdate,
      },
      include: { type: true },
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
      return res.status(404).json({ error: "Project not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /projects/:id -> SOFT delete
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  try {
    // only soft-delete if currently not deleted
    const existing = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.project.update({
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
