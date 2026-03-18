import { useState, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Play,
  Loader2,
  BookOpen,
  Key,
  Shield,
  Zap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { getOpenApiSpec } from "@/lib/openapi-spec";

const methodStyles: Record<string, { bg: string; badge: string; border: string }> = {
  get: {
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    border: "border-emerald-500/30",
  },
  post: {
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    border: "border-blue-500/30",
  },
  put: {
    bg: "bg-amber-500/5",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    border: "border-amber-500/30",
  },
  delete: {
    bg: "bg-red-500/5",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    border: "border-red-500/30",
  },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative group">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
      <pre className="bg-background rounded-lg p-4 overflow-x-auto text-xs font-mono text-foreground/80 border border-border">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface TryItOutProps {
  method: string;
  path: string;
  baseUrl: string;
  parameters?: any[];
  requestBody?: any;
}

function TryItOut({ method, path, baseUrl, parameters, requestBody }: TryItOutProps) {
  const [apiKey, setApiKey] = useState("");
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState(
    requestBody
      ? JSON.stringify(
          getExampleFromSchema(
            requestBody?.content?.["application/json"]?.schema
          ),
          null,
          2
        )
      : ""
  );
  const [response, setResponse] = useState<{ status: number; body: string; duration: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const pathParamsList = (parameters || []).filter((p: any) => p.in === "path");
  const queryParamsList = (parameters || []).filter((p: any) => p.in === "query");

  const execute = async () => {
    if (!apiKey) {
      toast.error("Insira sua API Key para testar");
      return;
    }

    let url = path;
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, value);
    }

    const qp = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) qp.set(key, value);
    }
    const queryString = qp.toString();
    const fullUrl = `${baseUrl}${url}${queryString ? `?${queryString}` : ""}`;

    setLoading(true);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      };

      const options: RequestInit = { method: method.toUpperCase(), headers };
      if (body && ["post", "put", "patch"].includes(method)) {
        options.body = body;
      }

      const res = await fetch(fullUrl, options);
      const duration = Math.round(performance.now() - start);
      const text = await res.text();

      let formatted = text;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {}

      setResponse({ status: res.status, body: formatted, duration });
    } catch (err: any) {
      setResponse({
        status: 0,
        body: `Erro de rede: ${err.message}`,
        duration: Math.round(performance.now() - start),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="sk_sua_chave_api_aqui"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="font-mono text-xs h-8"
          type="password"
        />
      </div>

      {pathParamsList.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Parâmetros de URL</p>
          {pathParamsList.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded min-w-[60px]">{p.name}</code>
              <Input
                placeholder={p.schema?.format || p.schema?.type || "valor"}
                value={pathParams[p.name] || ""}
                onChange={(e) => setPathParams({ ...pathParams, [p.name]: e.target.value })}
                className="font-mono text-xs h-8"
              />
            </div>
          ))}
        </div>
      )}

      {queryParamsList.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Query Parameters</p>
          {queryParamsList.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded min-w-[80px]">{p.name}</code>
              <Input
                placeholder={
                  p.schema?.default !== undefined
                    ? String(p.schema.default)
                    : p.description || ""
                }
                value={queryParams[p.name] || ""}
                onChange={(e) => setQueryParams({ ...queryParams, [p.name]: e.target.value })}
                className="font-mono text-xs h-8"
              />
            </div>
          ))}
        </div>
      )}

      {requestBody && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Request Body</p>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="font-mono text-xs min-h-[120px]"
          />
        </div>
      )}

      <Button
        onClick={execute}
        disabled={loading}
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        ) : (
          <Play className="h-3.5 w-3.5 mr-1.5" />
        )}
        Executar
      </Button>

      {response && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant="outline"
              className={
                response.status >= 200 && response.status < 300
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : response.status >= 400
                  ? "bg-red-500/15 text-red-400 border-red-500/30"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/30"
              }
            >
              {response.status || "ERR"}
            </Badge>
            <span className="text-muted-foreground">{response.duration}ms</span>
          </div>
          <CodeBlock code={response.body} />
        </div>
      )}
    </div>
  );
}

