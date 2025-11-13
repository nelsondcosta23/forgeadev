import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Globe, ExternalLink } from "lucide-react";
import { useState } from "react";

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

  const filteredCompanies = companies?.filter((company) => {
    const search = searchTerm.toLowerCase();
    return (
      company.store_name.toLowerCase().includes(search) ||
      company.country_name.toLowerCase().includes(search)
    );
  });

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
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por empresa ou país..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies?.map((company) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
