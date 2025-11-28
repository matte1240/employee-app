import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Download a Blob as a file in the browser
 * @param blob - The Blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Handle API response errors consistently
 * Redirects to home on 401, otherwise returns error message
 * @param response - The fetch Response object
 * @param router - Next.js App Router instance (optional, for 401 redirect)
 * @returns Error message string or null if successful
 */
export async function handleApiError(
  response: Response,
  router?: AppRouterInstance
): Promise<string | null> {
  if (response.ok) return null;

  // Handle unauthorized - redirect to login
  if (response.status === 401) {
    if (router) {
      router.push("/");
    }
    return "Sessione scaduta. Effettua nuovamente il login.";
  }

  // Handle forbidden
  if (response.status === 403) {
    return "Non hai i permessi per eseguire questa operazione.";
  }

  // Handle not found
  if (response.status === 404) {
    return "Risorsa non trovata.";
  }

  // Try to parse error message from response
  try {
    const data = await response.json();
    return data.error || data.message || `Errore ${response.status}`;
  } catch {
    return `Errore ${response.status}: ${response.statusText}`;
  }
}
