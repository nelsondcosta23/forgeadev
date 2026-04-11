import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, Database, CheckCircle } from "lucide-react";

const TABLES = [
  "quiz_sessions",
  "quiz_responses",
  "ai_recommendations",
  "analytics_events",
  "analytics_sessions",
  "country_store_links",
  "admin_prompts",
  "admin_roadmap",
  "tracked_links",
  "credit_transactions",
  "user_roles",
] as const;

type TableName = typeof TABLES[number];

export const DatabaseBackup = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<Record<string, "pending" | "loading" | "done" | "error">>({});

  const fetchAllRows = async (table: TableName) => {
    const allRows: any[] = [];
    const pageSize = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .range(from, from + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allRows.push(...data);
        from += pageSize;
        if (data.length < pageSize) hasMore = false;
      }
    }
    return allRows;
  };

  const handleFullBackup = async () => {
    setIsExporting(true);
    const progress: Record<string, "pending" | "loading" | "done" | "error"> = {};
    TABLES.forEach((t) => (progress[t] = "pending"));
    setExportProgress({ ...progress });

    const backup: Record<string, any> = {
      _meta: {
        exported_at: new Date().toISOString(),
        tables: [...TABLES],
      },
    };

    for (const table of TABLES) {
      try {
        progress[table] = "loading";
        setExportProgress({ ...progress });

        const data = await fetchAllRows(table);
        backup[table] = { count: data.length, rows: data };

        progress[table] = "done";
        setExportProgress({ ...progress });
      } catch (err) {
        console.error(`Error exporting ${table}:`, err);
        progress[table] = "error";
        setExportProgress({ ...progress });
        backup[table] = { count: 0, rows: [], error: String(err) };
      }
    }

    // Download JSON
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgea-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Backup completo exportado com sucesso!");
    setIsExporting(false);
  };

  const handleSingleTable = async (table: TableName) => {
    try {
      setExportProgress((prev) => ({ ...prev, [table]: "loading" }));
      const data = await fetchAllRows(table);

      const blob = new Blob([JSON.stringify({ table, count: data.length, exported_at: new Date().toISOString(), rows: data }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forgea-${table}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress((prev) => ({ ...prev, [table]: "done" }));
      toast.success(`Tabela ${table} exportada (${data.length} registos)`);
    } catch (err) {
      console.error(`Error exporting ${table}:`, err);
      setExportProgress((prev) => ({ ...prev, [table]: "error" }));
      toast.error(`Erro ao exportar ${table}`);
    }
  };

  const statusIcon = (status?: string) => {
    if (status === "loading") return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
    if (status === "done") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "error") return <span className="text-destructive text-xs">Erro</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup Completo
          </CardTitle>
          <CardDescription>
            Exporta todas as tabelas da base de dados num único ficheiro JSON.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleFullBackup} disabled={isExporting} size="lg">
            {isExporting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> A exportar...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Exportar Tudo</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tabelas Individuais</CardTitle>
          <CardDescription>Exporta cada tabela separadamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TABLES.map((table) => (
              <Button
                key={table}
                variant="outline"
                className="justify-between"
                disabled={isExporting}
                onClick={() => handleSingleTable(table)}
              >
                <span className="truncate">{table}</span>
                {statusIcon(exportProgress[table])}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