function getExampleFromSchema(schema: any): any {
  if (!schema) return {};
  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    const spec = getOpenApiSpec();
    const refSchema = (spec.components?.schemas as any)?.[refName];
    return refSchema ? getExampleFromSchema(refSchema) : {};
  }
  if (schema.type === "object" && schema.properties) {
    const obj: Record<string, any> = {};
    for (const [key, prop] of Object.entries<any>(schema.properties)) {
      if (prop.example !== undefined) obj[key] = prop.example;
      else if (prop.type === "string") obj[key] = prop.format === "uuid" ? "uuid" : "";
      else if (prop.type === "integer" || prop.type === "number") obj[key] = 0;
    }
    return obj;
  }
  return {};
}

function resolveSchema(schema: any, spec: any): any {
  if (!schema) return null;
  if (schema.$ref) {
    const refName = schema.$ref.split("/").pop();
    return spec.components?.schemas?.[refName];
  }
  return schema;
}

function SchemaView({ schema, spec }: { schema: any; spec: any }) {
  const resolved = resolveSchema(schema, spec);
  if (!resolved?.properties) return null;

  return (
    <div className="space-y-1">
      {Object.entries<any>(resolved.properties).map(([name, prop]) => (
        <div key={name} className="flex items-start gap-2 text-xs">
          <code className="bg-muted px-1.5 py-0.5 rounded text-foreground/90">{name}</code>
          <span className="text-muted-foreground">
            {prop.type || "string"}
            {prop.format ? ` (${prop.format})` : ""}
          </span>
          {resolved.required?.includes(name) && (
            <Badge variant="outline" className="text-[9px] h-4 px-1 border-red-500/30 text-red-400">
              obrigatório
            </Badge>
          )}
          {prop.example !== undefined && (
            <span className="text-muted-foreground/60 italic">ex: {String(prop.example)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function EndpointBlock({
  method,
  path,
  operation,
  baseUrl,
  spec,
}: {
  method: string;
  path: string;
  operation: any;
  baseUrl: string;
  spec: any;
}) {
  const [open, setOpen] = useState(false);
  const [tryIt, setTryIt] = useState(false);
  const style = methodStyles[method] || methodStyles.get;

  const responseSchema =
    operation.responses?.["200"]?.content?.["application/json"]?.schema ||
    operation.responses?.["201"]?.content?.["application/json"]?.schema;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg border ${style.border} ${style.bg}`}
        >
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Badge variant="outline" className={`${style.badge} font-mono text-[11px] min-w-[60px] justify-center`}>
            {method.toUpperCase()}
          </Badge>
          <code className="text-sm font-mono text-foreground">{path}</code>
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
            {operation.summary}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={`ml-4 mr-2 mb-4 mt-1 p-4 space-y-4 rounded-b-lg border-x border-b ${style.border} bg-card`}>
          <p className="text-sm text-muted-foreground">{operation.description || operation.summary}</p>

          {operation.parameters?.filter((p: any) => p.in === "query").length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Query Parameters
              </p>
              <div className="space-y-1">
                {operation.parameters
                  .filter((p: any) => p.in === "query")
                  .map((p: any) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <code className="bg-muted px-1.5 py-0.5 rounded">{p.name}</code>
                      <span className="text-muted-foreground">
                        {p.schema?.type}
                        {p.schema?.default !== undefined ? ` (default: ${p.schema.default})` : ""}
                      </span>
                      <span className="text-muted-foreground/60">— {p.description}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {operation.requestBody && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Request Body Schema
              </p>
              <SchemaView
                schema={operation.requestBody.content?.["application/json"]?.schema}
                spec={spec}
              />
            </div>
          )}

          {responseSchema && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Response Schema
              </p>
              <SchemaView schema={responseSchema} spec={spec} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant={tryIt ? "secondary" : "outline"}
              size="sm"
              onClick={() => setTryIt(!tryIt)}
              className="text-xs"
            >
              <Play className="h-3 w-3 mr-1" />
              {tryIt ? "Fechar" : "Try it out"}
            </Button>
          </div>

          {tryIt && (
            <TryItOut
              method={method}
              path={path}
              baseUrl={baseUrl}
              parameters={operation.parameters}
              requestBody={operation.requestBody}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function ApiDocumentation() {
  const spec = useMemo(() => getOpenApiSpec(), []);
  const baseUrl = spec.servers?.[0]?.url || "";

  const groupedByTag = useMemo(() => {
    const groups: Record<string, { method: string; path: string; operation: any }[]> = {};
    for (const tag of spec.tags || []) {
      groups[tag.name] = [];
    }

    for (const [path, methods] of Object.entries<any>(spec.paths || {})) {
      for (const [method, operation] of Object.entries<any>(methods)) {
        if (["get", "post", "put", "delete", "patch"].includes(method)) {
          const tag = operation.tags?.[0] || "Outros";
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push({ method, path, operation });
        }
      }
    }
    return groups;
  }, [spec]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{spec.info.title}</h1>
            <Badge variant="outline" className="text-xs">
              OpenAPI {spec.openapi}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Documentação interativa — teste chamadas ao vivo direto no navegador
          </p>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Key className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Autenticação</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Header <code className="bg-muted px-1 rounded">x-api-key</code> com chave gerada em Configurações → Integrações.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Escopos</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <code className="bg-muted px-1 rounded">read</code> GET ·{" "}
                  <code className="bg-muted px-1 rounded">write</code> POST/PUT/DELETE ·{" "}
                  <code className="bg-muted px-1 rounded">admin</code> todos
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 pt-6">
              <Zap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">Base URL</h3>
                <div className="flex items-center gap-1 mt-1">
                  <code className="text-xs bg-muted px-1 rounded break-all">{baseUrl}</code>
                  <CopyButton text={baseUrl} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auth guide */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Card className="cursor-pointer hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4" />
                  Guia de Autenticação
                  <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                </CardTitle>
              </CardHeader>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-1">
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Acesse <strong>Configurações → Integrações → API Externa</strong> e crie uma chave de API.</p>
                  <p>2. Copie a chave gerada (ela não será exibida novamente).</p>
                  <p>3. Inclua a chave em todas as requisições via header:</p>
                </div>
                <CodeBlock
                  code={`curl -X GET "${baseUrl}/vehicles" \\
  -H "x-api-key: sk_sua_chave_aqui" \\
  -H "Content-Type: application/json"`}
                />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-1">Códigos de status:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      ["200", "Sucesso"],
                      ["201", "Criado"],
                      ["400", "Requisição inválida"],
                      ["401", "Não autenticado"],
                      ["403", "Sem permissão"],
                      ["404", "Não encontrado"],
                      ["422", "Erro de validação"],
                      ["500", "Erro interno"],
                    ].map(([code, desc]) => (
                      <div key={code} className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">{code}</Badge>
                        <span>{desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Endpoints by tag */}
        <div className="space-y-6">
          {Object.entries(groupedByTag).map(([tag, endpoints]) => {
            const tagInfo = spec.tags?.find((t: any) => t.name === tag);
            return (
              <div key={tag}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-lg font-semibold text-foreground">{tag}</h2>
                  {tagInfo?.description && (
                    <span className="text-xs text-muted-foreground">— {tagInfo.description}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {endpoints.map((ep, i) => (
                    <EndpointBlock
                      key={`${ep.method}-${ep.path}-${i}`}
                      method={ep.method}
                      path={ep.path}
                      operation={ep.operation}
                      baseUrl={baseUrl}
                      spec={spec}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Models section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Schemas</h2>
          <div className="space-y-2">
            {Object.entries<any>(spec.components?.schemas || {}).map(([name, schema]) => (
              <Collapsible key={name}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <code className="text-sm font-semibold text-foreground">{name}</code>
                    <span className="text-xs text-muted-foreground">
                      {schema.type} · {Object.keys(schema.properties || {}).length} campos
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-4 p-3 border-l border-border">
                    <SchemaView schema={schema} spec={spec} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
