import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { findUserByEmail, isAdmin } from "@/lib/user-utils";

// Schema di validazione per la creazione utente (versione DEV con password manuale)
const createUserSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "La password deve contenere almeno 8 caratteri"),
  role: z.enum(["EMPLOYEE", "ADMIN"]),
});

/**
 * POST /api/users/create-dev
 * Crea un nuovo utente con password manuale (modalità DEV - nessuna email inviata)
 */
export async function POST(request: Request) {
  try {
    // Guard: DEV endpoint only accessible in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verifica autenticazione
    const session = await getAuthSession();
    if (!session || !isAdmin(session)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    // Parse e validazione dati in arrivo
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Verifica che l'email non esista già
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "Email già registrata" },
        { status: 400 }
      );
    }

    // Hash della password
    const passwordHash = await bcrypt.hash(password, 10);

    // Crea l'utente nel database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`✅ Utente creato in modalità DEV: ${email}`);

    return NextResponse.json(
      {
        message: "Utente creato con successo",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Errore nella creazione utente (DEV):", error);
    return NextResponse.json(
      { error: "Errore nella creazione dell'utente" },
      { status: 500 }
    );
  }
}
