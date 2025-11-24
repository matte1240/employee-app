import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  forbiddenResponse,
  handleError,
} from "@/lib/api-responses";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id: userId } = await params;

  // Allow users to update their own image, or admins to update anyone's
  if (session.user.id !== userId && session.user.role !== "ADMIN") {
    return forbiddenResponse("Forbidden");
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return badRequestResponse("No file uploaded");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return badRequestResponse("File must be an image");
  }

  // Validate file size (e.g., 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return badRequestResponse("File size too large (max 5MB)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Sanitize filename or generate a new one to prevent directory traversal or overwrites
  const ext = path.extname(file.name);
  const filename = `${userId}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const filePath = path.join(uploadDir, filename);

  try {
    await writeFile(filePath, buffer);
    const imageUrl = `/uploads/${filename}`;

    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    return successResponse({ imageUrl });
  } catch (error) {
    return handleError(error, "uploading file");
  }
}
