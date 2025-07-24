# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1bcfb6f3-ffaa-4e30-aabc-94ad0532d225

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1bcfb6f3-ffaa-4e30-aabc-94ad0532d225) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Integração com N8N (Proxy Seguro) — Supabase Edge Function

Para detalhes sobre a arquitetura e configuração da integração com N8N, consulte o [Guia Completo de Integração com N8N](./N8N_INTEGRATION_GUIDE.md).

## Lembretes (Agenda) — Supabase Edge Function

A funcionalidade de lembretes/agendamento é servida por uma **Supabase Edge Function** RESTful, pronta para produção.

### Endpoint

```
https://mdlmvizqxtqtzoyxlgif.functions.supabase.co/reminders
```

### Métodos suportados
- **GET**: Lista todos os lembretes do usuário autenticado
- **POST**: Cria um novo lembrete
- **PUT**: Atualiza um lembrete existente (por `id`)
- **DELETE**: Remove um lembrete (por `id`)

### Autenticação
- Todas as requisições exigem o header:
  ```
  Authorization: Bearer <jwt_do_usuario>
  ```
  O JWT é obtido via Supabase Auth no frontend.

### Exemplos de uso

**Listar lembretes:**
```http
GET /reminders
Authorization: Bearer <jwt>
```

**Criar lembrete:**
```http
POST /reminders
Authorization: Bearer <jwt>
Content-Type: application/json
{
  "title": "Estudar matemática",
  "description": "Revisar álgebra",
  "remind_at": "2025-07-24T10:00:00-03:00",
  "is_recurring": false,
  "recurrence_rule": null
}
```

**Atualizar lembrete:**
```http
PUT /reminders?id=<id_do_lembrete>
Authorization: Bearer <jwt>
Content-Type: application/json
{
  "title": "Novo título",
  ...
}
```

**Excluir lembrete:**
```http
DELETE /reminders?id=<id_do_lembrete>
Authorization: Bearer <jwt>
```

### Observações
- Todos os métodos retornam mensagens de erro internacionalizadas em PT-BR/EN.
- O frontend deve garantir que o usuário esteja autenticado e envie o JWT nas requisições.
- O endpoint está protegido por RLS e só retorna/permite alterações aos lembretes do próprio usuário.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1bcfb6f3-ffaa-4e30-aabc-94ad0532d225) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
