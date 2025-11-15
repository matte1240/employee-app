import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.sql`;
    
    // Ensure backups directory exists
    const fs = require("fs");
    const backupsDir = path.join(process.cwd(), "backups", "database");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const backupPath = path.join(backupsDir, filename);

    // Get database URL from environment and clean it
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Remove query parameters that pg_dump doesn't support
    const cleanUrl = databaseUrl.split('?')[0];

    // Use pg_dump with connection string (format: plain SQL)
    const command = `pg_dump "${cleanUrl}" -F p -b -v -f "${backupPath}"`;

    console.log("Executing backup command");
    const { stdout, stderr } = await execAsync(command);    if (stderr && !stderr.includes("successfully")) {
      console.error("Backup stderr:", stderr);
    }

    return NextResponse.json(
      {
        success: true,
        filename,
        message: "Database backup created successfully",
        path: backupPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      {
        error: "Failed to create backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename parameter required" },
        { status: 400 }
      );
    }

    // Security check: prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const backupPath = path.join(
      process.cwd(),
      "backups",
      "database",
      sanitizedFilename
    );

    const fs = require("fs").promises;
    const fileBuffer = await fs.readFile(backupPath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${sanitizedFilename}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      {
        error: "Failed to download backup",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
