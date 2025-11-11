import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, MousePointerClick, Globe, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LinkAnalytic {
  short_code: string;
  destination_url: string;
  product: string | null;
  source: string | null;
  country_name: string | null;
  total_clicks: number;
  valid_clicks: number;
  unique_sessions: number;
  valid_rate: number;
}

interface CountryData {
  country: string;
  clicks: number;
  sessions: number;
  ctr: number;
}

interface ProductData {
  product: string;
  clicks: number;
  validRate: number;
}

export const LinkAnalytics = () => {
  const [analytics, setAnalytics] = useState<LinkAnalytic[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalValidClicks, setTotalValidClicks] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [avgCTR, setAvgCTR] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("ai_link_analytics" as any)
        .select("*")
        .order("total_clicks", { ascending: false });

      if (error) throw error;

      setAnalytics((data || []) as unknown as LinkAnalytic[]);

      // Calculate totals
      const clicks = (data || []).reduce((sum: number, item: any) => sum + (item.total_clicks || 0), 0);
      const validClicks = (data || []).reduce((sum: number, item: any) => sum + (item.valid_clicks || 0), 0);
      const uniqueSessions = new Set((data || []).map((item: any) => item.unique_sessions)).size;
      
      setTotalClicks(clicks);
      setTotalValidClicks(validClicks);
      setTotalSessions(uniqueSessions);
      setAvgCTR(clicks > 0 ? (validClicks / clicks) * 100 : 0);

    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const countryData: CountryData[] = analytics
    .reduce((acc, item) => {
      const country = item.country_name || "Unknown";
      const existing = acc.find(c => c.country === country);
      
      if (existing) {
        existing.clicks += item.total_clicks || 0;
        existing.sessions += item.unique_sessions || 0;
      } else {
        acc.push({
          country,
          clicks: item.total_clicks || 0,
          sessions: item.unique_sessions || 0,
          ctr: item.valid_rate || 0
        });
      }
      
      return acc;
    }, [] as CountryData[])
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const productData: ProductData[] = analytics
    .filter(item => item.product)
    .reduce((acc, item) => {
      const product = item.product || "Unknown";
      const existing = acc.find(p => p.product === product);
      
      if (existing) {
        existing.clicks += item.total_clicks || 0;
        existing.validRate = ((existing.validRate + (item.valid_rate || 0)) / 2);
      } else {
        acc.push({
          product,
          clicks: item.total_clicks || 0,
          validRate: item.valid_rate || 0
        });
      }
      
      return acc;
    }, [] as ProductData[])
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#a8dadc', '#f4a261'];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">All tracked clicks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValidClicks}</div>
            <p className="text-xs text-muted-foreground">
              {totalClicks > 0 ? `${((totalValidClicks / totalClicks) * 100).toFixed(1)}% valid rate` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">From AI recommendations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCTR.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Products</CardTitle>
            <CardDescription>Most clicked products from AI recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="product" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="clicks" fill="hsl(var(--primary))" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Country Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Clicks by Country</CardTitle>
            <CardDescription>Geographic distribution of link clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={countryData}
                  dataKey="clicks"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.country}: ${entry.clicks}`}
                >
                  {countryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Link Performance Details</CardTitle>
          <CardDescription>Detailed analytics for each tracked link</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Total Clicks</TableHead>
                <TableHead className="text-right">Valid Clicks</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Valid Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No link analytics available yet
                  </TableCell>
                </TableRow>
              ) : (
                analytics.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.product || "Unknown"}
                    </TableCell>
                    <TableCell>{item.country_name || "Unknown"}</TableCell>
                    <TableCell>{item.source || "direct"}</TableCell>
                    <TableCell className="text-right">{item.total_clicks}</TableCell>
                    <TableCell className="text-right">{item.valid_clicks}</TableCell>
                    <TableCell className="text-right">{item.unique_sessions}</TableCell>
                    <TableCell className="text-right">
                      {item.valid_rate ? `${item.valid_rate.toFixed(1)}%` : "0%"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
