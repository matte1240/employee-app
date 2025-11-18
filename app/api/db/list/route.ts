import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readdir, stat } from "fs/promises";
import path from "path";
import { isAdmin } from "@/lib/utils/user-utils";

export async function GET() {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || !isAdmin(session)) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const backupsDir = path.join(process.cwd(), "backups", "database");

    // Read directory contents
    const files = await readdir(backupsDir);

    // Filter SQL files and get their stats
    const backupFiles = await Promise.all(
      files
        .filter((file) => file.endsWith(".sql"))
        .map(async (file) => {
          const filePath = path.join(backupsDir, file);
          const stats = await stat(filePath);

          return {
            filename: file,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
          };
        })
    );

    // Sort by creation date (newest first)
    backupFiles.sort(
      (a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    );

    return NextResponse.json(
      {
        success: true,
        backups: backupFiles,
        count: backupFiles.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List backups error:", error);
    return NextResponse.json(
      {
        error: "Failed to list backups",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
