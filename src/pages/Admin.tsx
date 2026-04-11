import { useState, useEffect } from "react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Database, Activity, Trash2, Search, Globe, Calendar as CalendarIcon, X, Check, Settings, FileText, Map, Plus, Pencil, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RoadmapContent } from "@/components/admin/RoadmapContent";
import { CRM } from "@/components/admin/CRM";
import { SEOMarketing } from "@/components/admin/SEOMarketing";
import { DatabaseBackup } from "@/components/admin/DatabaseBackup";

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
import enUS from '@/i18n/locales/en-US.json';
import enGB from '@/i18n/locales/en-GB.json';
import ptPT from '@/i18n/locales/pt-PT.json';
import ptBR from '@/i18n/locales/pt-BR.json';
import es from '@/i18n/locales/es.json';
import fr from '@/i18n/locales/fr.json';
import de from '@/i18n/locales/de.json';
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
  const [demoQuizJson, setDemoQuizJson] = useState<string>('[]');
  const [demoBuildJson, setDemoBuildJson] = useState<string>('[]');
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
      fetchDemoJsonData();
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

  const fetchDemoJsonData = async () => {
    try {
      // Fetch the last completed quiz session
      const { data: sessionData, error: sessionError } = await supabase
        .from("quiz_sessions")
        .select("*")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) throw sessionError;
      if (!sessionData) {
        setDemoQuizJson('{}');
        setDemoBuildJson('{}');
        return;
      }

      // Fetch all responses for this session
      const { data: responsesData, error: responsesError } = await supabase
        .from("quiz_responses")
        .select("*")
        .eq("session_id", sessionData.session_id)
        .order("question_number", { ascending: true });

      if (responsesError) throw responsesError;

      // Fetch AI recommendation for this session
      const { data: aiData, error: aiError } = await supabase
        .from("ai_recommendations")
        .select("*")
        .eq("session_id", sessionData.session_id)
        .maybeSingle();

      if (aiError) console.error("Error fetching AI recommendation:", aiError);

      // Quiz JSON (input data) - reflects actual quiz structure
      const quizJson = {
        session_id: sessionData.session_id,
        country_code: sessionData.country_code,
        country_name: sessionData.country_name,
        started_at: sessionData.started_at,
        completed_at: sessionData.completed_at,
        answers: {
          // Base questions
          country: responsesData?.find(r => r.question_number === 1)?.selected_answer || "",
          purpose: responsesData?.find(r => r.question_number === 2)?.selected_answer || "",
          // Conditional gaming questions
          games: responsesData?.find(r => r.question_text.toLowerCase().includes("game") && r.question_number > 2)?.selected_answer,
          resolution: responsesData?.find(r => r.question_text.toLowerCase().includes("resolution"))?.selected_answer,
          fps: responsesData?.find(r => r.question_text.toLowerCase().includes("fps") || r.question_text.toLowerCase().includes("frame"))?.selected_answer,
          streaming: responsesData?.find(r => r.question_text.toLowerCase().includes("stream"))?.selected_answer,
          // Conditional professional questions
          software: responsesData?.find(r => r.question_text.toLowerCase().includes("software") && !r.question_text.toLowerCase().includes("content"))?.selected_answer,
          multitask: responsesData?.find(r => r.question_text.toLowerCase().includes("multitask"))?.selected_answer,
          // Conditional content creation questions
          contentSoftware: responsesData?.find(r => r.question_text.toLowerCase().includes("content") && r.question_text.toLowerCase().includes("software"))?.selected_answer,
          render4k: responsesData?.find(r => r.question_text.toLowerCase().includes("4k") || r.question_text.toLowerCase().includes("render"))?.selected_answer,
          gpuAcceleration: responsesData?.find(r => r.question_text.toLowerCase().includes("gpu") || r.question_text.toLowerCase().includes("acceleration"))?.selected_answer,
          // Universal questions
          budget: responsesData?.find(r => r.question_text.toLowerCase().includes("budget") || r.question_text.toLowerCase().includes("orçamento"))?.selected_answer,
          casePreference: responsesData?.find(r => r.question_text.toLowerCase().includes("case") || r.question_text.toLowerCase().includes("torre"))?.selected_answer,
          peripherals: responsesData?.find(r => r.question_text.toLowerCase().includes("periph") || r.question_text.toLowerCase().includes("acessórios"))?.selected_answer,
          upgradability: responsesData?.find(r => r.question_text.toLowerCase().includes("upgrade") || r.question_text.toLowerCase().includes("atualização"))?.selected_answer,
        },
        raw_responses: responsesData?.map((response) => ({
          question_number: response.question_number,
          question_text: response.question_text,
          selected_answer: response.selected_answer,
          answered_at: response.answered_at,
        })) || [],
      };

      // Build JSON (output data) - reflects current component schema
      let buildJson;
      try {
        if (aiData?.recommendation_text) {
          // Parse the stored JSON structure
          const parsed = typeof aiData.recommendation_text === 'string' 
            ? JSON.parse(aiData.recommendation_text) 
            : aiData.recommendation_text;
          
          buildJson = {
            ...parsed,
            _schema_reference: {
              component_structure: {
                cpu: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                gpu: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                motherboard: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                ram: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                storage: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                psu: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                case: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
                cooling: { model: "string", where_to_buy: "url", youtube_link: "url|null", website_link: "url|null", recommended_price: "number" },
              },
              ai_report_structure: {
                budget_range: "string (e.g., '$1000-$1500')",
                primary_use: "string (e.g., 'Gaming', 'Content Creation')",
                performance_level: "string (e.g., 'High-End', 'Mid-Range')",
                upgrade_priority: "string (e.g., 'GPU > CPU > RAM')",
                key_features: "string[] (array of features)",
                compatibility_notes: "string (important compatibility info)",
              },
              metadata_structure: {
                model_used: "string (AI model identifier)",
                tokens_used: "number",
                created_at: "ISO timestamp",
                session_id: "string",
              }
            }
          };
        } else {
          // Fallback with full schema reference
          buildJson = {
            error: "No recommendation available for this session",
            expected_structure: {
              recommendation: "Markdown formatted PC build recommendation",
              ai_report: {
                budget_range: "string",
                primary_use: "string",
                performance_level: "string",
                upgrade_priority: "string",
                key_features: ["array", "of", "features"],
                compatibility_notes: "string"
              },
              components: {
                cpu: { model: "AMD Ryzen 7 7800X3D", where_to_buy: "https://...", youtube_link: "https://youtube.com/...", website_link: "https://amd.com/...", recommended_price: 449 },
                gpu: { model: "NVIDIA RTX 4070 Ti", where_to_buy: "https://...", youtube_link: "https://youtube.com/...", website_link: "https://nvidia.com/...", recommended_price: 799 },
                motherboard: { model: "ASUS ROG B650-E", where_to_buy: "https://...", youtube_link: null, website_link: "https://asus.com/...", recommended_price: 269 },
                ram: { model: "G.Skill Trident Z5 32GB DDR5", where_to_buy: "https://...", youtube_link: null, website_link: null, recommended_price: 119 },
                storage: { model: "Samsung 990 Pro 2TB", where_to_buy: "https://...", youtube_link: null, website_link: "https://samsung.com/...", recommended_price: 179 },
                psu: { model: "Corsair RM850x", where_to_buy: "https://...", youtube_link: null, website_link: null, recommended_price: 139 },
                case: { model: "Lian Li O11 Dynamic", where_to_buy: "https://...", youtube_link: null, website_link: null, recommended_price: 149 },
                cooling: { model: "Noctua NH-D15", where_to_buy: "https://...", youtube_link: null, website_link: null, recommended_price: 99 }
              },
              metadata: {
                model_used: "google/gemini-2.5-flash",
                tokens_used: 0,
                created_at: sessionData.completed_at,
                session_id: sessionData.session_id
              }
            }
          };
        }
      } catch (parseError) {
        console.error("Error parsing recommendation_text:", parseError);
        buildJson = {
          error: "Failed to parse recommendation",
          raw_text: aiData?.recommendation_text || "No data"
        };
      }

      setDemoQuizJson(JSON.stringify(quizJson, null, 2));
      setDemoBuildJson(JSON.stringify(buildJson, null, 2));
    } catch (error) {
      console.error("Error fetching demo JSON data:", error);
      setDemoQuizJson('{}');
      setDemoBuildJson('{}');
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
      // Available translations
      const translations: Record<string, any> = {
        'en-US': enUS,
        'en-GB': enGB,
        'pt-PT': ptPT,
        'pt-BR': ptBR,
        'es': es,
        'fr': fr,
        'de': de,
      };

      // Helper function to get translated text
      const getTranslation = (key: string, lang: string): string => {
        const keys = key.split('.');
        let value: any = translations[lang];
        
        for (const k of keys) {
          if (value && typeof value === 'object') {
            value = value[k];
          } else {
            return key; // Return key if translation not found
          }
        }
        
        return typeof value === 'string' ? value : key;
      };

      // CSV Header - including all languages
      let csvContent = "Path (Purpose),Question Number,Question ID,Question (EN-US),Question (EN-GB),Question (PT-PT),Question (PT-BR),Question (ES),Question (FR),Question (DE),Type,Options/Answers,Condition\n";

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
        csvContent += `\n"=== ${path.label} ===",,,,,,,,,,,\n`;
        
        // First question (purpose) - always included
        const purposeQ = questions.find(q => q.id === "purpose");
        if (purposeQ) {
          const selectedOption = purposeQ.options?.find(opt => opt.value === path.purpose);
          
          // Get question translations
          const questionTranslations = Object.keys(translations).map(lang => {
            const translatedQuestion = getTranslation(purposeQ.question, lang);
            return `"${translatedQuestion.replace(/"/g, '""')}"`;
          }).join(',');
          
          // Get options translations
          let optionsText = "";
          if (purposeQ.options) {
            const allLanguagesOptions = Object.keys(translations).map(lang => {
              const opts = purposeQ.options!.map(opt => {
                const translatedLabel = getTranslation(opt.label, lang);
                const translatedDesc = opt.description ? getTranslation(opt.description, lang) : "";
                return translatedDesc ? `${translatedLabel} (${translatedDesc})` : translatedLabel;
              }).join(' | ');
              return `[${lang.toUpperCase()}]: ${opts}`;
            }).join(' || ');
            optionsText = `"${allLanguagesOptions.replace(/"/g, '""')}"`;
          }
          
          csvContent += `"${path.label}",${questionNumber},"${purposeQ.id}",${questionTranslations},"${purposeQ.type}",${optionsText},""\n`;
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
          // Get question translations for all languages
          const questionTranslations = Object.keys(translations).map(lang => {
            const translatedQuestion = getTranslation(q.question, lang);
            return `"${translatedQuestion.replace(/"/g, '""')}"`;
          }).join(',');
          
          const type = q.type;
          
          // Build options/answers text with all translations
          let optionsText = "";
          if (q.type === "single" && q.options) {
            const allLanguagesOptions = Object.keys(translations).map(lang => {
              const opts = q.options!.map(opt => {
                const translatedLabel = getTranslation(opt.label, lang);
                const translatedDesc = opt.description ? getTranslation(opt.description, lang) : "";
                return translatedDesc ? `${translatedLabel} (${translatedDesc})` : translatedLabel;
              }).join(' | ');
              return `[${lang.toUpperCase()}]: ${opts}`;
            }).join(' || ');
            optionsText = `"${allLanguagesOptions.replace(/"/g, '""')}"`;
          } else if (q.type === "number") {
            optionsText = `"Number: min=${q.min}, max=${q.max}, step=${q.step}${q.suffix ? ', suffix=' + q.suffix : ''}"`;
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

          csvContent += `"${path.label}",${questionNumber},"${q.id}",${questionTranslations},"${type}",${optionsText},"${conditionText}"\n`;
          questionNumber++;
        });

        csvContent += "\n"; // Empty line between paths
      });

      // Create download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `quiz_questions_multilang_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("CSV multilíngue gerado com sucesso!");
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Erro ao gerar CSV");
    }
  };

  const downloadQuizJSON = async () => {
    try {
      // Get all quiz sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from("quiz_sessions")
        .select("*")
        .order("started_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get all responses
      const { data: responses, error: responsesError } = await supabase
        .from("quiz_responses")
        .select("*")
        .order("session_id, question_number");

      if (responsesError) throw responsesError;

      // Group responses by session
      const quizzesData = sessions?.map(session => {
        const sessionResponses = responses?.filter(r => r.session_id === session.session_id) || [];
        
        return {
          session_id: session.session_id,
          country_code: session.country_code,
          country_name: session.country_name,
          started_at: session.started_at,
          completed_at: session.completed_at,
          questions_and_answers: sessionResponses.map(response => ({
            question_number: response.question_number,
            question: response.question_text,
            answer: response.selected_answer,
            answered_at: response.answered_at
          }))
        };
      }) || [];

      const jsonContent = JSON.stringify(quizzesData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quiz_responses_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("JSON exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting JSON:", error);
      toast.error("Erro ao exportar JSON");
    }
  };

  const filteredSessions = quizSessions.filter((session) => {
    // Only show completed quizzes
    if (!session.completed_at) return false;
    
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
             <TabsList className="grid w-full max-w-6xl grid-cols-7">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="selling">Selling</TabsTrigger>
              <TabsTrigger value="billingcpc">CRM</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="seo">SEO & MKT</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
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
                            {format(new Date(session.started_at), "dd/MM/yyyy - HH:mm")}
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
                                disabled={!session.session_id}
                                onClick={() => {
                                  if (!session.session_id) return;
                                  navigate(`/build/${session.session_id}`)
                                }}
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
                      {(() => {
                        const maxVisiblePages = 10;
                        let startPage = 1;
                        let endPage = totalPages;

                        if (totalPages > maxVisiblePages) {
                          if (currentPage <= 6) {
                            startPage = 1;
                            endPage = maxVisiblePages;
                          } else if (currentPage >= totalPages - 5) {
                            startPage = totalPages - maxVisiblePages + 1;
                            endPage = totalPages;
                          } else {
                            startPage = currentPage - 5;
                            endPage = currentPage + 4;
                          }
                        }

                        const pages = Array.from(
                          { length: endPage - startPage + 1 },
                          (_, i) => startPage + i
                        );

                        return pages.map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ));
                      })()}
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
                                  <div className="flex items-center gap-1 text-sm">
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      {completedCount}
                                    </span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-semibold text-red-600 dark:text-red-400">
                                      {countryStat ? countryStat.count - completedCount : 0}
                                    </span>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="font-semibold text-foreground">
                                      {countryStat?.count || 0}
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
                          {(() => {
                            const maxVisiblePages = 10;
                            let startPage = 1;
                            let endPage = totalStoreLinkPages;

                            if (totalStoreLinkPages > maxVisiblePages) {
                              if (currentStoreLinkPage <= 6) {
                                startPage = 1;
                                endPage = maxVisiblePages;
                              } else if (currentStoreLinkPage >= totalStoreLinkPages - 5) {
                                startPage = totalStoreLinkPages - maxVisiblePages + 1;
                                endPage = totalStoreLinkPages;
                              } else {
                                startPage = currentStoreLinkPage - 5;
                                endPage = currentStoreLinkPage + 4;
                              }
                            }

                            const pages = Array.from(
                              { length: endPage - startPage + 1 },
                              (_, i) => startPage + i
                            );

                            return pages.map((page) => (
                              <Button
                                key={page}
                                variant={currentStoreLinkPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentStoreLinkPage(page)}
                                className="w-10"
                              >
                                {page}
                              </Button>
                            ));
                          })()}
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

            <TabsContent value="seo" className="space-y-8 mt-6">
              <SEOMarketing />
            </TabsContent>

            <TabsContent value="backup" className="mt-6">
              <DatabaseBackup />
            </TabsContent>

            <TabsContent value="settings" className="space-y-8 mt-6">
              <div className="grid gap-6">
                {/* Export Options */}
                <Card>
                  <CardHeader>
                    <CardTitle>Export Data</CardTitle>
                    <CardDescription>
                      Download quiz data and questions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadQuizzesExcel}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Export Quizzes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadQuestionsCSV}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Export Questions
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadQuizJSON}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Export JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>

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
                        promptText.length > 5000 ? "text-destructive font-semibold" : "text-muted-foreground"
                      )}>
                        {promptText.length} / 5000
                        {promptText.length > 5000 && " (will be truncated)"}
                      </p>
                    </div>
                    <Textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Type your prompt here... (supports markdown)"
                      className="min-h-[300px] resize-none font-mono text-sm"
                      maxLength={5000}
                    />
                    <div className="flex gap-2">
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(promptText);
                          toast.success("Prompt copiado!");
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Flow Diagram */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sistema - Fluxo Completo</CardTitle>
                    <CardDescription>
                      Diagrama detalhado de todas as etapas desde o início do quiz até à apresentação dos resultados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-6 rounded-lg overflow-x-auto">
                      <div className="mermaid-diagram" style={{ minWidth: '800px' }}>
                        <pre className="text-xs">
{`graph TB
    Start([👤 Utilizador Inicia Quiz]) --> CreateSession
    
    subgraph "1️⃣ INICIALIZAÇÃO"
        CreateSession[📝 Criar Sessão de Quiz] --> DetectCountry[🌍 Detetar País via Edge Function]
        DetectCountry --> SaveSession[(💾 Guardar em quiz_sessions)]
        SaveSession --> |session_id<br/>country_code<br/>country_name<br/>started_at| SessionReady[✅ Sessão Pronta]
    end
    
    SessionReady --> ShowQuestions
    
    subgraph "2️⃣ PERGUNTAS & RESPOSTAS"
        ShowQuestions[❓ Mostrar Pergunta] --> UserAnswer{Utilizador Responde}
        UserAnswer --> SaveResponse[(💾 Guardar em quiz_responses)]
        SaveResponse --> |session_id<br/>question_number<br/>question_text<br/>selected_answer<br/>answered_at| NextQuestion{Última Pergunta?}
        NextQuestion -->|Não| ShowQuestions
        NextQuestion -->|Sim| PrepareAnalysis
    end
    
    PrepareAnalysis --> CallEdgeFunction
    
    subgraph "3️⃣ PREPARAÇÃO PARA AI"
        CallEdgeFunction[🚀 Chamar analyze-quiz Function] --> CheckDuplicate{Sessão já analisada?}
        CheckDuplicate -->|Sim| ReturnCached[📦 Retornar Cache]
        CheckDuplicate -->|Não| FetchData[📊 Buscar Dados]
        FetchData --> GetPrompt[(🔍 admin_prompts)]
        GetPrompt --> GetStores[(🔍 country_store_links)]
        GetStores --> DetermineCurrency[💱 Determinar Moeda por País]
        DetermineCurrency --> PreparePayload[📦 Preparar System Prompt]
    end
    
    PreparePayload --> AICall
    
    subgraph "4️⃣ CHAMADA À AI - Lovable AI Gateway"
        AICall[🤖 Chamar Lovable AI Gateway] --> AIPayload
        AIPayload[📤 Enviar para AI:<br/>- System Prompt com instruções<br/>- User answers JSON<br/>- Country/Currency info<br/>- Store URLs disponíveis] 
        AIPayload --> AIProcessing[⚙️ AI Processing<br/>Model: google/gemini-2.5-flash<br/>via ai.gateway.lovable.dev]
        AIProcessing --> AIResponse[📥 AI Responde com Tool Call]
    end
    
    AIResponse --> ParseResponse
    
    subgraph "5️⃣ PROCESSAR RESPOSTA DA AI"
        ParseResponse[🔧 Parse Tool Call Response] --> ExtractData
        ExtractData[📋 Extrair Dados Estruturados:<br/>- recommendation markdown<br/>- 3 builds com componentes<br/>- ai_report análise] 
        ExtractData --> ValidateBuilds[✅ Validar Estrutura dos Builds]
        ValidateBuilds --> ProcessComponents[🔧 Processar Componentes]
        ProcessComponents --> CreateTrackedLinks[(💾 Criar tracked_links)]
        CreateTrackedLinks --> InjectLinks[✏️ Injetar Links Trackados no Texto]
    end
    
    InjectLinks --> SaveResults
    
    subgraph "6️⃣ GUARDAR RESULTADOS"
        SaveResults[💾 Guardar Recomendação] --> SaveToAI[(📝 ai_recommendations)]
        SaveToAI --> |session_id<br/>recommendation_text JSON<br/>prompt_used<br/>model_used<br/>tokens_used| UpdateSession[(🔄 Atualizar quiz_sessions)]
        UpdateSession --> |completed_at = now| PrepareJSON
    end
    
    PrepareJSON --> ReturnToClient
    
    subgraph "7️⃣ RESPOSTA AO CLIENTE"
        ReturnToClient[📤 Retornar JSON Estruturado] --> JSONStructure
        JSONStructure[📋 Estrutura Resposta:<br/><b>session_info:</b> id, country, ai_report<br/><b>recommendations:</b> 3 builds<br/><b>explanation:</b> markdown<br/><b>metadata:</b> model, created_at]
    end
    
    JSONStructure --> DisplayResults
    
    subgraph "8️⃣ APRESENTAÇÃO NO FRONTEND"
        DisplayResults[🖥️ Mostrar Resultados] --> ParseBuilds[🎴 Parse 3 Build Cards]
        ParseBuilds --> RenderCards[📇 Render BuildCard Components]
        RenderCards --> ShowComponents[🔧 Mostrar Componentes com:<br/>- Modelo<br/>- Preço Recomendado<br/>- Link Website<br/>- Link YouTube<br/>- Link Compra]
        ShowComponents --> ShowExplanation[📝 Mostrar AI Report + Explanation]
        ShowExplanation --> ShareOptions[📤 Opções: Share, PDF, Copy]
        ShareOptions --> TrackClicks[👆 Track Clicks via tracked_links]
    end
    
    TrackClicks --> End([✅ Fim])
    
    style Start fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style End fill:#4ade80,stroke:#22c55e,stroke-width:3px
    style AICall fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style AIProcessing fill:#f59e0b,stroke:#d97706,stroke-width:2px
    style SaveSession fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style SaveResponse fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style SaveToAI fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style CreateTrackedLinks fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style UpdateSession fill:#3b82f6,stroke:#2563eb,stroke-width:2px
    style ReturnCached fill:#a855f7,stroke:#9333ea,stroke-width:2px`}
                        </pre>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground space-y-4">
                      <div>
                        <p><strong>Tabelas Envolvidas:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><code>quiz_sessions</code> - Armazena cada sessão de quiz iniciada</li>
                          <li><code>quiz_responses</code> - Guarda todas as respostas individuais</li>
                          <li><code>country_store_links</code> - Links de lojas por país</li>
                          <li><code>admin_prompts</code> - Prompt configurável para a AI</li>
                          <li><code>ai_recommendations</code> - Recomendações geradas pela AI</li>
                          <li><code>tracked_links</code> - Links com tracking de clicks</li>
                        </ul>
                      </div>
                      <div>
                        <p><strong>Schema de Componentes (Build Card):</strong></p>
                        <pre className="bg-muted/50 p-3 rounded text-xs mt-2 overflow-x-auto">
{`{
  "type": "GPU" | "CPU" | "RAM" | "Storage" | "PSU" | "Case" | "Motherboard" | "Cooler",
  "model": "Nome do modelo específico",
  "where_to_buy": "URL para compra (da loja do país)",
  "youtube_link": "URL de review no YouTube (opcional)",
  "website_link": "URL do site oficial do produto (opcional)",
  "recommended_price": "Preço sugerido na moeda local"
}`}
                        </pre>
                      </div>
                      <div>
                        <p><strong>Edge Functions:</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><code>detect-country</code> - Deteta país do utilizador via IP</li>
                          <li><code>analyze-quiz</code> - Processa quiz e chama Lovable AI Gateway</li>
                          <li><code>track-analytics</code> - Regista eventos de analytics</li>
                          <li><code>meta-tags</code> - Gera meta tags dinâmicas para SEO</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* JSON Examples - Side by Side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Quiz JSON */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quiz Input JSON</CardTitle>
                      <CardDescription>
                        Dados das respostas do quiz
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-[500px]">
{demoQuizJson}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(demoQuizJson);
                            toast.success("JSON do Quiz copiado!");
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Build Output JSON */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Build Output JSON</CardTitle>
                      <CardDescription>
                        Dados da recomendação gerada
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-[500px]">
{demoBuildJson}
                        </pre>
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(demoBuildJson);
                            toast.success("JSON do Build copiado!");
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
