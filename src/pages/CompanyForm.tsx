import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Building2, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const companySchema = z.object({
  store_name: z.string().trim().min(1, "Nome da empresa é obrigatório").max(255),
  country_name: z.string().trim().min(1, "Nome do país é obrigatório").max(255),
  country_code: z.string().trim().length(2, "Código do país deve ter 2 caracteres").toUpperCase(),
  store_url: z.string().trim().url("URL inválida").max(500),
  status: z.boolean(),
});

const CompanyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    store_name: "",
    country_name: "",
    country_code: "",
    store_url: "",
    status: true,
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("country_store_links")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        store_name: company.store_name,
        country_name: company.country_name,
        country_code: company.country_code,
        store_url: company.store_url,
        status: company.status,
      });
    }
  }, [company]);

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
      toast({ title: "Empresa criada com sucesso" });
      navigate("/admin");
    },
    onError: (error) => {
      toast({ title: "Erro ao criar empresa", description: error.message, variant: "destructive" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof companySchema>) => {
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
      toast({ title: "Empresa atualizada com sucesso" });
      navigate("/admin");
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar empresa", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = companySchema.parse(formData);
      
      if (isEditing) {
        updateCompanyMutation.mutate(validatedData);
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

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao CRM
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>
                {isEditing ? "Editar Empresa" : "Nova Empresa"}
              </CardTitle>
              <CardDescription>
                {isEditing 
                  ? "Atualize as informações da empresa parceira" 
                  : "Adicione uma nova empresa parceira do Selling"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="country_name">País *</Label>
                <Input
                  id="country_name"
                  value={formData.country_name}
                  onChange={(e) => setFormData({ ...formData, country_name: e.target.value })}
                  placeholder="Ex: Portugal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country_code">Código do País *</Label>
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

            <div className="space-y-2">
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="status">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Empresa ativa no sistema
                </p>
              </div>
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending || updateCompanyMutation.isPending
                  ? "Guardando..."
                  : isEditing ? "Atualizar Empresa" : "Criar Empresa"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyForm;
