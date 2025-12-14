import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireAuth } from "@/lib/api-middleware";
import {
  successResponse,
  badRequestResponse,
  forbiddenResponse,
  handleError,
} from "@/lib/api-responses";

// Validate image file by checking magic bytes (file signature)
function validateImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 8) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return true;
  }

  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer.length > 11 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return true;
  }

  return false;
}

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

  // Validate file type (MIME)
  if (!file.type.startsWith("image/")) {
    return badRequestResponse("File must be an image");
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return badRequestResponse("File size too large (max 5MB)");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Validate magic bytes (file signature) for common image formats
  const isValidImage = validateImageMagicBytes(buffer);
  if (!isValidImage) {
    return badRequestResponse("Invalid image file");
  }
  // Sanitize filename or generate a new one to prevent directory traversal or overwrites
  const ext = path.extname(file.name);
  const filename = `${userId}-${Date.now()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public/uploads");
  const filePath = path.join(uploadDir, filename);

  try {
    console.log(`[Upload] Preparing to write to: ${uploadDir}`);
    console.log(`[Upload] File path: ${filePath}`);
    console.log(`[Upload] Buffer size: ${buffer.length}`);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);

    // Verify write
    const fs = require('fs');
    if (fs.existsSync(filePath)) {
      console.log(`[Upload] File successfully written: ${filePath}`);
      console.log(`[Upload] Directory contents:`, fs.readdirSync(uploadDir));
    } else {
      console.error(`[Upload] CRITICAL: File not found after write: ${filePath}`);
    }

    const imageUrl = `/uploads/${filename}`;

    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    });

    return successResponse({ imageUrl });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return handleError(error, "uploading file");
  }
}
