import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Star, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProfileData {
  username: string;
  avatar_url: string;
  level: number;
  xp: number;
  coins: number;
}

const XP_PER_LEVEL = 100; // Ex: 100 XP para passar de nível

export function UserProfileHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, level, xp, coins')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile for header:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();

    const channel = supabase
      .channel(`profile-changes:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile(payload.new as ProfileData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading || !profile) {
    return (
        <div className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    );
  }

  const xpProgress = (profile.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 w-full p-4 bg-card rounded-lg border">
          <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src={profile.avatar_url} alt={profile.username} />
              <AvatarFallback><User className="h-8 w-8"/></AvatarFallback>
          </Avatar>
          <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xl text-card-foreground">{profile.username}</span>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-amber-500">
                          <Coins className="h-5 w-5" />
                          <span className="font-bold text-lg">{profile.coins}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sky-500">
                          <Star className="h-5 w-5" />
                          <span className="font-bold text-lg">{t('Level')} {profile.level}</span>
                      </div>
                  </div>
              </div>
              <Progress value={xpProgress} className="h-2.5" />
              <p className="text-sm text-muted-foreground text-right mt-1.5">{`${profile.xp} / ${XP_PER_LEVEL} XP`}</p>
          </div>
      </div>

      <div className="p-4 bg-card rounded-lg border">
        <h4 className="font-semibold mb-3 text-card-foreground">{t('Quick Tips')} 💡</h4>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
          <li>{t('Ask specific questions to get detailed explanations')}</li>
          <li>{t('Earn XP for every question you ask')}</li>
          <li>{t('Customize your tutor’s name and avatar')}</li>
          <li>{t('Check your achievements regularly')}</li>
        </ul>
      </div>
    </div>
  );
}
