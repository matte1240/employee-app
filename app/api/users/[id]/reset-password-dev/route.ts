import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Schema di validazione per il reset password (versione DEV con password manuale)
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "La password deve contenere almeno 8 caratteri"),
});

/**
 * POST /api/users/[id]/reset-password-dev
 * Reimposta la password di un utente con password manuale (modalità DEV - nessuna email inviata)
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verifica autenticazione
    const session = await getAuthSession();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { id } = await context.params;

    // Parse e validazione dati in arrivo
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newPassword } = parsed.data;

    // Verifica che l'utente esista
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utente non trovato" },
        { status: 404 }
      );
    }

    // Hash della nuova password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Aggiorna la password nel database
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Password reimpostata in modalità DEV per: ${user.email}`);

    return NextResponse.json({
      message: "Password reimpostata con successo",
    });
  } catch (error) {
    console.error("❌ Errore nel reset password (DEV):", error);
    return NextResponse.json(
      { error: "Errore nella reimpostazione della password" },
      { status: 500 }
    );
  }
}
