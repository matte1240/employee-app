import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: userId } = await params;

  // Allow users to update their own image, or admins to update anyone's
  if (session.user.id !== userId && session.user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }

  // Validate file size (e.g., 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File size too large (max 5MB)" }, { status: 400 });
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

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 });
  }
}
