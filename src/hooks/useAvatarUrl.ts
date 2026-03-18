import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to generate a signed URL for an avatar stored in the private avatars bucket.
 * If the avatar_url is a storage path (starts with the user's UUID folder pattern),
 * it generates a signed URL. Otherwise falls back to the raw URL.
 */
export function useAvatarUrl(avatarPath: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarPath) {
      setSignedUrl(null);
      return;
    }

    // If it's already a full URL (legacy public URL), try to extract the storage path
    // New format stores just the path like "userId/avatar.png"
    let storagePath = avatarPath;

    // Check if it's a full Supabase storage URL and extract the path
    const storageUrlMatch = avatarPath.match(/\/storage\/v1\/object\/public\/avatars\/(.+)$/);
    if (storageUrlMatch) {
      storagePath = storageUrlMatch[1];
    }

    const generateSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error || !data?.signedUrl) {
        setSignedUrl(null);
        return;
      }

      setSignedUrl(data.signedUrl);
    };

    generateSignedUrl();
  }, [avatarPath]);

  return signedUrl;
}
