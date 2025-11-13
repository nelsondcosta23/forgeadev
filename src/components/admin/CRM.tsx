import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Building2, Search, Globe, ExternalLink, Filter, Plus, Pencil } from "lucide-react";
import { useState, useMemo } from "react";

interface StoreLink {
  id: string;
  country_code: string;
  country_name: string;
  store_name: string;
  store_url: string;
  status: boolean;
}

export const CRM = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
            <Button onClick={() => navigate("/admin/company/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
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
                          onClick={() => navigate(`/admin/company/edit/${company.id}`)}
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
