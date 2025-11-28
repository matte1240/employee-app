"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { 
  ChevronDown, 
  AlertCircle, 
  Loader2, 
  Download,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmployeeReportsProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

export default function UserReports({
  userId,
  userName,
  userEmail,
}: EmployeeReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  });
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const response = await fetch("/api/export-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: selectedMonth,
          userIds: [userId],
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ore_lavoro_${userName.replace(/\s+/g, "_")}_${selectedMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || "Errore nell'esportazione");
      }
    } catch (err) {
      console.error("Error exporting:", err);
      setError("Errore nell'esportazione");
    } finally {
      setIsExporting(false);
    }
  };

  // Generate year/month options for picker
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 3;
  const endYear = currentYear + 3;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  const months = [
    "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
    "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
  ];

  const [pickerYear, pickerMonth] = selectedMonth.split("-").map(Number);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Month Selector */}
      <div className="mb-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            Seleziona mese:
          </label>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
              className="relative w-full sm:w-64 cursor-pointer rounded-lg border border-input bg-background py-3 pl-4 pr-10 text-left shadow-sm transition hover:bg-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <span className="block truncate font-medium text-foreground">
                {format(new Date(selectedMonth + "-15"), "MMMM yyyy", { locale: it })}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    isMonthPickerOpen && "rotate-180"
                  )}
                />
              </span>
            </button>

            {isMonthPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMonthPickerOpen(false)}
                />
                <div className="absolute z-20 mt-1 w-80 rounded-lg bg-popover p-4 shadow-lg ring-1 ring-black ring-opacity-5 border border-border animate-in fade-in zoom-in-95 duration-200">
                  {/* Year selector */}
                  <select
                    value={pickerYear}
                    onChange={(e) => {
                      const newMonth = `${e.target.value}-${String(pickerMonth).padStart(2, "0")}`;
                      setSelectedMonth(newMonth);
                      setIsMonthPickerOpen(false);
                    }}
                    className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, idx) => {
                      const monthNum = idx + 1;
                      const monthValue = `${pickerYear}-${String(monthNum).padStart(2, "0")}`;
                      const isSelected = monthValue === selectedMonth;

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMonth(monthValue);
                            setIsMonthPickerOpen(false);
                          }}
                          className={cn(
                            "rounded-md px-3 py-2 text-sm font-medium transition",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          )}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">{error}</span>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Esporta Report
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Scarica il report delle tue ore lavorate per {format(new Date(selectedMonth + "-15"), "MMMM yyyy", { locale: it })}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Esportazione...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Scarica Excel
              </>
            )}
          </button>
        </div>

        {/* User Info */}
        <div className="border-t border-border pt-4">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
              <dd className="mt-1 text-sm text-foreground">{userName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm text-foreground">{userEmail}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}