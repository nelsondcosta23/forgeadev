import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Search, Globe, ExternalLink, Filter, Plus, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { CompanyClicksTab } from "./CompanyClicksTab";

const companySchema = z.object({
  store_name: z.string().trim().min(1, "Nome da empresa é obrigatório").max(255),
  country_name: z.string().trim().min(1, "Nome do país é obrigatório").max(255),
  country_code: z.string().trim().length(2, "Código do país deve ter 2 caracteres").toUpperCase(),
  store_url: z.string().trim().url("URL inválida").max(500),
  status: z.boolean(),
});

interface StoreLink {
  id: string;
  country_code: string;
  country_name: string;
  store_name: string;
  store_url: string;
  status: boolean;
}

export const CRM = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<StoreLink | null>(null);
  const [formData, setFormData] = useState({
    store_name: "",
    country_name: "",
    country_code: "",
    store_url: "",
    status: true,
  });

  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ["crm-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("country_store_links")
        .select("*")
        .order("country_name", { ascending: true });
      
      if (error) throw error;
      return data as StoreLink[];
    },
  });

  const uniqueCountries = useMemo(() => {
    if (!companies) return [];
    const countries = [...new Set(companies.map(c => c.country_name))];
    return countries.sort();
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies?.filter((company) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        company.store_name.toLowerCase().includes(search) ||
        company.country_name.toLowerCase().includes(search) ||
        company.store_url.toLowerCase().includes(search);
      
      const matchesCountry = countryFilter === "all" || company.country_name === countryFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && company.status) ||
        (statusFilter === "inactive" && !company.status);

      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [companies, searchTerm, countryFilter, statusFilter]);

  const totalPages = Math.ceil((filteredCompanies?.length || 0) / itemsPerPage);
  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCompanies?.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
      const { error } = await supabase
        .from("country_store_links")
        .insert([{
          store_name: data.store_name,
          country_name: data.country_name,
          country_code: data.country_code,
          store_url: data.store_url,
          status: data.status,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Empresa criada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof companySchema> }) => {
      const { error } = await supabase
        .from("country_store_links")
        .update({
          store_name: data.store_name,
          country_name: data.country_name,
          country_code: data.country_code,
          store_url: data.store_url,
          status: data.status,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Empresa atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      store_name: "",
      country_name: "",
      country_code: "",
      store_url: "",
      status: true,
    });
    setEditingCompany(null);
  };

  const handleOpenDialog = (company?: StoreLink) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        store_name: company.store_name,
        country_name: company.country_name,
        country_code: company.country_code,
        store_url: company.store_url,
        status: company.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = companySchema.parse(formData);
      
      if (editingCompany) {
        updateCompanyMutation.mutate({ id: editingCompany.id, data: validatedData });
      } else {
        createCompanyMutation.mutate(validatedData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Customer Relationship Management</CardTitle>
                <CardDescription>
                  Gestão detalhada das empresas parceiras do Selling
                </CardDescription>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompany ? "Editar Empresa" : "Nova Empresa"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCompany 
                        ? "Atualize as informações da empresa" 
                        : "Adicione uma nova empresa parceira do Selling"}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="dados" className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="dados">Dados da Empresa</TabsTrigger>
                      <TabsTrigger value="clicks" disabled={!editingCompany}>Clicks</TabsTrigger>
                      <TabsTrigger value="billing" disabled={!editingCompany}>Billing</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="dados" className="space-y-4 mt-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="store_name">Nome da Empresa *</Label>
                          <Input
                            id="store_name"
                            value={formData.store_name}
                            onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                            placeholder="Ex: Amazon Portugal"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="country_name">País *</Label>
                            <Input
                              id="country_name"
                              value={formData.country_name}
                              onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                              placeholder="Ex: Portugal"
                              required
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="country_code">Código *</Label>
                            <Input
                              id="country_code"
                              value={formData.country_code}
                              onChange={(e) => setFormData({ ...formData, country_code: e.target.value.toUpperCase() })}
                              placeholder="PT"
                              maxLength={2}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="store_url">URL da Loja *</Label>
                          <Input
                            id="store_url"
                            type="url"
                            value={formData.store_url}
                            onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
                            placeholder="https://www.amazon.pt"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center justify-between border-t pt-4">
                          <Label htmlFor="status">Status Ativo</Label>
                          <Switch
                            id="status"
                            checked={formData.status}
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="clicks" className="mt-4">
                      {editingCompany && <CompanyClicksTab companyId={editingCompany.id} />}
                    </TabsContent>
                    
                    <TabsContent value="billing" className="mt-4">
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Em Construção</h3>
                        <p className="text-sm text-muted-foreground">
                          A área de faturação estará disponível em breve
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <DialogFooter className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                    >
                      {editingCompany ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por empresa, país ou URL..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={countryFilter} onValueChange={(value) => {
                setCountryFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os países</SelectItem>
                  {uniqueCountries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Companies Table */}
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Carregando...</p>
          ) : filteredCompanies?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma empresa encontrada</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies?.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{company.store_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{company.country_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a
                          href={company.store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <span className="truncate max-w-xs">{company.store_url}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.status ? "default" : "secondary"}>
                          {company.status ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {filteredCompanies && filteredCompanies.length > itemsPerPage && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCompanies.length)} de {filteredCompanies.length} empresas
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
