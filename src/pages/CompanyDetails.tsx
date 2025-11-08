import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Company {
  id: string;
  name: string;
  website: string;
  country_name: string;
  country_code: string;
  billing_email: string;
  billing_address: string | null;
  tax_id: string | null;
  credits: number;
  credits_used: number;
  cpc_default: number;
  daily_limit: number | null;
  low_balance_threshold: number;
  status: boolean;
}

interface CreditTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface LinkMetrics {
  id: string;
  label: string | null;
  destination_url: string;
  total_clicks: number;
  valid_clicks: number;
  invalid_clicks: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

const CompanyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Empresa não encontrada");
      return data as Company;
    },
    enabled: !!id,
  });

  // Fetch credit transactions
  const { data: transactions } = useQuery({
    queryKey: ["credit-transactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("company_id", id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as CreditTransaction[];
    },
    enabled: !!id,
  });

  // Fetch link metrics
  const { data: linkMetrics } = useQuery({
    queryKey: ["link-metrics", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tracked_links")
        .select("*")
        .eq("company_id", id)
        .order("total_clicks", { ascending: false });
      if (error) throw error;
      return data as LinkMetrics[];
    },
    enabled: !!id,
  });

  // Update form when company data loads
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        website: company.website,
        country_code: company.country_code,
        country_name: company.country_name,
        billing_email: company.billing_email,
        billing_address: company.billing_address || "",
        tax_id: company.tax_id || "",
        cpc_default: company.cpc_default.toString(),
        daily_limit: company.daily_limit?.toString() || "",
        low_balance_threshold: company.low_balance_threshold.toString(),
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
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
      queryClient.invalidateQueries({ queryKey: ["company", id] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar empresa"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Empresa não encontrada</p>
          <Button onClick={() => navigate("/admin")} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{company.name}</h1>
                <p className="text-sm text-muted-foreground">{company.website}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={company.status ? "default" : "secondary"}>
                {company.status ? "Ativo" : "Pausado"}
              </Badge>
              <Badge variant={company.credits < company.low_balance_threshold ? "destructive" : "default"}>
                {company.credits} créditos
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
            <TabsTrigger value="creditos">Créditos</TabsTrigger>
            <TabsTrigger value="metricas">Métricas de Links</TabsTrigger>
          </TabsList>

          {/* Tab 1: Company Data */}
          <TabsContent value="dados" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>Gerir dados e configurações da empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome da Empresa *</Label>
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
                      <Label>Código do País *</Label>
                      <Input
                        value={formData.country_code}
                        onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                        placeholder="PT"
                        maxLength={2}
                        required
                      />
                    </div>
                    <div>
                      <Label>Email de Faturação *</Label>
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
                        step="0.0001"
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
                    <div>
                      <Label>Limite de Saldo Baixo</Label>
                      <Input
                        type="number"
                        value={formData.low_balance_threshold}
                        onChange={(e) => setFormData({ ...formData, low_balance_threshold: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Morada de Faturação</Label>
                    <Textarea
                      value={formData.billing_address}
                      onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Guardar Alterações
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Credits and Transactions */}
          <TabsContent value="creditos" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Créditos Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{company.credits}</div>
                  <p className="text-sm text-muted-foreground mt-1">créditos restantes</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Créditos Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{company.credits_used}</div>
                  <p className="text-sm text-muted-foreground mt-1">total utilizado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Taxa de Utilização</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {company.credits + company.credits_used > 0
                      ? Math.round((company.credits_used / (company.credits + company.credits_used)) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">do total</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Transações</CardTitle>
                <CardDescription>Últimas 50 transações de créditos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Saldo Após</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!transactions || transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Sem transações registadas
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                            <TableCell>
                              <Badge variant={transaction.type === "credit" ? "default" : "destructive"}>
                                {transaction.type === "credit" ? "Crédito" : "Débito"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {transaction.description || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {transaction.balance_after}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Link Metrics */}
          <TabsContent value="metricas" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total de Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{linkMetrics?.length || 0}</div>
                  <p className="text-sm text-muted-foreground mt-1">links ativos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total de Cliques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {linkMetrics?.reduce((sum, link) => sum + link.total_clicks, 0) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">todos os links</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Cliques Válidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {linkMetrics?.reduce((sum, link) => sum + link.valid_clicks, 0) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">aprovados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    €{linkMetrics?.reduce((sum, link) => sum + parseFloat(link.total_cost.toString()), 0).toFixed(2) || "0.00"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">gasto acumulado</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Link</CardTitle>
                <CardDescription>Estatísticas detalhadas de cada link</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label/Destino</TableHead>
                        <TableHead className="text-right">Total Cliques</TableHead>
                        <TableHead className="text-right">Válidos</TableHead>
                        <TableHead className="text-right">Inválidos</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead>Último Clique</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!linkMetrics || linkMetrics.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Sem links registados para esta empresa
                          </TableCell>
                        </TableRow>
                      ) : (
                        linkMetrics.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell>
                              <div>
                                {link.label && <div className="font-medium">{link.label}</div>}
                                <div className="text-sm text-muted-foreground truncate max-w-md">
                                  {link.destination_url}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {link.total_clicks}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {link.valid_clicks}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {link.invalid_clicks}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              €{parseFloat(link.total_cost.toString()).toFixed(4)}
                            </TableCell>
                            <TableCell>
                              {format(new Date(link.updated_at), "dd/MM/yyyy HH:mm")}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CompanyDetails;
