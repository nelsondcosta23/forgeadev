import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Database, Activity, Trash2, Search, Globe, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface QuizSession {
  id: string;
  session_id: string;
  started_at: string;
  completed_at: string | null;
  country_name: string | null;
  country_code: string | null;
}

interface CountryStats {
  country_name: string;
  country_code: string;
  count: number;
}

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [completedQuizzes, setCompletedQuizzes] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated in this session
    const adminAuth = sessionStorage.getItem("admin_authenticated");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizData();
    }
  }, [isAuthenticated]);

  const fetchQuizData = async () => {
    setIsLoading(true);
    try {
      // Fetch all quiz sessions
      const { data: sessions, error } = await supabase
        .from("quiz_sessions")
        .select("*")
        .order("started_at", { ascending: false });

      if (error) throw error;

      setQuizSessions(sessions || []);
      setTotalQuizzes(sessions?.length || 0);
      setCompletedQuizzes(
        sessions?.filter((s) => s.completed_at !== null).length || 0
      );

      // Calculate country stats
      const stats: { [key: string]: CountryStats } = {};
      sessions?.forEach((session) => {
        const country = session.country_name || "Unknown";
        const code = session.country_code || "XX";
        if (!stats[country]) {
          stats[country] = { country_name: country, country_code: code, count: 0 };
        }
        stats[country].count++;
      });

      setCountryStats(Object.values(stats).sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem("admin_authenticated", "true");
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    setIsAuthenticated(false);
  };

  const handleDeleteQuiz = async (sessionId: string) => {
    if (!confirm("Tem certeza que deseja deletar este quiz?")) return;

    try {
      // Delete responses first (foreign key constraint)
      const { error: responsesError } = await supabase
        .from("quiz_responses")
        .delete()
        .eq("session_id", sessionId);

      if (responsesError) throw responsesError;

      // Delete session
      const { error: sessionError } = await supabase
        .from("quiz_sessions")
        .delete()
        .eq("session_id", sessionId);

      if (sessionError) throw sessionError;

      toast.success("Quiz deletado com sucesso!");
      fetchQuizData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Erro ao deletar quiz");
    }
  };

  const filteredSessions = quizSessions.filter((session) => {
    const matchesSearch =
      session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.country_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry =
      selectedCountry === "all" || session.country_name === selectedCountry;
    
    // Date range filter
    const sessionDate = new Date(session.started_at);
    const matchesDateFrom = !dateFrom || sessionDate >= dateFrom;
    const matchesDateTo = !dateTo || sessionDate <= new Date(dateTo.setHours(23, 59, 59, 999));
    
    return matchesSearch && matchesCountry && matchesDateFrom && matchesDateTo;
  });

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                FORGEA ADMIN
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                Voltar ao Site
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Painel Administrativo</h2>
            <p className="text-muted-foreground">
              Gerencie e monitore o sistema Forgea
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Quizzes
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  Todos os quizzes criados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Quizzes Completos
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  {totalQuizzes > 0
                    ? `${Math.round((completedQuizzes / totalQuizzes) * 100)}% taxa de conclusão`
                    : "Sem dados"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Países Ativos
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countryStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Países com quizzes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Country Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quizzes por País</CardTitle>
              <CardDescription>
                Distribuição geográfica dos quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : countryStats.length === 0 ? (
                <p className="text-muted-foreground">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-3">
                  {countryStats.slice(0, 5).map((stat, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        <div>
                          <p className="font-medium">{stat.country_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {stat.country_code}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{stat.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {totalQuizzes > 0
                            ? `${Math.round((stat.count / totalQuizzes) * 100)}%`
                            : "0%"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz List with Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Quizzes</CardTitle>
              <CardDescription>
                Visualize e gerencie todos os quizzes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por ID ou país..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os países</SelectItem>
                      {countryStats.map((stat) => (
                        <SelectItem key={stat.country_code} value={stat.country_name}>
                          {stat.country_name} ({stat.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De (data início)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[240px] justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até (data fim)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {(dateFrom || dateTo) && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDateFrom(undefined);
                        setDateTo(undefined);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Limpar Datas
                    </Button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Session ID</TableHead>
                      <TableHead>País</TableHead>
                      <TableHead>Iniciado</TableHead>
                      <TableHead>Completo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum quiz encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {session.session_id.substring(0, 12)}...
                          </TableCell>
                          <TableCell>
                            {session.country_name || "Desconhecido"}
                          </TableCell>
                          <TableCell>
                            {new Date(session.started_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {session.completed_at ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(`/build/${session.session_id}`)
                                }
                              >
                                Ver
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteQuiz(session.session_id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
