import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Eye, Users, TrendingDown, Globe, Languages, Clock } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const safeFormatDate = (dateStr: string | null | undefined, formatStr: string = "dd/MM/yyyy HH:mm") => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, formatStr);
  } catch (e) {
    return "Invalid Date";
  }
};

interface AnalyticsStats {
  total_pageviews: number;
  total_sessions: number;
  bounce_rate: number;
  avg_pages_per_session: number;
  top_pages: Array<{ page_path: string; count: number }>;
  by_country: Array<{ country_name: string; country_code: string; count: number }>;
  by_language: Array<{ language: string; count: number }>;
  recent_sessions: Array<{
    session_id: string;
    first_page: string;
    pages_viewed: number;
    is_bounce: boolean;
    country_name: string;
    language: string;
    created: string;
  }>;
}

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<string>("7");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const daysAgo = parseInt(timeRange);
      const fromDate = subDays(new Date(), daysAgo);

      // Fetch all relevant events
      const events = await api.get(`/api/pb/analytics_events?created[gte]=${fromDate.toISOString().replace('T', ' ')}`);
      
      if (!events || !Array.isArray(events)) {
        setStats({
          total_pageviews: 0,
          total_sessions: 0,
          bounce_rate: 0,
          avg_pages_per_session: 0,
          top_pages: [],
          by_country: [],
          by_language: [],
          recent_sessions: [],
        });
        return;
      }

      // Process sessions from events
      const sessionsMap: Record<string, any> = {};
      events.forEach(event => {
        const sid = event.session_id || "anonymous";
        if (!sessionsMap[sid]) {
          sessionsMap[sid] = {
            session_id: sid,
            events: [],
            country_name: event.country_name || "Unknown",
            country_code: event.country_code || "UN",
            language: event.language || "Unknown",
            created: event.created,
          };
        }
        sessionsMap[sid].events.push(event);
      });

      const sessionsList = Object.values(sessionsMap);
      const totalPageviews = events.filter(e => e.event_type === 'pageview').length;
      const totalSessions = sessionsList.length;
      
      const bouncedSessions = sessionsList.filter(s => s.events.length === 1).length;
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0;
      const avgPagesPerSession = totalSessions > 0 ? totalPageviews / totalSessions : 0;

      // Top pages
      const pageCounts: Record<string, number> = {};
      events.filter(e => e.event_type === 'pageview').forEach(pv => {
        pageCounts[pv.page_path] = (pageCounts[pv.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCounts)
        .map(([page_path, count]) => ({ page_path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // By country
      const countryCounts: Record<string, { name: string; code: string; count: number }> = {};
      sessionsList.forEach(s => {
        if (!countryCounts[s.country_code]) {
          countryCounts[s.country_code] = { name: s.country_name, code: s.country_code, count: 0 };
        }
        countryCounts[s.country_code].count++;
      });
      const byCountry = Object.values(countryCounts).sort((a, b) => b.count - a.count);

      // By language
      const languageCounts: Record<string, number> = {};
      sessionsList.forEach(s => {
        languageCounts[s.language] = (languageCounts[s.language] || 0) + 1;
      });
      const byLanguage = Object.entries(languageCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

      setStats({
        total_pageviews: totalPageviews,
        total_sessions: totalSessions,
        bounce_rate: bounceRate,
        avg_pages_per_session: avgPagesPerSession,
        top_pages: topPages,
        by_country: byCountry,
        by_language: byLanguage,
        recent_sessions: sessionsList.map(s => ({
          session_id: s.session_id,
          first_page: s.events[0]?.page_path || "/",
          pages_viewed: s.events.length,
          is_bounce: s.events.length === 1,
          country_name: s.country_name,
          language: s.language,
          created: s.created,
        })).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()).slice(0, 20),
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">A carregar analytics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Sem dados disponíveis</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboard de Analytics</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Últimas 24 horas</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_pageviews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_sessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Rejeição</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounce_rate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas/Sessão</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avg_pages_per_session.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Páginas Mais Visitadas</CardTitle>
          <CardDescription>Páginas com mais visualizações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.top_pages.map((page, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-mono text-sm">{page.page_path}</span>
                </div>
                <Badge>{page.count} views</Badge>
              </div>
            ))}
            {stats.top_pages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sem dados disponíveis
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Countries and Languages */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Por País
            </CardTitle>
            <CardDescription>Distribuição geográfica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.by_country.map((country, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{country.country_code}</span>
                    <span className="text-sm">{country.country_name}</span>
                  </div>
                  <Badge variant="secondary">{country.count} sessões</Badge>
                </div>
              ))}
              {stats.by_country.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem dados disponíveis
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Por Idioma
            </CardTitle>
            <CardDescription>Preferências de idioma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.by_language.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                  <span className="text-sm font-medium">{lang.language}</span>
                  <Badge variant="secondary">{lang.count} sessões</Badge>
                </div>
              ))}
              {stats.by_language.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sem dados disponíveis
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Recentes</CardTitle>
          <CardDescription>Últimas 20 sessões registadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recent_sessions.map((session) => (
              <div key={session.session_id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {session.session_id.substring(0, 12)}...
                    </span>
                    <Badge variant={session.is_bounce ? "destructive" : "default"} className="text-xs">
                      {session.is_bounce ? "Bounce" : `${session.pages_viewed} páginas`}
                    </Badge>
                  </div>
                  <div className="text-sm">{session.first_page}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{session.country_name || "Unknown"}</span>
                    <span>•</span>
                    <span>{session.language}</span>
                    <span>•</span>
                    <span>{safeFormatDate(session.created)}</span>
                  </div>
                </div>
              </div>
            ))}
            {stats.recent_sessions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sem sessões registadas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
