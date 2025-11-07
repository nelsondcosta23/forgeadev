import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, ExternalLink } from "lucide-react";

interface TrackedLink {
  id: string;
  company_id: string;
  short_code: string;
  destination_url: string;
  label: string | null;
  cpc_override: number | null;
  total_clicks: number;
  valid_clicks: number;
  invalid_clicks: number;
  total_cost: number;
  status: boolean;
}

interface Company {
  id: string;
  name: string;
}

export const LinkManagement = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    company_id: "",
    destination_url: "",
    label: "",
    cpc_override: "",
    short_code: "",
  });
  const queryClient = useQueryClient();

  const { data: companies } = useQuery({
    queryKey: ["companies-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .eq("status", true);
      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: links, isLoading } = useQuery({
    queryKey: ["tracked-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrackedLink[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const shortCode = data.short_code || generateShortCode();
      const { error } = await supabase.from("tracked_links").insert([{
        company_id: data.company_id,
        destination_url: data.destination_url,
        label: data.label || null,
        cpc_override: data.cpc_override ? parseFloat(data.cpc_override) : null,
        short_code: shortCode,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracked-links"] });
      toast.success("Link criado com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao criar link"),
  });

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const resetForm = () => {
    setFormData({
      company_id: "",
      destination_url: "",
      label: "",
      cpc_override: "",
      short_code: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const copyToClipboard = (shortCode: string) => {
    const url = `${window.location.origin}/l/${shortCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const getCompanyName = (companyId: string) => {
    return companies?.find(c => c.id === companyId)?.name || "N/A";
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Links Rastreáveis</h3>
          <p className="text-sm text-muted-foreground">Criar e gerir links de tracking</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Link Rastreável</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Empresa *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>URL de Destino *</Label>
                <Input
                  value={formData.destination_url}
                  onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                  placeholder="https://loja.com/produto"
                  required
                />
              </div>
              <div>
                <Label>Label (opcional)</Label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Ex: Produto X - Campanha Y"
                />
              </div>
              <div>
                <Label>CPC Personalizado (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cpc_override}
                  onChange={(e) => setFormData({ ...formData, cpc_override: e.target.value })}
                  placeholder="Deixar vazio para usar CPC padrão"
                />
              </div>
              <div>
                <Label>Código Curto (opcional)</Label>
                <Input
                  value={formData.short_code}
                  onChange={(e) => setFormData({ ...formData, short_code: e.target.value })}
                  placeholder="Gerado automaticamente se vazio"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Link</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Link Curto</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>CPC</TableHead>
            <TableHead>Cliques</TableHead>
            <TableHead>Custo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links?.map((link) => (
            <TableRow key={link.id}>
              <TableCell>{getCompanyName(link.company_id)}</TableCell>
              <TableCell>{link.label || "-"}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {link.short_code}
                </code>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {link.destination_url}
              </TableCell>
              <TableCell>
                {link.cpc_override 
                  ? `€${link.cpc_override.toFixed(4)}*` 
                  : "-"}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="text-sm">Total: {link.total_clicks}</div>
                  <div className="text-xs text-muted-foreground">
                    Válidos: {link.valid_clicks} | Inválidos: {link.invalid_clicks}
                  </div>
                </div>
              </TableCell>
              <TableCell>€{link.total_cost.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={link.status ? "default" : "secondary"}>
                  {link.status ? "Ativo" : "Pausado"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(link.short_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(link.destination_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};