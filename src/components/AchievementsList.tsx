import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  unlocked_at: string;
}

export function AchievementsList() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAchievements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          unlocked_at,
          achievements (id, name, description, icon_url)
        `)
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });

      if (error) {
        console.error('Error fetching achievements', error);
      } else {
        const formattedData = data.map((item: any) => ({ ...item.achievements, unlocked_at: item.unlocked_at }));
        setAchievements(formattedData);
      }
      setLoading(false);
    };

    fetchAchievements();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award />
          {t('My Achievements')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-muted-foreground">{t('No achievements unlocked yet. Keep learning!')}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex flex-col items-center text-center p-4 border rounded-lg">
                <img src={ach.icon_url} alt={ach.name} className="h-16 w-16 mb-2" />
                <h4 className="font-semibold">{ach.name}</h4>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
