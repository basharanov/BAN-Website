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
function parseYear(v) {
  const y = Number(v);
  return Number.isInteger(y) ? y : null;
}
function cleanOptionalString(v) {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== "string") return "INVALID";
  const t = v.trim();
  return t === "" ? null : t;
}
function isValidAuthorsArray(authors) {
  // authors: [{ authorId: number, order?: number }]
  if (!Array.isArray(authors)) return false;
  if (authors.length === 0) return true; // allow empty
  return authors.every((a) => {
    const id = Number(a?.authorId);
    const order = a?.order === undefined ? undefined : Number(a.order);
    if (!Number.isInteger(id)) return false;
    if (order !== undefined && !Number.isInteger(order)) return false;
    return true;
  });
}

const publicationInclude = {
  type: true,
  authors: {
    where: { deletedAt: null },
    orderBy: { order: "asc" },
    include: {
      author: true,
    },
  },
};

// GET /publications -> list
router.get("/", async (_req, res) => {
  try {
    const pubs = await prisma.publication.findMany({
      where: { deletedAt: null },
      include: publicationInclude,
      orderBy: [{ year: "desc" }, { id: "desc" }],
    });

    return res.json(pubs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /publications/by-type/:typeId -> list publications by type (only not soft-deleted)
router.get("/by-type/:typeId", async (req, res) => {
  const typeId = Number(req.params.typeId);

  if (!Number.isInteger(typeId)) {
    return res.status(400).json({ error: "Invalid type id" });
  }

  try {
    // ensure type exists and not soft-deleted
    const typeExists = await prisma.publicationType.findFirst({
      where: { id: typeId, deletedAt: null },
      select: { id: true },
    });

    if (!typeExists) {
      return res.status(404).json({ error: "Publication type not found" });
    }

    const pubs = await prisma.publication.findMany({
      where: { deletedAt: null, typeId },
      include: publicationInclude, // ако ползваш същия include helper
      orderBy: [{ year: "desc" }, { id: "desc" }],
    });

    return res.json(pubs);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /publications/:id -> single
router.get("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid publication id" });

  try {
    const pub = await prisma.publication.findFirst({
      where: { id, deletedAt: null },
      include: publicationInclude,
    });

    if (!pub) return res.status(404).json({ error: "Publication not found" });
    return res.json(pub);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /publications -> create
// Body:
// {
//   "year": 2025,
//   "title": "...",
//   "description": "...", (optional)
//   "typeId": 1,
//   "authors": [ { "authorId": 10, "order": 1 }, { "authorId": 12, "order": 2 } ] (optional)
// }
router.post("/", async (req, res) => {
  const body = req.body || {};

  const year = parseYear(body.year);
  if (!year)
    return res
      .status(400)
      .json({ error: "year is required and must be an integer" });

  if (!isNonEmptyString(body.title)) {
    return res
      .status(400)
      .json({ error: "title is required and must be a non-empty string" });
  }

  const descriptionClean = cleanOptionalString(body.description);
  if (descriptionClean === "INVALID") {
    return res
      .status(400)
      .json({ error: "description must be a string (or null / omit)" });
  }

  const typeId = Number(body.typeId);
  if (!Number.isInteger(typeId)) {
    return res
      .status(400)
      .json({ error: "typeId is required and must be an integer" });
  }

  if (body.authors !== undefined && !isValidAuthorsArray(body.authors)) {
    return res.status(400).json({
      error: "authors must be an array of { authorId: int, order?: int }",
    });
  }

  const authors = Array.isArray(body.authors) ? body.authors : [];

  // ако order не е подаден -> подреждаме по реда в масива
  const authorsWithOrder = authors.map((a, idx) => ({
    authorId: Number(a.authorId),
    order: Number.isInteger(Number(a.order)) ? Number(a.order) : idx + 1,
  }));

  try {
    // type must exist & not soft-deleted
    const typeExists = await prisma.publicationType.findFirst({
      where: { id: typeId, deletedAt: null },
      select: { id: true },
    });
    if (!typeExists)
      return res.status(400).json({ error: "Invalid typeId (not found)" });

    // validate authors exist & not soft-deleted
    if (authorsWithOrder.length > 0) {
      const ids = [...new Set(authorsWithOrder.map((a) => a.authorId))];
      const found = await prisma.author.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== ids.length) {
        return res
          .status(400)
          .json({ error: "One or more authorId are invalid (not found)" });
      }
    }

    const created = await prisma.publication.create({
      data: {
        year,
        title: body.title.trim(),
        description: descriptionClean,
        type: { connect: { id: typeId } },
        authors: {
          create: authorsWithOrder.map((a) => ({
            author: { connect: { id: a.authorId } },
            order: a.order,
          })),
        },
      },
      include: publicationInclude,
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

// PUT /publications/:id -> update
// Позволява частичен update.
// Ако подадеш "authors": [...] -> ще замени списъка автори (soft-delete старите връзки и създава нови)
router.put("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  const body = req.body || {};

  if (!id) return res.status(400).json({ error: "Invalid publication id" });

  const year = body.year !== undefined ? parseYear(body.year) : undefined;
  if (body.year !== undefined && !year) {
    return res.status(400).json({ error: "year must be an integer" });
  }

  if (body.title !== undefined && !isNonEmptyString(body.title)) {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }

  const descriptionClean = cleanOptionalString(body.description);
  if (body.description !== undefined && descriptionClean === "INVALID") {
    return res
      .status(400)
      .json({ error: "description must be a string (or null)" });
  }

  const typeId = body.typeId !== undefined ? Number(body.typeId) : undefined;
  if (body.typeId !== undefined && !Number.isInteger(typeId)) {
    return res.status(400).json({ error: "typeId must be an integer" });
  }

  if (body.authors !== undefined && !isValidAuthorsArray(body.authors)) {
    return res.status(400).json({
      error: "authors must be an array of { authorId: int, order?: int }",
    });
  }

  const authors = Array.isArray(body.authors) ? body.authors : null;
  const authorsWithOrder =
    authors === null
      ? null
      : authors.map((a, idx) => ({
          authorId: Number(a.authorId),
          order: Number.isInteger(Number(a.order)) ? Number(a.order) : idx + 1,
        }));

  try {
    const existing = await prisma.publication.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing)
      return res.status(404).json({ error: "Publication not found" });

    // if updating type -> ensure exists & not soft-deleted
    if (typeId !== undefined) {
      const t = await prisma.publicationType.findFirst({
        where: { id: typeId, deletedAt: null },
        select: { id: true },
      });
      if (!t)
        return res.status(400).json({ error: "Invalid typeId (not found)" });
    }

    // if replacing authors -> validate ids exist & not soft-deleted
    if (authorsWithOrder && authorsWithOrder.length > 0) {
      const ids = [...new Set(authorsWithOrder.map((a) => a.authorId))];
      const found = await prisma.author.findMany({
        where: { id: { in: ids }, deletedAt: null },
        select: { id: true },
      });
      if (found.length !== ids.length) {
        return res
          .status(400)
          .json({ error: "One or more authorId are invalid (not found)" });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // replace author links if provided
      if (authorsWithOrder !== null) {
        // soft-delete old links
        await tx.publicationAuthor.updateMany({
          where: { publicationId: id, deletedAt: null },
          data: { deletedAt: new Date() },
        });

        // create new links (even if empty array -> removes all)
        if (authorsWithOrder.length > 0) {
          await tx.publicationAuthor.createMany({
            data: authorsWithOrder.map((a) => ({
              publicationId: id,
              authorId: a.authorId,
              order: a.order,
            })),
          });
        }
      }

      // update main publication
      await tx.publication.update({
        where: { id },
        data: {
          ...(year !== undefined ? { year } : {}),
          ...(body.title !== undefined ? { title: body.title.trim() } : {}),
          ...(body.description !== undefined
            ? { description: descriptionClean }
            : {}),
          ...(typeId !== undefined ? { typeId } : {}),
        },
      });

      // return full object
      return tx.publication.findFirst({
        where: { id, deletedAt: null },
        include: publicationInclude,
      });
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
      return res.status(404).json({ error: "Publication not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /publications/:id -> soft delete
router.delete("/:id", async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid publication id" });

  try {
    const existing = await prisma.publication.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!existing)
      return res.status(404).json({ error: "Publication not found" });

    await prisma.$transaction(async (tx) => {
      await tx.publication.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // по желание: soft-delete и връзките
      await tx.publicationAuthor.updateMany({
        where: { publicationId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    });

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
