import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
import { Languages, Palette, User, Bot } from 'lucide-react';
import { AchievementsList } from './AchievementsList';

interface SettingsPanelProps {
  language: string;
  darkMode: boolean;
  onSave: (settings: { language: string; darkMode: boolean }) => void;
}

interface ProfileData {
  username: string;
  tutor_name: string;
  tutor_gender: 'male' | 'female';
  tutor_avatar_url: string;
}

export function SettingsPanel({ language, darkMode, onSave }: SettingsPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estado local para as configurações de aparência
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [currentDarkMode, setCurrentDarkMode] = useState(darkMode);

  const [profile, setProfile] = useState<ProfileData>({
    username: '',
    tutor_name: 'Professor',
    tutor_gender: 'male',
    tutor_avatar_url: '',
  });

  const predefinedAvatars = [
    '/avatars/tutor-01.png',
    '/avatars/tutor-02.png',
    '/avatars/tutor-03.png',
    '/avatars/tutor-04.png',
  ];

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('username, tutor_name, tutor_gender, tutor_avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile', error);
        } else if (data) {
          setProfile({
            username: data.username || '',
            tutor_name: data.tutor_name || 'Professor',
            tutor_gender: data.tutor_gender || 'male',
            tutor_avatar_url: data.tutor_avatar_url || '',
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: profile.username,
        tutor_name: profile.tutor_name,
        tutor_gender: profile.tutor_gender,
        tutor_avatar_url: profile.tutor_avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert(t('Profile updated successfully!')); 
    } catch (error: any) {
      alert(t('Error updating profile: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setProfile(prev => ({ ...prev, tutor_avatar_url: avatarUrl }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) {
      return;
    }

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    setSaving(true);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: t('Error uploading avatar'), description: uploadError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setProfile(prev => ({ ...prev, tutor_avatar_url: publicUrl }));
    setSaving(false);
  };

  const handleSaveAppearance = () => {
    onSave({ language: currentLanguage, darkMode: currentDarkMode });
    toast({ title: t('Settings saved'), description: t('Your new appearance settings have been saved.') });
  };

  if (loading) {
    return <div>{t('Loading settings...')}</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> {t('Profile Settings')}</CardTitle>
          <CardDescription>{t('Customize your profile and tutor')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('Username')}</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder={t('Your unique username')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tutorName">{t('Tutor Name')}</Label>
              <Input
                id="tutorName"
                value={profile.tutor_name}
                onChange={(e) => setProfile(prev => ({ ...prev, tutor_name: e.target.value }))}
                placeholder={t('e.g., Professor')}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('Tutor Pronoun')}</Label>
              <Select
                value={profile.tutor_gender}
                onValueChange={(value) => setProfile(prev => ({ ...prev, tutor_gender: value as 'male' | 'female' }))}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('Select a pronoun')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('Male')}</SelectItem>
                  <SelectItem value="female">{t('Female')}</SelectItem>
                  <SelectItem value="neutral">{t('Neutral')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('Tutor Avatar')}</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.tutor_avatar_url} alt={t('Tutor Avatar')} />
                  <AvatarFallback><Bot/></AvatarFallback>
                </Avatar>
                <div className="grid grid-cols-4 gap-2">
                  {predefinedAvatars.map((avatar, index) => (
                    <Button key={index} variant={profile.tutor_avatar_url === avatar ? 'default' : 'outline'} size="icon" onClick={() => handleAvatarSelect(avatar)} className="h-10 w-10">
                      <img src={avatar} alt={`${t('Avatar')} ${index + 1}`}/>
                    </Button>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={() => document.getElementById('avatarUpload')?.click()} disabled={saving}>{t('Upload')}</Button>
                <Input type="file" id="avatarUpload" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              </div>
            </div>
            <Button type="submit" disabled={loading || saving}>{saving ? t('Saving...') : t('Save Profile')}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5"/> {t('Appearance')}</CardTitle>
          <CardDescription>{t('Customize your interface')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="language-select" className="flex items-center gap-2"><Languages className="h-5 w-5"/> {t('Language')}</Label>
            <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                <SelectTrigger id="language-select" className="w-[180px]">
                    <SelectValue placeholder={t('Select language')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="en">{t('English')}</SelectItem>
                    <SelectItem value="pt-BR">{t('Portuguese (Brazil)')}</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode-switch">{t('Dark mode')}</Label>
            <Switch
              id="dark-mode-switch"
              checked={currentDarkMode}
              onCheckedChange={setCurrentDarkMode}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveAppearance} className="ml-auto">{t('Save Changes')}</Button>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">{t('Achievements')}</h3>
        <AchievementsList />
      </div>
    </div>
  );
}
