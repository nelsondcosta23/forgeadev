import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe, FileText, Search, Share2, Languages, Map, BarChart3, Copy, AlertCircle, XCircle, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

type ValidationResult = {
  category: string;
  items: {
    label: string;
    status: 'success' | 'warning' | 'error';
    message: string;
  }[];
};

export const SEOMarketing = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const validateSEO = () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    // Meta Tags Básicas
    const basicMeta: ValidationResult = {
      category: 'Meta Tags Básicas',
      items: []
    };

    const title = document.querySelector('title')?.textContent || '';
    if (title) {
      if (title.length > 60) {
        basicMeta.items.push({
          label: 'Title Tag',
          status: 'warning',
          message: `Title muito longo (${title.length} caracteres). Recomendado: < 60 caracteres.`
        });
      } else {
        basicMeta.items.push({
          label: 'Title Tag',
          status: 'success',
          message: `Title correto (${title.length} caracteres): "${title}"`
        });
      }
    } else {
      basicMeta.items.push({
        label: 'Title Tag',
        status: 'error',
        message: 'Title tag não encontrado'
      });
    }

    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    if (description) {
      if (description.length > 160) {
        basicMeta.items.push({
          label: 'Meta Description',
          status: 'warning',
          message: `Description muito longa (${description.length} caracteres). Recomendado: < 160 caracteres.`
        });
      } else {
        basicMeta.items.push({
          label: 'Meta Description',
          status: 'success',
          message: `Description correta (${description.length} caracteres)`
        });
      }
    } else {
      basicMeta.items.push({
        label: 'Meta Description',
        status: 'error',
        message: 'Meta description não encontrada'
      });
    }

    results.push(basicMeta);

    // Open Graph Tags
    const ogMeta: ValidationResult = {
      category: 'Open Graph Tags',
      items: []
    };

    const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
    ogTags.forEach(tag => {
      const element = document.querySelector(`meta[property="${tag}"]`);
      if (element?.getAttribute('content')) {
        ogMeta.items.push({
          label: tag,
          status: 'success',
          message: `Configurado: ${element.getAttribute('content')?.substring(0, 50)}...`
        });
      } else {
        ogMeta.items.push({
          label: tag,
          status: 'error',
          message: `Tag ${tag} não encontrada`
        });
      }
    });

    results.push(ogMeta);

    // Twitter Card Tags
    const twitterMeta: ValidationResult = {
      category: 'Twitter Card Tags',
      items: []
    };

    const twitterTags = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    twitterTags.forEach(tag => {
      const element = document.querySelector(`meta[property="${tag}"]`);
      if (element?.getAttribute('content')) {
        twitterMeta.items.push({
          label: tag,
          status: 'success',
          message: 'Configurado'
        });
      } else {
        twitterMeta.items.push({
          label: tag,
          status: 'error',
          message: `Tag ${tag} não encontrada`
        });
      }
    });

    results.push(twitterMeta);

    // Hreflang Tags
    const hreflangMeta: ValidationResult = {
      category: 'Hreflang Tags (SEO Internacional)',
      items: []
    };

    const hreflangLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
    const expectedHreflangs = ['en-us', 'en-gb', 'pt-pt', 'pt-br', 'es', 'fr', 'de', 'x-default'];
    const foundHreflangs = Array.from(hreflangLinks).map(link => link.getAttribute('hreflang'));

    expectedHreflangs.forEach(lang => {
      if (foundHreflangs.includes(lang)) {
        hreflangMeta.items.push({
          label: lang,
          status: 'success',
          message: `Tag hreflang="${lang}" presente`
        });
      } else {
        hreflangMeta.items.push({
          label: lang,
          status: 'warning',
          message: `Tag hreflang="${lang}" não encontrada`
        });
      }
    });

    results.push(hreflangMeta);

    // HTML Lang Attribute
    const htmlLang: ValidationResult = {
      category: 'Atributos HTML',
      items: []
    };

    const langAttr = document.documentElement.lang;
    if (langAttr) {
      htmlLang.items.push({
        label: 'Lang Attribute',
        status: 'success',
        message: `HTML lang="${langAttr}" configurado`
      });
    } else {
      htmlLang.items.push({
        label: 'Lang Attribute',
        status: 'error',
        message: 'Atributo lang não encontrado no HTML'
      });
    }

    results.push(htmlLang);

    setValidationResults(results);
    setIsValidating(false);
    toast.success('Validação SEO concluída!');
  };

  const copyRealSEO = () => {
    const currentUrl = window.location.origin;
    
    const seoReport = `
SEO ATUAL DO SITE
=================

META TAGS DINÂMICAS
-------------------
✓ Title tags dinâmicos por idioma (< 60 caracteres)
✓ Meta descriptions otimizadas (< 160 caracteres)
✓ Open Graph tags (og:title, og:description, og:url, og:type, og:image, og:locale)
✓ Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
✓ Meta tags atualizadas em tempo real com mudança de idioma

SEO INTERNACIONAL
-----------------
✓ Hreflang tags para 7 idiomas: en-US, en-GB, pt-PT, pt-BR, es, fr, de
✓ Tag x-default apontando para en-US
✓ Atributo lang no HTML atualizado dinamicamente
✓ Locale alternativas nas Open Graph tags

ESTRUTURA E SEMÂNTICA
---------------------
✓ HTML semântico (header, main, section, article)
✓ Um único H1 por página com palavra-chave principal
✓ Hierarquia de headings (H1, H2, H3) bem estruturada
✓ Alt text descritivo em todas as imagens
✓ URLs limpas e descritivas

SITEMAP & ROBOTS
----------------
✓ Sitemap.xml multilingue: ${currentUrl}/sitemap.xml
  - Homepage: ${currentUrl}/
  - Privacy Policy: ${currentUrl}/privacy
  - Terms: ${currentUrl}/terms
  - Hreflang alternates em cada URL
  - Prioridades: 1.0 (home), 0.5 (outras)
  - Frequência: weekly (home), monthly (outras)

✓ Robots.txt: ${currentUrl}/robots.txt
  - Permite todos os bots (Googlebot, Bingbot, Twitterbot, facebookexternalhit)
  - Referência ao sitemap

PERFORMANCE
-----------
✓ Meta viewport para responsividade
✓ Charset UTF-8 configurado
✓ Preload de recursos críticos
✓ Otimização de imagens com lazy loading

REDES SOCIAIS
-------------
✓ Open Graph image: ${currentUrl}/images/og-image.png
✓ Twitter Card com imagem de preview
✓ Títulos e descrições otimizados para partilha
✓ URL canônicas para evitar conteúdo duplicado
`;

    copyToClipboard(seoReport.trim(), "SEO Atual");
  };

  const seoFeatures = [
    {
      category: "Meta Tags Dinâmicas",
      icon: <FileText className="h-5 w-5" />,
      items: [
        "Title tags dinâmicos por idioma (< 60 caracteres)",
        "Meta descriptions otimizadas (< 160 caracteres)",
        "Open Graph tags para redes sociais",
        "Twitter Card tags para Twitter/X",
        "Meta tags atualizadas em tempo real com mudança de idioma",
      ],
    },
    {
      category: "SEO Internacional",
      icon: <Languages className="h-5 w-5" />,
      items: [
        "Hreflang tags para 7 idiomas (en-US, en-GB, pt-PT, pt-BR, es, fr, de)",
        "Tags x-default apontando para en-US",
        "Atributo lang no HTML atualizado dinamicamente",
        "Locale alternativas indicadas nas Open Graph tags",
      ],
    },
    {
      category: "Estrutura e Semântica",
      icon: <Search className="h-5 w-5" />,
      items: [
        "HTML semântico (header, main, section, article)",
        "Um único H1 por página com palavra-chave principal",
        "Hierarquia de headings (H1, H2, H3) bem estruturada",
        "Alt text descritivo em todas as imagens",
        "URLs limpas e descritivas",
      ],
    },
    {
      category: "Sitemap & Robots",
      icon: <Map className="h-5 w-5" />,
      items: [
        "Sitemap.xml multilingue com todas as páginas",
        "Hreflang alternates no sitemap para cada URL",
        "Robots.txt configurado com referência ao sitemap",
        "Prioridades e frequências de atualização definidas",
      ],
    },
    {
      category: "Performance",
      icon: <Globe className="h-5 w-5" />,
      items: [
        "Meta viewport para responsividade",
        "Charset UTF-8 configurado",
        "Preload de recursos críticos",
        "Otimização de imagens com lazy loading",
      ],
    },
    {
      category: "Redes Sociais",
      icon: <Share2 className="h-5 w-5" />,
      items: [
        "Open Graph image (og:image) configurada",
        "Twitter Card com imagem de preview",
        "Títulos e descrições otimizados para partilha",
        "URL canônicas para evitar conteúdo duplicado",
      ],
    },
  ];

  const implementedPages = [
    { path: "/", name: "Homepage (Quiz)", status: "Implementado" },
    { path: "/privacy", name: "Privacy Policy", status: "Implementado" },
    { path: "/terms", name: "Terms and Conditions", status: "Implementado" },
    { path: "/build/:id", name: "Shared Results", status: "Implementado" },
  ];

  const availableLanguages = [
    { code: "en-US", name: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
    { code: "pt-PT", name: "Português (Portugal)", flag: "🇵🇹" },
    { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
    { code: "es", name: "Español", flag: "🇪🇸" },
    { code: "fr", name: "Français", flag: "🇫🇷" },
    { code: "de", name: "Deutsch", flag: "🇩🇪" },
  ];

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="overview">
          <Search className="h-4 w-4 mr-2" />
          SEO Overview
        </TabsTrigger>
        <TabsTrigger value="analytics">
          <BarChart3 className="h-4 w-4 mr-2" />
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO & Marketing Overview
              </CardTitle>
              <CardDescription>
                Práticas de SEO implementadas neste site para melhor indexação e visibilidade nos motores de busca
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" onClick={validateSEO}>
                  <Shield className="h-4 w-4 mr-2" />
                  Validar SEO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Relatório de Validação SEO
                  </DialogTitle>
                  <DialogDescription>
                    Análise automática das meta tags e configurações de SEO do site
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 mt-4">
                  {validationResults.length === 0 && !isValidating && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Clique em "Validar SEO" para verificar as configurações
                    </p>
                  )}
                  {isValidating && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Validando...
                    </p>
                  )}
                  {validationResults.map((result, idx) => (
                    <div key={idx}>
                      <h3 className="font-semibold mb-3">{result.category}</h3>
                      <div className="space-y-2">
                        {result.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                          >
                            {item.status === 'success' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            )}
                            {item.status === 'warning' && (
                              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            )}
                            {item.status === 'error' && (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {idx < validationResults.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">7</div>
              <div className="text-sm text-muted-foreground">Idiomas Suportados</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">4</div>
              <div className="text-sm text-muted-foreground">Páginas Indexadas</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Otimização SEO</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO Features */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Práticas de SEO Implementadas</CardTitle>
              <CardDescription>
                Todas as técnicas e otimizações aplicadas para melhorar o ranking nos motores de busca
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyRealSEO}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {seoFeatures.map((feature, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-primary">{feature.icon}</div>
                  <h3 className="font-semibold">{feature.category}</h3>
                </div>
                <ul className="space-y-2 ml-7">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                {index < seoFeatures.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Idiomas Disponíveis
          </CardTitle>
          <CardDescription>
            Todos os idiomas configurados com meta tags e hreflang tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {availableLanguages.map((lang) => (
              <div
                key={lang.code}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <div className="font-medium">{lang.name}</div>
                    <div className="text-xs text-muted-foreground">{lang.code}</div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const json = JSON.stringify({
                      code: lang.code,
                      name: lang.name,
                      flag: lang.flag
                    }, null, 2);
                    copyToClipboard(json, lang.name);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Implemented Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Páginas no Sitemap
          </CardTitle>
          <CardDescription>
            Páginas incluídas no sitemap.xml multilingue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {implementedPages.map((page, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div>
                  <div className="font-medium">{page.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">{page.path}</div>
                </div>
                <Badge variant="default" className="bg-green-500">
                  {page.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Files */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Ficheiros Técnicos</CardTitle>
              <CardDescription>
                Arquivos de configuração para motores de busca
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const text = `/sitemap.xml - Sitemap multilingue com hreflang tags
/robots.txt - Instruções para crawlers com referência ao sitemap
DynamicMetaTags.tsx - Componente que gere meta tags dinâmicas`;
                copyToClipboard(text, "Ficheiros Técnicos");
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="font-medium font-mono">/sitemap.xml</div>
                <div className="text-sm text-muted-foreground">
                  Sitemap multilingue com hreflang tags
                </div>
              </div>
              <Badge variant="default">✓ Ativo</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="font-medium font-mono">/robots.txt</div>
                <div className="text-sm text-muted-foreground">
                  Instruções para crawlers com referência ao sitemap
                </div>
              </div>
              <Badge variant="default">✓ Ativo</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="font-medium font-mono">DynamicMetaTags.tsx</div>
                <div className="text-sm text-muted-foreground">
                  Componente que gere meta tags dinâmicas
                </div>
              </div>
              <Badge variant="default">✓ Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        <AnalyticsDashboard />
      </TabsContent>
    </Tabs>
  );
};
