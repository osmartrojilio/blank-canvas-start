import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, Image, Download, Trash2, Eye, Search, Loader2 } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAttachments, Attachment, AttachmentType } from "@/hooks/useAttachments";
import { useVehicles } from "@/hooks/useVehicles";

const tipoLabels: Record<AttachmentType, { label: string; class: string; icon: typeof FileText }> = {
  nota_fiscal: { label: "Nota Fiscal", class: "badge-warning", icon: FileText },
  comprovante: { label: "Comprovante", class: "badge-success", icon: FileText },
  documento: { label: "Documento", class: "badge-status bg-primary/20 text-primary", icon: FileText },
  foto: { label: "Foto", class: "badge-status bg-secondary text-muted-foreground", icon: Image },
};

const tipoFilterOptions = [
  { value: "", label: "Todos os tipos" },
  { value: "nota_fiscal", label: "Notas Fiscais" },
  { value: "comprovante", label: "Comprovantes" },
  { value: "documento", label: "Documentos" },
  { value: "foto", label: "Fotos" },
];

const tipoFormOptions = tipoFilterOptions.filter((o) => o.value);

const Anexos = () => {
  const { attachments, loading, uploading, stats, uploadAttachment, deleteAttachment, downloadAttachment, getSignedUrl, formatFileSize } = useAttachments();
  const { vehicles } = useVehicles();
  
  // Cache for signed URLs (storage_path -> { url, expiry })
  const [signedUrlCache, setSignedUrlCache] = useState<Record<string, { url: string; expiry: number }>>({});
  const [viewSignedUrl, setViewSignedUrl] = useState<string | null>(null);
  const [loadingViewUrl, setLoadingViewUrl] = useState(false);
  
  const [isDragging, setIsDragging] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [veiculoFilter, setVeiculoFilter] = useState("");
  const [viewAttachment, setViewAttachment] = useState<Attachment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Attachment | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState<{
    file: File | null;
    entity_type: AttachmentType;
    vehicle_id: string;
    description: string;
  }>({
    file: null,
    entity_type: "documento",
    vehicle_id: "",
    description: "",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAttachments = attachments.filter((anexo) => {
    const matchesSearch = searchValue === "" || 
      anexo.file_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      anexo.description?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesTipo = tipoFilter === "" || tipoFilter === "all" || anexo.entity_type === tipoFilter;
    const matchesVeiculo = veiculoFilter === "" || veiculoFilter === "all" || anexo.entity_id === veiculoFilter;
    return matchesSearch && matchesTipo && matchesVeiculo;
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadData({ ...uploadData, file: files[0] });
      setUploadDialogOpen(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadData({ ...uploadData, file: files[0] });
      setUploadDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file) return;

    await uploadAttachment({
      file: uploadData.file,
      entity_type: uploadData.entity_type,
      vehicle_id: uploadData.vehicle_id || undefined,
      description: uploadData.description || undefined,
    });

    setUploadDialogOpen(false);
    setUploadData({
      file: null,
      entity_type: "documento",
      vehicle_id: "",
      description: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteAttachment(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");

  // Get a cached signed URL or fetch a new one
  const getCachedSignedUrl = useCallback(async (storagePath: string): Promise<string | null> => {
    const now = Date.now();
    const cached = signedUrlCache[storagePath];
    
    // If cached and not expired (5 min buffer), return it
    if (cached && cached.expiry > now + 300000) {
      return cached.url;
    }
    
    // Fetch new signed URL (1 hour expiry)
    const url = await getSignedUrl(storagePath, 3600);
    if (url) {
      setSignedUrlCache(prev => ({
        ...prev,
        [storagePath]: { url, expiry: now + 3600000 }
      }));
    }
    return url;
  }, [signedUrlCache, getSignedUrl]);

  // Load signed URLs for visible attachments (thumbnails)
  useEffect(() => {
    const loadThumbnailUrls = async () => {
      const imageAttachments = filteredAttachments.filter(a => isImage(a.file_type));
      for (const attachment of imageAttachments) {
        if (!signedUrlCache[attachment.storage_path]) {
          await getCachedSignedUrl(attachment.storage_path);
        }
      }
    };
    loadThumbnailUrls();
  }, [filteredAttachments, signedUrlCache, getCachedSignedUrl]);

  // Load signed URL for view dialog
  const handleViewAttachment = async (attachment: Attachment) => {
    setViewAttachment(attachment);
    setViewSignedUrl(null);
    setLoadingViewUrl(true);
    
    const url = await getCachedSignedUrl(attachment.storage_path);
    setViewSignedUrl(url);
    setLoadingViewUrl(false);
  };

  const handleCloseViewDialog = () => {
    setViewAttachment(null);
    setViewSignedUrl(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <BackToHome />
        <div className="page-header">
          <h1 className="page-title">Anexos</h1>
          <p className="page-subtitle">Notas fiscais, comprovantes e documentos</p>
        </div>

        {/* Upload Area */}
        <div
          className={`stat-card mb-6 border-2 border-dashed transition-all cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              {uploading ? (
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {uploading ? "Enviando arquivo..." : "Arraste arquivos aqui"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              ou clique para selecionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
            />
            <p className="text-xs text-muted-foreground mt-4">
              PDF, JPG, PNG até 10MB
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total de Arquivos</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Notas Fiscais</p>
            <p className="text-2xl font-bold text-foreground">{stats.byType.nota_fiscal}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Comprovantes</p>
            <p className="text-2xl font-bold text-foreground">{stats.byType.comprovante}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Espaço Usado</p>
            <p className="text-2xl font-bold text-foreground">{formatFileSize(stats.totalSize)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do arquivo..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="input-field w-44">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                {tipoFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={veiculoFilter} onValueChange={setVeiculoFilter}>
              <SelectTrigger className="input-field w-48">
                <SelectValue placeholder="Todos os veículos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.prefix} - {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        {attachments.length === 0 ? (
          <div className="stat-card text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum anexo encontrado</h3>
            <p className="text-muted-foreground mb-4">Comece enviando seu primeiro arquivo.</p>
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary">
              <Upload className="w-5 h-5" />
              Enviar Arquivo
            </button>
          </div>
        ) : (
          /* Files Grid */
          <ScrollArea className="h-[calc(100vh-520px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
              {filteredAttachments.map((anexo) => {
                const config = tipoLabels[anexo.entity_type] || tipoLabels.documento;
                const Icon = config.icon;
                
                return (
                  <div
                    key={anexo.id}
                    className="stat-card hover:border-primary/30 border border-transparent transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {isImage(anexo.file_type) && signedUrlCache[anexo.storage_path]?.url ? (
                          <img 
                            src={signedUrlCache[anexo.storage_path].url} 
                            alt={anexo.file_name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate mb-1">{anexo.file_name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{anexo.vehicle?.prefix || "Geral"}</span>
                          <span>•</span>
                          <span>{new Date(anexo.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <span className={`badge-status ${config.class}`}>{config.label}</span>
                        <span className="text-xs text-muted-foreground">{formatFileSize(anexo.file_size)}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewAttachment(anexo)}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => downloadAttachment(anexo)}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(anexo)}
                          className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Enviar Arquivo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadData.file?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadData.file && formatFileSize(uploadData.file.size)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                <Select 
                  value={uploadData.entity_type} 
                  onValueChange={(v) => setUploadData({ ...uploadData, entity_type: v as AttachmentType })}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoFormOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Veículo (opcional)</label>
                <Select 
                  value={uploadData.vehicle_id} 
                  onValueChange={(v) => setUploadData({ ...uploadData, vehicle_id: v })}
                >
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.prefix} - {v.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Descrição (opcional)</label>
                <Input
                  placeholder="Descrição do arquivo"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setUploadDialogOpen(false)} 
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpload} 
                  className="btn-primary flex-1" 
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Enviar
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={!!viewAttachment} onOpenChange={handleCloseViewDialog}>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-foreground truncate">
                {viewAttachment?.file_name}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {loadingViewUrl ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : viewAttachment && viewSignedUrl && isImage(viewAttachment.file_type) ? (
                <img 
                  src={viewSignedUrl} 
                  alt={viewAttachment.file_name}
                  className="max-w-full max-h-[60vh] object-contain mx-auto rounded-lg"
                />
              ) : viewAttachment?.file_type === "application/pdf" && viewSignedUrl ? (
                <iframe
                  src={viewSignedUrl}
                  className="w-full h-[60vh] rounded-lg"
                  title={viewAttachment.file_name}
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Visualização não disponível</p>
                  <button 
                    onClick={() => viewAttachment && downloadAttachment(viewAttachment)}
                    className="btn-primary mt-4"
                  >
                    <Download className="w-4 h-4" />
                    Baixar Arquivo
                  </button>
                </div>
              )}
              
              {viewAttachment && (
                <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="text-foreground font-medium">
                        {tipoLabels[viewAttachment.entity_type]?.label || viewAttachment.entity_type}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tamanho</p>
                      <p className="text-foreground font-medium">{formatFileSize(viewAttachment.file_size)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Veículo</p>
                      <p className="text-foreground font-medium">{viewAttachment.vehicle?.prefix || "Geral"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data de Upload</p>
                      <p className="text-foreground font-medium">
                        {new Date(viewAttachment.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {viewAttachment.description && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Descrição</p>
                        <p className="text-foreground font-medium">{viewAttachment.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Anexo</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteConfirm?.file_name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Anexos;
