import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Database, Activity, Trash2, Search, Globe, Calendar as CalendarIcon, X, Check, Settings, FileText, Map, Plus, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoadmapContent } from "@/components/admin/RoadmapContent";
import { CRM } from "@/components/admin/CRM";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { questions } from "@/components/quiz/questions";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  completed_count: number;
}

interface StoreLink {
  id: string;
  country_code: string;
  country_name: string;
  store_name: string;
  store_url: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}


const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [completedQuizzes, setCompletedQuizzes] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [promptText, setPromptText] = useState("");
  const [storeLinks, setStoreLinks] = useState<StoreLink[]>([]);
  const [storeLinkSearch, setStoreLinkSearch] = useState("");
  const [storeLinkCountry, setStoreLinkCountry] = useState("all");
  const [storeLinkStatus, setStoreLinkStatus] = useState<boolean | "all">("all");
  const [currentStoreLinkPage, setCurrentStoreLinkPage] = useState(1);
  const [storeLinkDialogOpen, setStoreLinkDialogOpen] = useState(false);
  const [storeLinkDeleteDialogOpen, setStoreLinkDeleteDialogOpen] = useState(false);
  const [storeLinkToDelete, setStoreLinkToDelete] = useState<string | null>(null);
  const [editingStoreLink, setEditingStoreLink] = useState<StoreLink | null>(null);
  const [storeLinkFormData, setStoreLinkFormData] = useState({
    country_code: "",
    country_name: "",
    store_name: "",
    store_url: "",
    status: true,
  });
  const [showAllCountries, setShowAllCountries] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsCheckingAuth(false);
        return;
      }

      // Verify admin role
      const { data: hasAdminRole, error } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin'
      });

      if (!error && hasAdminRole) {
        setIsAuthenticated(true);
        fetchQuizData();
        fetchPrompt();
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizData();
      fetchPrompt();
      fetchStoreLinks();
    }
  }, [isAuthenticated]);

  const fetchPrompt = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_prompts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setPromptText(data.prompt_text);
      }
    } catch (error) {
      console.error("Error fetching prompt:", error);
    }
  };

  const fetchStoreLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("country_store_links")
        .select("*")
        .order("country_name", { ascending: true });

      if (error) throw error;
      setStoreLinks(data || []);
    } catch (error) {
      console.error("Error fetching store links:", error);
      toast.error("Error loading store links");
    }
  };


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
          stats[country] = { country_name: country, country_code: code, count: 0, completed_count: 0 };
        }
        stats[country].count++;
        if (session.completed_at !== null) {
          stats[country].completed_count++;
        }
      });

      setCountryStats(Object.values(stats).sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    fetchQuizData();
    fetchPrompt();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const openDeleteDialog = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuiz = async () => {
    if (!sessionToDelete) return;

    try {
      // Delete responses first (foreign key constraint)
      const { error: responsesError } = await supabase
        .from("quiz_responses")
        .delete()
        .eq("session_id", sessionToDelete);

      if (responsesError) throw responsesError;

      // Delete session
      const { error: sessionError } = await supabase
        .from("quiz_sessions")
        .delete()
        .eq("session_id", sessionToDelete);

      if (sessionError) throw sessionError;

      toast.success("Quiz deleted successfully!");
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      fetchQuizData();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Error deleting quiz");
    }
  };

  const downloadQuizzesExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      
      // Fetch all quiz sessions with their responses
      const { data: sessions, error: sessionsError } = await supabase
        .from("quiz_sessions")
        .select("*")
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch all responses
      const { data: responses, error: responsesError } = await supabase
        .from("quiz_responses")
        .select("*");

      if (responsesError) throw responsesError;

      // Create worksheet data
      const worksheetData = sessions?.map((session) => {
        const sessionResponses = responses?.filter(r => r.session_id === session.session_id);
        
        return {
          'Session ID': session.session_id,
          'Country': session.country_name || 'Unknown',
          'Country Code': session.country_code || 'XX',
          'Started At': new Date(session.started_at).toLocaleString(),
          'Completed At': session.completed_at ? new Date(session.completed_at).toLocaleString() : 'Not completed',
          'Total Score': session.total_score || 'N/A',
          'Number of Responses': sessionResponses?.length || 0,
        };
      }) || [];

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Quiz Sessions");

      // Generate file and download
      XLSX.writeFile(wb, `quiz_sessions_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success("Excel file downloaded successfully!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Error generating Excel file");
    }
  };

  const downloadQuestionsCSV = () => {
    try {
      // CSV Header
      let csvContent = "Path (Purpose),Question Number,Question ID,Question,Description,Type,Options/Possible Answers,Condition\n";

      // Define paths based on purpose
      const paths = [
        { purpose: "gaming", label: "GAMING" },
        { purpose: "professional", label: "PROFESSIONAL/OFFICE USE" },
        { purpose: "content", label: "CONTENT CREATION" },
        { purpose: "mixed", label: "MIXED USE" }
      ];

      // Process each path
      paths.forEach(path => {
        let questionNumber = 1;
        
        // Add separator row
        csvContent += `\n"=== ${path.label} ===",,,,,,,\n`;
        
        // First question (purpose) - always included
        const purposeQ = questions.find(q => q.id === "purpose");
        if (purposeQ) {
          const selectedOption = purposeQ.options?.find(opt => opt.value === path.purpose);
          csvContent += `"${path.label}",${questionNumber},"${purposeQ.id}","${purposeQ.question.replace(/"/g, '""')}","${purposeQ.description || ''}","${purposeQ.type}","Selected: ${selectedOption?.label || path.purpose}",""\n`;
          questionNumber++;
        }

        // Filter questions that apply to this path
        const applicableQuestions = questions.filter(q => {
          if (q.id === "purpose") return false; // Already added
          
          // Check if question has no condition (universal questions)
          if (!q.condition) return true;
          
          // Test condition with mock answers
          try {
            const mockAnswers = { purpose: path.purpose };
            return q.condition(mockAnswers);
          } catch {
            return false;
          }
        });

        // Add each applicable question
        applicableQuestions.forEach(q => {
          const question = q.question.replace(/"/g, '""');
          const description = q.description ? q.description.replace(/"/g, '""') : "";
          const type = q.type;
          
          // Build options/answers text
          let optionsText = "";
          if (q.type === "single" && q.options) {
            const opts = q.options.map(opt => {
              const desc = opt.description ? ` (${opt.description})` : "";
              return `${opt.label}${desc}`;
            }).join(" | ");
            optionsText = opts;
          } else if (q.type === "number") {
            optionsText = `Number: min=${q.min}, max=${q.max}, step=${q.step}${q.suffix ? ', suffix=' + q.suffix : ''}`;
          }

          // Build condition text
          let conditionText = "";
          if (q.condition) {
            const condStr = q.condition.toString();
            // Extract readable condition
            const match = condStr.match(/answers\.(\w+)\s*===?\s*["'](\w+)["']/);
            if (match) {
              conditionText = `Requires: ${match[1]} = ${match[2]}`;
            } else {
              conditionText = "Dynamic condition";
            }
          }

          csvContent += `"${path.label}",${questionNumber},"${q.id}","${question}","${description}","${type}","${optionsText}","${conditionText}"\n`;
          questionNumber++;
        });

        csvContent += "\n"; // Empty line between paths
      });

      // Create download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "quiz_caminhos_completos.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV with all paths generated successfully!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Error generating CSV");
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

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCountry, dateFrom, dateTo]);

  // Reset store link page when filters change
  useEffect(() => {
    setCurrentStoreLinkPage(1);
  }, [storeLinkSearch, storeLinkCountry, storeLinkStatus]);


  // Filter store links
  const filteredStoreLinks = storeLinks.filter((link) => {
    const matchesSearch = 
      link.store_name.toLowerCase().includes(storeLinkSearch.toLowerCase()) ||
      link.country_name.toLowerCase().includes(storeLinkSearch.toLowerCase());
    const matchesCountry = storeLinkCountry === "all" || link.country_code === storeLinkCountry;
    const matchesStatus = storeLinkStatus === "all" || link.status === storeLinkStatus;
    
    return matchesSearch && matchesCountry && matchesStatus;
  });

  // Paginate store links
  const totalStoreLinkPages = Math.ceil(filteredStoreLinks.length / itemsPerPage);
  const storeLinkStartIndex = (currentStoreLinkPage - 1) * itemsPerPage;
  const storeLinkEndIndex = storeLinkStartIndex + itemsPerPage;
  const paginatedStoreLinks = filteredStoreLinks.slice(storeLinkStartIndex, storeLinkEndIndex);

  // Get unique countries from store links
  const storeCountries = Array.from(new Set(storeLinks.map(link => link.country_code)))
    .map(code => {
      const link = storeLinks.find(l => l.country_code === code);
      return { code, name: link?.country_name || code };
    })
    .sort((a, b) => a.name.localeCompare(b.name));


  const handleToggleStoreStatus = async (linkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("country_store_links")
        .update({ status: !currentStatus })
        .eq("id", linkId);

      if (error) throw error;

      toast.success("Store status updated!");
      fetchStoreLinks();
    } catch (error) {
      console.error("Error updating store status:", error);
      toast.error("Error updating store status");
    }
  };

  const openStoreLinkDialog = (link?: StoreLink) => {
    if (link) {
      setEditingStoreLink(link);
      setStoreLinkFormData({
        country_code: link.country_code,
        country_name: link.country_name,
        store_name: link.store_name,
        store_url: link.store_url,
        status: link.status,
      });
    } else {
      setEditingStoreLink(null);
      setStoreLinkFormData({
        country_code: "",
        country_name: "",
        store_name: "",
        store_url: "",
        status: true,
      });
    }
    setStoreLinkDialogOpen(true);
  };

  const handleStoreLinkSubmit = async () => {
    if (!storeLinkFormData.country_code || !storeLinkFormData.country_name || 
        !storeLinkFormData.store_name || !storeLinkFormData.store_url) {
      toast.error("All fields are required");
      return;
    }

    try {
      if (editingStoreLink) {
        const { error } = await supabase
          .from("country_store_links")
          .update(storeLinkFormData)
          .eq("id", editingStoreLink.id);

        if (error) throw error;
        toast.success("Store link updated successfully!");
      } else {
        const { error } = await supabase
          .from("country_store_links")
          .insert([storeLinkFormData]);

        if (error) throw error;
        toast.success("Store link created successfully!");
      }

      setStoreLinkDialogOpen(false);
      setEditingStoreLink(null);
      fetchStoreLinks();
    } catch (error) {
      console.error("Error saving store link:", error);
      toast.error("Error saving store link");
    }
  };

  const openStoreLinkDeleteDialog = (linkId: string) => {
    setStoreLinkToDelete(linkId);
    setStoreLinkDeleteDialogOpen(true);
  };

  const handleStoreLinkDelete = async () => {
    if (!storeLinkToDelete) return;

    try {
      const { error } = await supabase
        .from("country_store_links")
        .delete()
        .eq("id", storeLinkToDelete);

      if (error) throw error;

      toast.success("Store link deleted successfully!");
      setStoreLinkDeleteDialogOpen(false);
      setStoreLinkToDelete(null);
      fetchStoreLinks();
    } catch (error) {
      console.error("Error deleting store link:", error);
      toast.error("Error deleting store link");
    }
  };


  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying credentials...</p>
        </div>
      </div>
    );
  }

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
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Administrative Panel</h2>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full max-w-5xl grid-cols-5">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="selling">Selling</TabsTrigger>
              <TabsTrigger value="billingcpc">CRM</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-8 mt-6">
              {/* Stats Grid */}
              <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Quizzes
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  All quizzes created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed Quizzes
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedQuizzes}</div>
                <p className="text-xs text-muted-foreground">
                  {totalQuizzes > 0
                    ? `${Math.round((completedQuizzes / totalQuizzes) * 100)}% completion rate`
                    : "No data"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Countries
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countryStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Countries with quizzes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Country Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quizzes by Country</CardTitle>
              <CardDescription>
                Geographic distribution of quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : countryStats.length === 0 ? (
                <p className="text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(showAllCountries ? countryStats : countryStats.slice(0, 8)).map((stat, i) => (
                      <div
                        key={i}
                        className="flex flex-col p-3 rounded-lg bg-background/50 border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-primary" />
                          <p className="font-medium text-sm truncate">{stat.country_name}</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-2xl font-bold">{stat.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {totalQuizzes > 0
                              ? `${Math.round((stat.count / totalQuizzes) * 100)}%`
                              : "0%"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {countryStats.length > 8 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCountries(!showAllCountries)}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      {showAllCountries ? "Show less" : `Show more... (${countryStats.length - 8} more countries)`}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quiz List with Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz List</CardTitle>
              <CardDescription>
                View and manage all quizzes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countryStats.map((stat) => (
                      <SelectItem key={stat.country_code} value={stat.country_name}>
                        {stat.country_name} ({stat.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MM/dd/yyyy") : "From"}
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
                        "w-[180px] justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MM/dd/yyyy") : "To"}
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
                  >
                    Clear Dates
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Session ID</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Complete</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No quizzes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {session.session_id}
                          </TableCell>
                          <TableCell>
                            {session.country_name || "Unknown"}
                          </TableCell>
                          <TableCell>
                            {new Date(session.started_at).toLocaleDateString("en-US")}
                          </TableCell>
                          <TableCell>
                            {session.completed_at ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <X className="w-5 h-5 text-red-600" />
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
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(session.session_id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSessions.length)} of {filteredSessions.length} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="selling" className="space-y-8 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Country Store Links</CardTitle>
                      <CardDescription>
                        Manage store associations by country
                      </CardDescription>
                    </div>
                    <Button onClick={() => openStoreLinkDialog()} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Store Link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by store or country..."
                        value={storeLinkSearch}
                        onChange={(e) => setStoreLinkSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <Select value={storeLinkCountry} onValueChange={setStoreLinkCountry}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All countries</SelectItem>
                        {storeCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-4 px-4 py-2 border rounded-lg">
                      <Label htmlFor="status-filter" className="text-sm whitespace-nowrap">
                        Active Only
                      </Label>
                      <Switch
                        id="status-filter"
                        checked={storeLinkStatus === true}
                        onCheckedChange={(checked) => setStoreLinkStatus(checked ? true : "all")}
                      />
                    </div>
                  </div>

                  {/* Store Links Table */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead>Store Name</TableHead>
                          <TableHead>Store URL</TableHead>
                          <TableHead>Quizzes Completados</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedStoreLinks.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No store links found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedStoreLinks.map((link) => {
                            const countryStat = countryStats.find(
                              stat => stat.country_code === link.country_code
                            );
                            const completedCount = countryStat?.completed_count || 0;
                            
                            return (
                              <TableRow key={link.id}>
                                <TableCell className="font-medium">
                                  {link.country_name}
                                </TableCell>
                                <TableCell>{link.store_name}</TableCell>
                                <TableCell>
                                  <a 
                                    href={link.store_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline truncate block max-w-[300px]"
                                  >
                                    {link.store_url}
                                  </a>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <span className="font-semibold">{completedCount}</span>
                                    <span className="text-muted-foreground text-sm">
                                      {countryStat ? `/ ${countryStat.count}` : ''}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={link.status}
                                      onCheckedChange={() => handleToggleStoreStatus(link.id, link.status)}
                                    />
                                    <span className="text-sm">
                                      {link.status ? "Active" : "Inactive"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openStoreLinkDialog(link)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openStoreLinkDeleteDialog(link.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalStoreLinkPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {storeLinkStartIndex + 1} to {Math.min(storeLinkEndIndex, filteredStoreLinks.length)} of {filteredStoreLinks.length} results
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStoreLinkPage(prev => Math.max(1, prev - 1))}
                          disabled={currentStoreLinkPage === 1}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalStoreLinkPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentStoreLinkPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentStoreLinkPage(page)}
                              className="w-10"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentStoreLinkPage(prev => Math.min(totalStoreLinkPages, prev + 1))}
                          disabled={currentStoreLinkPage === totalStoreLinkPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billingcpc" className="space-y-8 mt-6">
              <CRM />
            </TabsContent>

            <TabsContent value="roadmap" className="space-y-8 mt-6">
              <RoadmapContent />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-6">
              <div className="grid gap-6">
                {/* AI Prompt Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Prompt Configuration</CardTitle>
                    <CardDescription>
                      Configure the AI prompt used for quiz recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">
                        Use placeholders like {'{{'} budget_usd {'}'} to insert quiz answers
                      </p>
                      <p className={cn(
                        "text-xs font-mono",
                        promptText.length > 4000 ? "text-destructive font-semibold" : "text-muted-foreground"
                      )}>
                        {promptText.length} / 4000
                        {promptText.length > 4000 && " (will be truncated)"}
                      </p>
                    </div>
                    <Textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Type your prompt here... (supports markdown)"
                      className="min-h-[300px] resize-none font-mono text-sm"
                    />
                    <Button
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from("admin_prompts")
                            .insert({ prompt_text: promptText });

                          if (error) throw error;

                          toast.success("Prompt saved successfully!");
                        } catch (error) {
                          console.error("Error saving prompt:", error);
                          toast.error("Error saving prompt");
                        }
                      }}
                    >
                      Save Prompt
                    </Button>
                  </CardContent>
                </Card>

                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>
                      Download quiz data and questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <Button
                        variant="outline"
                        onClick={downloadQuizzesExcel}
                        className="justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export All Quizzes to Excel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadQuestionsCSV}
                        className="justify-start"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Export Questions to CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              and all associated responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuiz}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Store Link Dialog */}
      <Dialog open={storeLinkDialogOpen} onOpenChange={setStoreLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStoreLink ? "Edit Store Link" : "Add Store Link"}</DialogTitle>
            <DialogDescription>
              {editingStoreLink ? "Update the store link information" : "Create a new store link"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input
                value={storeLinkFormData.country_code}
                onChange={(e) => setStoreLinkFormData({ ...storeLinkFormData, country_code: e.target.value.toUpperCase() })}
                placeholder="e.g., PT, ES, GB"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Country Name</Label>
              <Input
                value={storeLinkFormData.country_name}
                onChange={(e) => setStoreLinkFormData({ ...storeLinkFormData, country_name: e.target.value })}
                placeholder="e.g., Portugal"
              />
            </div>
            <div className="space-y-2">
              <Label>Store Name</Label>
              <Input
                value={storeLinkFormData.store_name}
                onChange={(e) => setStoreLinkFormData({ ...storeLinkFormData, store_name: e.target.value })}
                placeholder="e.g., Worten"
              />
            </div>
            <div className="space-y-2">
              <Label>Store URL</Label>
              <Input
                value={storeLinkFormData.store_url}
                onChange={(e) => setStoreLinkFormData({ ...storeLinkFormData, store_url: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={storeLinkFormData.status}
                onCheckedChange={(checked) => setStoreLinkFormData({ ...storeLinkFormData, status: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoreLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStoreLinkSubmit}>
              {editingStoreLink ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Link Delete Dialog */}
      <AlertDialog open={storeLinkDeleteDialogOpen} onOpenChange={setStoreLinkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá apagar permanentemente este vínculo de loja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStoreLinkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Admin;
