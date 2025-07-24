import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { format } from "date-fns";
import { useSession } from "@/hooks/useSession";

const API_URL = "https://mdlmvizqxtqtzoyxlgif.functions.supabase.co/reminders";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  remind_at: string;
  is_recurring?: boolean;
  recurrence_rule?: string | null;
}

const RemindersPanel: React.FC = () => {
  const { t } = useTranslation();
  const { session, getToken } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    remind_at: "",
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch reminders
  const fetchReminders = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setReminders(data);
      else setError(data.error || t("Erro ao carregar lembretes"));
    } catch (e) {
      setError(t("Erro ao carregar lembretes"));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchReminders();
    // eslint-disable-next-line
  }, [session]);

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Open dialog for create/edit
  const openDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditing(reminder);
      setForm({
        title: reminder.title,
        description: reminder.description || "",
        remind_at: reminder.remind_at.slice(0, 16),
      });
    } else {
      setEditing(null);
      setForm({ title: "", description: "", remind_at: "" });
    }
    setShowDialog(true);
  };

  // Save (create or update)
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const method = editing ? "PUT" : "POST";
      const url = editing ? `${API_URL}?id=${editing.id}` : API_URL;
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || t("Erro ao salvar lembrete"));
      } else {
        setShowDialog(false);
        fetchReminders();
      }
    } catch (e) {
      setError(t("Erro ao salvar lembrete"));
    }
    setLoading(false);
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm(t("Tem certeza que deseja excluir este lembrete?"))) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || t("Erro ao excluir lembrete"));
      } else {
        fetchReminders();
      }
    } catch (e) {
      setError(t("Erro ao excluir lembrete"));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{t("Lembretes")}</h2>
        <Button onClick={() => openDialog()}>{t("Novo lembrete")}</Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading && <div>{t("Carregando...")}</div>}
      <ul className="space-y-2">
        {reminders.map((reminder) => (
          <li key={reminder.id} className="bg-white dark:bg-zinc-900 rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold">{reminder.title}</div>
              <div className="text-sm text-zinc-500">{reminder.description}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {t("Para")} {format(new Date(reminder.remind_at), "dd/MM/yyyy HH:mm")}
              </div>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={() => openDialog(reminder)}>{t("Editar")}</Button>
              <Button variant="destructive" onClick={() => handleDelete(reminder.id)}>{t("Excluir")}</Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("Editar lembrete") : t("Novo lembrete")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder={t("Título")}
              required
            />
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t("Descrição")}
            />
            <Input
              type="datetime-local"
              name="remind_at"
              value={form.remind_at}
              onChange={handleChange}
              required
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>{t("Cancelar")}</Button>
              <Button onClick={handleSave} disabled={loading}>
                {editing ? t("Salvar alterações") : t("Criar lembrete")}
              </Button>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RemindersPanel;
