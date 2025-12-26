import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: { emails: true, phones: true },
    });

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { emails: true, phones: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const body = req.body;

  // basic validation
  if (!body || typeof body.name !== "string") {
    return res.status(400).json({
      error: "name is required and must be a string",
    });
  }

  if (body.emails && !Array.isArray(body.emails)) {
    return res.status(400).json({
      error: "emails must be an array of strings",
    });
  }

  if (body.phones && !Array.isArray(body.phones)) {
    return res.status(400).json({
      error: "phones must be an array of strings",
    });
  }

  const emails = (body.emails || []).filter(
    (e) => typeof e === "string" && e.trim() !== ""
  );

  const phones = (body.phones || []).filter(
    (p) => typeof p === "string" && p.trim() !== ""
  );

  try {
    const createdUser = await prisma.user.create({
      data: {
        name: body.name.trim(),

        emails: emails.length
          ? { create: emails.map((email) => ({ email })) }
          : undefined,

        phones: phones.length
          ? { create: phones.map((phone) => ({ phone })) }
          : undefined,
      },
      include: {
        emails: true,
        phones: true,
      },
    });

    res.status(201).json(createdUser);
  } catch (err) {
    // Prisma unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "Unique constraint failed",
        fields: err.meta && err.meta.target,
      });
    }

    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, emails, phones } = req.body || {};

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  // validate inputs (all optional)
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ error: "name must be a non-empty string" });
  }
  if (emails !== undefined && !Array.isArray(emails)) {
    return res
      .status(400)
      .json({ error: "emails must be an array of strings" });
  }
  if (phones !== undefined && !Array.isArray(phones)) {
    return res
      .status(400)
      .json({ error: "phones must be an array of strings" });
  }

  const cleanEmails = emails
    ? [
        ...new Set(
          emails
            .filter((e) => typeof e === "string" && e.trim())
            .map((e) => e.trim())
        ),
      ]
    : null;

  const cleanPhones = phones
    ? [
        ...new Set(
          phones
            .filter((p) => typeof p === "string" && p.trim())
            .map((p) => p.trim())
        ),
      ]
    : null;

  try {
    // ensure user exists and is NOT soft-deleted
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    // replace relations if provided
    if (cleanEmails !== null) {
      await prisma.email.deleteMany({ where: { userId: id } });
    }
    if (cleanPhones !== null) {
      await prisma.phone.deleteMany({ where: { userId: id } });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(cleanEmails !== null
          ? { emails: { create: cleanEmails.map((email) => ({ email })) } }
          : {}),
        ...(cleanPhones !== null
          ? { phones: { create: cleanPhones.map((phone) => ({ phone })) } }
          : {}),
      },
      include: { emails: true, phones: true },
    });

    return res.json(updatedUser);
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

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.status(204).send();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
