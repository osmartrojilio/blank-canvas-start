import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plug, 
  ExternalLink, 
  Webhook, 
  FileSpreadsheet, 
  Calculator, 
  Plus, 
  Key, 
  Copy, 
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
  useWebhookLogs,
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useErpIntegration,
  useUpsertErpIntegration,
  useAccountingIntegration,
  useUpsertAccountingIntegration,
  WEBHOOK_EVENTS,
  ERP_PROVIDERS,
  ACCOUNTING_PROVIDERS,
} from "@/hooks/useIntegrations";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function IntegracoesSettings() {
  const [activeTab, setActiveTab] = useState("webhooks");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Integrações
          </CardTitle>
          <CardDescription>
            Conecte o sistema a outras ferramentas via APIs e webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Webhook className="h-4 w-4" />
                <span className="hidden sm:inline">Webhooks</span>
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="hidden sm:inline">API</span>
              </TabsTrigger>
              <TabsTrigger value="erp" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">ERP</span>
              </TabsTrigger>
              <TabsTrigger value="contabilidade" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Contabilidade</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks" className="mt-6">
              <WebhooksTab />
            </TabsContent>

            <TabsContent value="api" className="mt-6">
              <ApiKeysTab />
            </TabsContent>

            <TabsContent value="erp" className="mt-6">
              <ErpTab />
            </TabsContent>

            <TabsContent value="contabilidade" className="mt-6">
              <AccountingTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhooksTab() {
  const { data: webhooks, isLoading } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState<string | null>(null);
  const [showSecretFor, setShowSecretFor] = useState<string | null>(null);
  
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  });

  const handleCreate = () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      toast.error("Preencha todos os campos");
      return;
    }
    createWebhook.mutate(newWebhook, {
      onSuccess: () => {
        setShowCreateDialog(false);
        setNewWebhook({ name: "", url: "", events: [] });
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Webhooks</h3>
          <p className="text-sm text-muted-foreground">
            Receba notificações em tempo real quando eventos ocorrerem no sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {webhooks && webhooks.length > 0 ? (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{webhook.name}</span>
                  <Badge variant={webhook.is_active ? "default" : "secondary"}>
                    {webhook.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {webhook.url}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{webhook.events.length} eventos</span>
                  {webhook.last_triggered_at && (
                    <>
                      <span>•</span>
                      <span>
                        Último disparo: {format(new Date(webhook.last_triggered_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecretFor(showSecretFor === webhook.id ? null : webhook.id)}
                >
                  {showSecretFor === webhook.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLogsDialog(webhook.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Switch
                  checked={webhook.is_active}
                  onCheckedChange={(checked) =>
                    updateWebhook.mutate({ id: webhook.id, is_active: checked })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteWebhook.mutate(webhook.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              {showSecretFor === webhook.id && (
                <div className="absolute mt-16 p-2 bg-muted rounded text-xs font-mono flex items-center gap-2">
                  {webhook.secret}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard(webhook.secret)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum webhook configurado</p>
          <p className="text-sm">Crie um webhook para receber notificações em tempo real</p>
        </div>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um endpoint para receber notificações de eventos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Nome</Label>
              <Input
                id="webhook-name"
                placeholder="Ex: Notificações ERP"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL do Endpoint</Label>
              <Input
                id="webhook-url"
                placeholder="https://seu-sistema.com/webhooks"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Eventos</Label>
              <ScrollArea className="h-48 rounded-md border p-4">
                <div className="space-y-2">
                  {WEBHOOK_EVENTS.map((event) => (
                    <div key={event.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.value}
                        checked={newWebhook.events.includes(event.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewWebhook({
                              ...newWebhook,
                              events: [...newWebhook.events, event.value],
                            });
                          } else {
                            setNewWebhook({
                              ...newWebhook,
                              events: newWebhook.events.filter((e) => e !== event.value),
                            });
                          }
                        }}
                      />
                      <label htmlFor={event.value} className="text-sm cursor-pointer">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createWebhook.isPending}>
              {createWebhook.isPending ? "Criando..." : "Criar Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <WebhookLogsDialog
        webhookId={showLogsDialog}
        onClose={() => setShowLogsDialog(null)}
      />
    </div>
  );
}

function WebhookLogsDialog({ webhookId, onClose }: { webhookId: string | null; onClose: () => void }) {
  const { data: logs, isLoading } = useWebhookLogs(webhookId || undefined);

  if (!webhookId) return null;

  return (
    <Dialog open={!!webhookId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Logs de Entrega</DialogTitle>
          <DialogDescription>
            Histórico de entregas do webhook
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : logs && logs.length > 0 ? (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded border text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-destructive" />
                      )}
                      <span className="font-medium">{log.event_type}</span>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.response_status || "Erro"}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(log.delivered_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </span>
                  </div>
                  {log.response_body && (
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {log.response_body.substring(0, 200)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum log encontrado
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ApiKeysTab() {
  const { data: apiKeys, isLoading } = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    scopes: ["read"] as string[],
    expires_in_days: undefined as number | undefined,
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newApiKey.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createApiKey.mutate(newApiKey, {
      onSuccess: (data) => {
        setGeneratedKey(data.api_key);
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setNewApiKey({ name: "", scopes: ["read"], expires_in_days: undefined });
    setGeneratedKey(null);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Chaves de API</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie chaves de acesso para integração via API REST
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Chave
        </Button>
      </div>

      {apiKeys && apiKeys.length > 0 ? (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{key.name}</span>
                  <Badge variant={key.is_active ? "default" : "secondary"}>
                    {key.is_active ? "Ativa" : "Revogada"}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-muted-foreground">
                  {key.key_prefix}...
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Escopos: {key.scopes.join(", ")}</span>
                  {key.expires_at && (
                    <>
                      <span>•</span>
                      <span>Expira: {format(new Date(key.expires_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </>
                  )}
                  {key.last_used_at && (
                    <>
                      <span>•</span>
                      <span>Último uso: {format(new Date(key.last_used_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {key.is_active && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revokeApiKey.mutate(key.id)}
                    disabled={revokeApiKey.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revogar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma chave de API configurada</p>
          <p className="text-sm">Crie uma chave para acessar a API do sistema</p>
        </div>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {generatedKey ? "Chave Criada com Sucesso" : "Nova Chave de API"}
            </DialogTitle>
            <DialogDescription>
              {generatedKey
                ? "Copie a chave agora. Ela não será exibida novamente."
                : "Crie uma nova chave para acessar a API do sistema"}
            </DialogDescription>
          </DialogHeader>

          {generatedKey ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription className="font-mono break-all">
                  {generatedKey}
                </AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => copyToClipboard(generatedKey)}>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Chave
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nome</Label>
                <Input
                  id="key-name"
                  placeholder="Ex: Integração ERP"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="space-y-2">
                  {["read", "write", "delete"].map((scope) => (
                    <div key={scope} className="flex items-center space-x-2">
                      <Checkbox
                        id={scope}
                        checked={newApiKey.scopes.includes(scope)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewApiKey({
                              ...newApiKey,
                              scopes: [...newApiKey.scopes, scope],
                            });
                          } else {
                            setNewApiKey({
                              ...newApiKey,
                              scopes: newApiKey.scopes.filter((s) => s !== scope),
                            });
                          }
                        }}
                      />
                      <label htmlFor={scope} className="text-sm cursor-pointer capitalize">
                        {scope === "read" ? "Leitura" : scope === "write" ? "Escrita" : "Exclusão"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expiração (dias, opcional)</Label>
                <Input
                  id="expires"
                  type="number"
                  placeholder="Ex: 90 (deixe vazio para nunca expirar)"
                  value={newApiKey.expires_in_days || ""}
                  onChange={(e) =>
                    setNewApiKey({
                      ...newApiKey,
                      expires_in_days: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {generatedKey ? (
              <Button onClick={handleCloseDialog}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createApiKey.isPending}>
                  {createApiKey.isPending ? "Criando..." : "Criar Chave"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          A documentação da API está disponível em{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            /api/docs
          </code>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ErpTab() {
  const { data: erpIntegration, isLoading } = useErpIntegration();
  const upsertErp = useUpsertErpIntegration();

  const [config, setConfig] = useState({
    provider: erpIntegration?.provider || "",
    api_endpoint: erpIntegration?.api_endpoint || "",
    sync_vehicles: erpIntegration?.sync_vehicles ?? true,
    sync_trips: erpIntegration?.sync_trips ?? true,
    sync_expenses: erpIntegration?.sync_expenses ?? true,
    sync_fuel: erpIntegration?.sync_fuel ?? true,
    is_active: erpIntegration?.is_active ?? false,
  });

  const handleSave = () => {
    if (!config.provider) {
      toast.error("Selecione um provedor");
      return;
    }
    upsertErp.mutate(config);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integração ERP</h3>
        <p className="text-sm text-muted-foreground">
          Sincronize dados automaticamente com seu sistema de gestão empresarial
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label>Provedor ERP</Label>
          <Select
            value={config.provider}
            onValueChange={(value) => setConfig({ ...config, provider: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              {ERP_PROVIDERS.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.provider && (
          <>
            <div className="space-y-2">
              <Label htmlFor="erp-endpoint">Endpoint da API</Label>
              <Input
                id="erp-endpoint"
                placeholder="https://seu-erp.com/api/v1"
                value={config.api_endpoint}
                onChange={(e) => setConfig({ ...config, api_endpoint: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <Label>Dados para sincronizar</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sync-vehicles"
                    checked={config.sync_vehicles}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, sync_vehicles: checked as boolean })
                    }
                  />
                  <label htmlFor="sync-vehicles" className="text-sm cursor-pointer">
                    Veículos
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sync-trips"
                    checked={config.sync_trips}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, sync_trips: checked as boolean })
                    }
                  />
                  <label htmlFor="sync-trips" className="text-sm cursor-pointer">
                    Viagens
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sync-expenses"
                    checked={config.sync_expenses}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, sync_expenses: checked as boolean })
                    }
                  />
                  <label htmlFor="sync-expenses" className="text-sm cursor-pointer">
                    Despesas
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sync-fuel"
                    checked={config.sync_fuel}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, sync_fuel: checked as boolean })
                    }
                  />
                  <label htmlFor="sync-fuel" className="text-sm cursor-pointer">
                    Abastecimentos
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Ativar integração</p>
                <p className="text-sm text-muted-foreground">
                  A sincronização será executada automaticamente
                </p>
              </div>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
            </div>

            {erpIntegration?.last_sync_at && (
              <p className="text-sm text-muted-foreground">
                Última sincronização:{" "}
                {format(new Date(erpIntegration.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={upsertErp.isPending}>
                {upsertErp.isPending ? "Salvando..." : "Salvar Configuração"}
              </Button>
              {config.is_active && (
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AccountingTab() {
  const { data: accountingIntegration, isLoading } = useAccountingIntegration();
  const upsertAccounting = useUpsertAccountingIntegration();

  const [config, setConfig] = useState({
    provider: accountingIntegration?.provider || "",
    api_endpoint: accountingIntegration?.api_endpoint || "",
    export_format: accountingIntegration?.export_format || "csv",
    auto_export: accountingIntegration?.auto_export ?? false,
    export_day: accountingIntegration?.export_day ?? 1,
    is_active: accountingIntegration?.is_active ?? false,
  });

  const handleSave = () => {
    if (!config.provider) {
      toast.error("Selecione um provedor");
      return;
    }
    upsertAccounting.mutate(config);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Integração Contábil</h3>
        <p className="text-sm text-muted-foreground">
          Exporte dados automaticamente para seu software de contabilidade
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label>Provedor/Formato</Label>
          <Select
            value={config.provider}
            onValueChange={(value) => setConfig({ ...config, provider: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              {ACCOUNTING_PROVIDERS.map((provider) => (
                <SelectItem key={provider.value} value={provider.value}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.provider && (
          <>
            {config.provider !== "custom" && (
              <div className="space-y-2">
                <Label htmlFor="accounting-endpoint">Endpoint da API</Label>
                <Input
                  id="accounting-endpoint"
                  placeholder="https://api.contabilidade.com/v1"
                  value={config.api_endpoint}
                  onChange={(e) => setConfig({ ...config, api_endpoint: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Formato de exportação</Label>
              <Select
                value={config.export_format}
                onValueChange={(value) => setConfig({ ...config, export_format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="ofx">OFX</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Exportação automática</p>
                <p className="text-sm text-muted-foreground">
                  Exportar dados automaticamente todo mês
                </p>
              </div>
              <Switch
                checked={config.auto_export}
                onCheckedChange={(checked) => setConfig({ ...config, auto_export: checked })}
              />
            </div>

            {config.auto_export && (
              <div className="space-y-2">
                <Label>Dia da exportação</Label>
                <Select
                  value={String(config.export_day)}
                  onValueChange={(value) => setConfig({ ...config, export_day: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 5, 10, 15, 20, 25].map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <p className="font-medium">Ativar integração</p>
                <p className="text-sm text-muted-foreground">
                  {config.provider === "custom"
                    ? "Habilita exportações manuais"
                    : "A exportação será executada automaticamente"}
                </p>
              </div>
              <Switch
                checked={config.is_active}
                onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
              />
            </div>

            {accountingIntegration?.last_export_at && (
              <p className="text-sm text-muted-foreground">
                Última exportação:{" "}
                {format(new Date(accountingIntegration.last_export_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={upsertAccounting.isPending}>
                {upsertAccounting.isPending ? "Salvando..." : "Salvar Configuração"}
              </Button>
              {config.is_active && (
                <Button variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exportar Agora
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
