import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
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

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!file.name.endsWith(".sql")) {
      return NextResponse.json(
        { error: "Invalid file type. Only .sql files are allowed" },
        { status: 400 }
      );
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `restore-${Date.now()}.sql`;
    
    // Ensure backups directory exists
    const fs = require("fs");
    const backupsDir = path.join(process.cwd(), "backups", "database");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    const tempPath = path.join(backupsDir, filename);

    await writeFile(tempPath, buffer);

    try {
      // Get database URL from environment and clean it
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL not configured");
      }

      // Remove query parameters that psql doesn't support
      const cleanUrl = databaseUrl.split('?')[0];

      // Extract username from URL for GRANT statement
      const urlParts = cleanUrl.split('//')[1]?.split('@');
      const username = urlParts?.[0]?.split(':')[0] || 'postgres';

      // First, drop all tables to ensure clean restore
      console.log("Dropping existing tables...");
      const dropCommand = `psql "${cleanUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ${username}; GRANT ALL ON SCHEMA public TO public;"`;
      
      try {
        await execAsync(dropCommand);
      } catch (dropError) {
        console.error("Error dropping schema:", dropError);
        // Continue anyway, the restore might still work
      }

      // Execute psql to restore the SQL dump (plain format)
      // Using --single-transaction for safety (rollback on error)
      const command = `psql "${cleanUrl}" -f "${tempPath}" --single-transaction`;

      console.log("Executing restore command");
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large restores
      });

      // pg_restore often writes informational messages to stderr
      if (stderr) {
        console.log("Restore stderr (may include normal output):", stderr);
      }

      // Clean up temporary file
      await unlink(tempPath);

      return NextResponse.json(
        {
          success: true,
          message: "Database restored successfully",
          filename: file.name,
        },
        { status: 200 }
      );
    } catch (execError) {
      // Clean up temporary file on error
      try {
        await unlink(tempPath);
      } catch {}

      throw execError;
    }
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      {
        error: "Failed to restore database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
