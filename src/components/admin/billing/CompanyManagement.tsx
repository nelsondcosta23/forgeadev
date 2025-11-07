import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, CreditCard } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Company {
  id: string;
  name: string;
  website: string;
  country_name: string;
  billing_email: string;
  credits: number;
  credits_used: number;
  cpc_default: number;
  status: boolean;
}

export const CompanyManagement = () => {
  const [open, setOpen] = useState(false);
  const [creditOpen, setCreditOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    country_code: "",
    country_name: "",
    billing_email: "",
    billing_address: "",
    tax_id: "",
    cpc_default: "0.05",
    daily_limit: "",
    low_balance_threshold: "100",
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Company[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("companies").insert([{
        ...data,
        cpc_default: parseFloat(data.cpc_default),
        daily_limit: data.daily_limit ? parseFloat(data.daily_limit) : null,
        low_balance_threshold: parseInt(data.low_balance_threshold),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa criada com sucesso!");
      setOpen(false);
      resetForm();
    },
    onError: () => toast.error("Erro ao criar empresa"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("companies")
        .update({
          ...data,
          cpc_default: parseFloat(data.cpc_default),
          daily_limit: data.daily_limit ? parseFloat(data.daily_limit) : null,
          low_balance_threshold: parseInt(data.low_balance_threshold),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada!");
      setOpen(false);
      setEditingCompany(null);
      resetForm();
    },
    onError: () => toast.error("Erro ao atualizar empresa"),
  });

  const addCreditMutation = useMutation({
    mutationFn: async ({ companyId, amount }: { companyId: string; amount: number }) => {
      const company = companies?.find(c => c.id === companyId);
      if (!company) throw new Error("Empresa não encontrada");

      const newBalance = company.credits + amount;

      // Atualizar créditos da empresa
      const { error: updateError } = await supabase
        .from("companies")
        .update({ credits: newBalance })
        .eq("id", companyId);
      
      if (updateError) throw updateError;

      // Registrar transação
      const { error: transError } = await supabase
        .from("credit_transactions")
        .insert([{
          company_id: companyId,
          type: "credit",
          amount,
          balance_after: newBalance,
          description: "Carregamento manual de créditos",
        }]);
      
      if (transError) throw transError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Créditos adicionados!");
      setCreditOpen(false);
      setCreditAmount("");
      setSelectedCompany(null);
    },
    onError: () => toast.error("Erro ao adicionar créditos"),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      website: "",
      country_code: "",
      country_name: "",
      billing_email: "",
      billing_address: "",
      tax_id: "",
      cpc_default: "0.05",
      daily_limit: "",
      low_balance_threshold: "100",
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      website: company.website,
      country_code: "",
      country_name: company.country_name,
      billing_email: company.billing_email,
      billing_address: "",
      tax_id: "",
      cpc_default: company.cpc_default.toString(),
      daily_limit: "",
      low_balance_threshold: "100",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddCredit = () => {
    if (!selectedCompany || !creditAmount) return;
    const amount = parseInt(creditAmount);
    if (amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    addCreditMutation.mutate({ companyId: selectedCompany.id, amount });
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Empresas Clientes</h3>
          <p className="text-sm text-muted-foreground">Gerir empresas e créditos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingCompany(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Website *</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>País *</Label>
                  <Input
                    value={formData.country_name}
                    onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Código País *</Label>
                  <Input
                    value={formData.country_code}
                    onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                    placeholder="PT"
                    required
                  />
                </div>
                <div>
                  <Label>Email Faturação *</Label>
                  <Input
                    type="email"
                    value={formData.billing_email}
                    onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>NIF</Label>
                  <Input
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CPC Padrão (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cpc_default}
                    onChange={(e) => setFormData({ ...formData, cpc_default: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Limite Diário (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.daily_limit}
                    onChange={(e) => setFormData({ ...formData, daily_limit: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Morada Faturação</Label>
                <Textarea
                  value={formData.billing_address}
                  onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCompany ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>País</TableHead>
            <TableHead>CPC</TableHead>
            <TableHead>Créditos</TableHead>
            <TableHead>Gastos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies?.map((company) => (
            <TableRow key={company.id}>
              <TableCell className="font-medium">{company.name}</TableCell>
              <TableCell>{company.website}</TableCell>
              <TableCell>{company.country_name}</TableCell>
              <TableCell>€{company.cpc_default.toFixed(4)}</TableCell>
              <TableCell>
                <Badge variant={company.credits < 100 ? "destructive" : "default"}>
                  {company.credits}
                </Badge>
              </TableCell>
              <TableCell>{company.credits_used}</TableCell>
              <TableCell>
                <Badge variant={company.status ? "default" : "secondary"}>
                  {company.status ? "Ativo" : "Pausado"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(company)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedCompany(company);
                      setCreditOpen(true);
                    }}
                  >
                    <CreditCard className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog de Adicionar Créditos */}
      <Dialog open={creditOpen} onOpenChange={setCreditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Créditos</DialogTitle>
          </DialogHeader>
          {selectedCompany && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-semibold">{selectedCompany.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo Atual</p>
                <p className="font-semibold">{selectedCompany.credits} créditos</p>
              </div>
              <div>
                <Label>Quantidade de Créditos</Label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreditOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCredit}>
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};