import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AttachmentType = "nota_fiscal" | "comprovante" | "documento" | "foto";

export interface Attachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  entity_type: AttachmentType;
  entity_id: string;
  description: string | null;
  thumbnail_url: string | null;
  organization_id: string;
  uploaded_by: string | null;
  created_at: string;
  vehicle?: {
    prefix: string;
    plate: string;
  } | null;
}

export interface AttachmentUploadData {
  file: File;
  entity_type: AttachmentType;
  entity_id?: string;
  description?: string;
  vehicle_id?: string;
}

export function useAttachments() {
  const { user, profile } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttachments = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch vehicle info separately for attachments with vehicle entity_id
      const attachmentsWithVehicles = await Promise.all(
        (data || []).map(async (attachment) => {
          if (attachment.entity_type === "vehicle" || attachment.entity_id) {
            const { data: vehicleData } = await supabase
              .from("vehicles")
              .select("prefix, plate")
              .eq("id", attachment.entity_id)
              .single();
            
            return { ...attachment, vehicle: vehicleData };
          }
          return { ...attachment, vehicle: null };
        })
      );

      setAttachments(attachmentsWithVehicles as Attachment[]);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error fetching attachments:", err);
      }
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [profile?.organization_id]);

  const uploadAttachment = async (data: AttachmentUploadData): Promise<Attachment | null> => {
    if (!user || !profile?.organization_id) {
      toast.error("Usuário não autenticado");
      return null;
    }

    setUploading(true);

    try {
      const fileExt = data.file.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `${profile.organization_id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(storagePath, data.file);

      if (uploadError) throw uploadError;

      // SECURITY FIX: Don't store signed URLs in the database as they expire.
      // Store a placeholder URL - the app always generates fresh signed URLs on-demand
      // via getSignedUrl() using the storage_path.
      const placeholderUrl = `storage://${storagePath}`;

      // Insert attachment record with placeholder URL
      const { data: attachment, error: insertError } = await supabase
        .from("attachments")
        .insert({
          file_name: data.file.name,
          file_type: data.file.type,
          file_size: data.file.size,
          file_url: placeholderUrl, // Placeholder - use getSignedUrl(storage_path) for access
          storage_path: storagePath,
          entity_type: data.entity_type,
          entity_id: data.entity_id || data.vehicle_id || profile.organization_id,
          description: data.description || null,
          organization_id: profile.organization_id,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success("Arquivo enviado com sucesso!");
      await fetchAttachments();
      return attachment as Attachment;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error uploading attachment:", err);
      }
      toast.error("Erro ao enviar arquivo");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAttachment = async (id: string): Promise<boolean> => {
    try {
      const attachment = attachments.find((a) => a.id === id);
      if (!attachment) return false;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.storage_path]);

      if (storageError && import.meta.env.DEV) {
        console.warn("Storage delete error:", storageError);
      }

      // Delete record
      const { error: deleteError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast.success("Arquivo excluído com sucesso!");
      await fetchAttachments();
      return true;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error deleting attachment:", err);
      }
      toast.error("Erro ao excluir arquivo");
      return false;
    }
  };

  const downloadAttachment = async (attachment: Attachment): Promise<void> => {
    try {
      // Generate a fresh signed URL for download (5 minutes expiry)
      const { data, error } = await supabase.storage
        .from("attachments")
        .createSignedUrl(attachment.storage_path, 300);

      if (error || !data?.signedUrl) {
        toast.error("Erro ao gerar link de download");
        return;
      }

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = attachment.file_name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error downloading attachment:", err);
      }
      toast.error("Erro ao baixar arquivo");
    }
  };

  const getSignedUrl = async (storagePath: string, expiresIn: number = 3600): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("attachments")
        .createSignedUrl(storagePath, expiresIn);

      if (error || !data?.signedUrl) {
        if (import.meta.env.DEV) {
          console.error("Error creating signed URL:", error);
        }
        return null;
      }

      return data.signedUrl;
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error getting signed URL:", err);
      }
      return null;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const stats = {
    total: attachments.length,
    byType: {
      nota_fiscal: attachments.filter((a) => a.entity_type === "nota_fiscal").length,
      comprovante: attachments.filter((a) => a.entity_type === "comprovante").length,
      documento: attachments.filter((a) => a.entity_type === "documento").length,
      foto: attachments.filter((a) => a.entity_type === "foto").length,
    },
    totalSize: attachments.reduce((sum, a) => sum + a.file_size, 0),
  };

  return {
    attachments,
    loading,
    uploading,
    error,
    stats,
    uploadAttachment,
    deleteAttachment,
    downloadAttachment,
    getSignedUrl,
    formatFileSize,
    refetch: fetchAttachments,
  };
}
