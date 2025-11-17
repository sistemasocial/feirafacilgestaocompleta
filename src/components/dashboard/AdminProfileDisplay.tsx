import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileData {
  full_name: string;
  foto_url: string | null;
}

export default function AdminProfileDisplay({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    loadProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        () => {
          loadProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, foto_url")
      .eq("id", userId)
      .single();

    if (data && !error) {
      setProfile(data);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src={profile.foto_url || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {profile.full_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{profile.full_name}</span>
        <Badge variant="secondary" className="w-fit text-xs">
          Administrador Principal
        </Badge>
      </div>
    </div>
  );
}
