import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // General
      "Welcome back": "Welcome back, {{name}}",
      "Sign Out": "Sign Out",
      "Save": "Save",
      "Close": "Close",
      "Send": "Send",
      "Type your message...": "Type your message...",
      "Search history...": "Search history...",
      "New Chat": "New Chat",
      "Loading...": "Loading...",
      "No conversations found": "No conversations found",

      // Settings
      "Settings": "Settings",
      "Language": "Language",
      "English": "English",
      "Portuguese (Brazil)": "Portuguese (Brazil)",
      "Dark Mode": "Dark Mode",
      "Light Mode": "Light Mode",
      "System": "System",
      "Tutor Name": "Tutor Name",
      "Tutor Gender": "Tutor Gender",
      "Male": "Male",
      "Female": "Female",
      "Customize Tutor Avatar": "Customize Tutor Avatar",
      "Upload Custom Avatar": "Upload Custom Avatar",
      "Select a pre-defined avatar": "Select a pre-defined avatar",
      "Profile updated successfully!": "Profile updated successfully!",

      // Gamification
      "Level": "Level",
      "XP": "XP",
      "Coins": "Coins",
      "Achievements": "Achievements",
      "Achievement Unlocked!": "Achievement Unlocked!",
      "My Achievements": "My Achievements",
      "No achievements unlocked yet. Keep learning!": "No achievements unlocked yet. Keep learning!",

      // Errors
      "Error saving profile": "Error saving profile",
      "Error uploading avatar": "Error uploading avatar",
      "Something went wrong": "Something went wrong",

      // Additional translations
      "Customize your tutor's name and avatar": "Customize your tutor's name and avatar",
      "Check your achievements regularly": "Check your achievements regularly",
      "Your Personal Learning Assistant": "Your Personal Learning Assistant",
      "Your AI Learning Assistant": "Your AI Learning Assistant",
      "Profile Settings": "Profile Settings",
      "Customize your profile and tutor": "Customize your profile and tutor",
      "Username": "Username",
      "Your unique username": "Your unique username",
      "e.g., Professor": "e.g., Professor",
      "Tutor Pronoun": "Tutor Pronoun",
      "Select a pronoun": "Select a pronoun",
      "Neutral": "Neutral",
      "Tutor Avatar": "Tutor Avatar",
      "Avatar": "Avatar",
      "Upload": "Upload",
      "Saving...": "Saving...",
      "Save Profile": "Save Profile",
      "Appearance": "Appearance",
      "Customize your interface": "Customize your interface",
      "Select language": "Select language",
      "Dark mode": "Dark mode",
      "Save Changes": "Save Changes",
      "Settings saved": "Settings saved",
      "Your new appearance settings have been saved.": "Your new appearance settings have been saved.",
      "Loading settings...": "Loading settings...",
      "Avatar uploaded successfully": "Avatar uploaded successfully",
      "Error updating profile: ": "Error updating profile: "
    }
  },
  'pt-BR': {
    translation: {
      // General
      "Welcome back": "Bem-vindo(a) de volta, {{name}}",
      "Sign Out": "Sair",
      "Save": "Salvar",
      "Close": "Fechar",
      "Send": "Enviar",
      "Type your message...": "Digite sua mensagem...",
      "Search history...": "Buscar no histórico...",
      "New Chat": "Novo Chat",
      "Loading...": "Carregando...",
      "No conversations found": "Nenhuma conversa encontrada",

      // Settings
      "Settings": "Configurações",
      "Language": "Idioma",
      "English": "Inglês",
      "Portuguese (Brazil)": "Português (Brasil)",
      "Dark Mode": "Modo Escuro",
      "Light Mode": "Modo Claro",
      "System": "Sistema",
      "Tutor Name": "Nome do Tutor",
      "Tutor Gender": "Gênero do Tutor",
      "Male": "Masculino",
      "Female": "Feminino",
      "Customize Tutor Avatar": "Customizar Avatar do Tutor",
      "Upload Custom Avatar": "Enviar Avatar Personalizado",
      "Select a pre-defined avatar": "Selecionar um avatar pré-definido",
      "Profile updated successfully!": "Perfil atualizado com sucesso!",

      // Gamification
      "Level": "Nível",
      "XP": "XP",
      "Coins": "Moedas",
      "Achievements": "Conquistas",
      "Achievement Unlocked!": "Conquista Desbloqueada!",
      "My Achievements": "Minhas Conquistas",
      "No achievements unlocked yet. Keep learning!": "Nenhuma conquista desbloqueada ainda. Continue aprendendo!",

      // Errors
      "Error saving profile": "Erro ao salvar perfil",
      "Error uploading avatar": "Erro ao enviar avatar",
      "Something went wrong": "Algo deu errado",

      // Additional translations
      "History": "Histórico",
      "Quick Tips": "Dicas Rápidas",
      "Ask specific questions to get detailed explanations": "Faça perguntas específicas para obter explicações detalhadas",
      "Earn XP for every question you ask": "Ganhe XP a cada pergunta que fizer",
      "Customize your tutor's name and avatar": "Personalize o nome e avatar do seu tutor",
      "Check your achievements regularly": "Verifique suas conquistas regularmente",
      "Your Personal Learning Assistant": "Seu Assistente de Aprendizagem Pessoal",
      "Your AI Learning Assistant": "Seu Assistente de Aprendizagem de IA",
      "Profile Settings": "Configurações de Perfil",
      "Customize your profile and tutor": "Personalize seu perfil e tutor",
      "Username": "Nome de usuário",
      "Your unique username": "Seu nome de usuário único",
      "e.g., Professor": "ex: Professor",
      "Tutor Pronoun": "Pronome do Tutor",
      "Select a pronoun": "Selecione um pronome",
      "Neutral": "Neutro",
      "Tutor Avatar": "Avatar do Tutor",
      "Avatar": "Avatar",
      "Upload": "Enviar",
      "Saving...": "Salvando...",
      "Save Profile": "Salvar Perfil",
      "Appearance": "Aparência",
      "Customize your interface": "Personalize sua interface",
      "Select language": "Selecione o idioma",
      "Dark mode": "Modo escuro",
      "Save Changes": "Salvar Alterações",
      "Settings saved": "Configurações salvas",
      "Your new appearance settings have been saved.": "Suas novas configurações de aparência foram salvas.",
      "Loading settings...": "Carregando configurações...",
      "Avatar uploaded successfully": "Avatar enviado com sucesso",
      "Error updating profile: ": "Erro ao atualizar o perfil: "
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;