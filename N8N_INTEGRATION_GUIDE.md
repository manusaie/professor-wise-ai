# Guia Completo de Integração com N8N

Este guia centraliza toda a documentação para a integração entre o Professor Wise AI e o N8N, utilizando uma arquitetura segura com uma Supabase Edge Function como proxy.

---

## Parte 1: A API da Edge Function (`n8n-proxy`)

### Visão Geral

A Edge Function `n8n-proxy` atua como um intermediário seguro entre o frontend e o N8N. Sua responsabilidade é:

1.  Receber de forma segura a mensagem do usuário.
2.  Validar a sessão do usuário via token JWT.
3.  Encaminhar a mensagem para o webhook do N8N.
4.  Aguardar a resposta do N8N e retorná-la ao frontend na mesma requisição.

**Esta abordagem evita a exposição de URLs de webhooks ou chaves de API no lado do cliente.**

### Endpoint

- **URL:** `[SUA_SUPABASE_URL]/functions/v1/n8n-proxy`
- **Método:** `POST`

### Autenticação

**Obrigatória.** A requisição deve incluir o cabeçalho `Authorization: Bearer [SEU_SUPABASE_ACCESS_TOKEN]`.

### Formato da Requisição (Frontend -> Edge Function)

**Corpo (Body):**
```json
{
  "message": "Qual é a capital do Brasil?"
}
```

### Formato da Resposta (Edge Function -> Frontend)

**Corpo (Body):**
```json
{
  "reply": "A capital do Brasil é Brasília."
}
```

---

## Parte 2: Guia de Configuração do Workflow no N8N

### Passo 1: Configurar o Nó Webhook

1.  Adicione um nó **Webhook** ao seu canvas no N8N.
2.  Copie a **Production URL**.
3.  **IMPORTANTE:** Você deve me fornecer esta URL para que seja configurada de forma segura na Edge Function.
4.  Clique em **"Listen for test event"** para que o webhook aguarde uma chamada de teste.

O webhook receberá o seguinte formato da nossa Edge Function:
```json
{
  "message": "Qual é a capital do Brasil?",
  "user_id": "uuid-do-usuario-supabase"
}
```

### Passo 2: Configurar o Nó de IA (LLM)

1.  Adicione um nó de **LLM** (ex: `OpenAI Chat Model`).
2.  Conecte o nó **Webhook** a este nó.
3.  Configure suas **Credenciais** da API da IA.
4.  No campo de **Prompt**, use a expressão para pegar a mensagem do usuário: `{{ $json.body.message }}`

### Passo 3: Configurar o Nó "Respond to Webhook"

1.  Adicione um nó **Respond to Webhook**.
2.  Conecte o nó de **IA** a este nó.
3.  Em **Response Data**, configure o JSON de resposta. A nossa aplicação espera um objeto com a chave `reply`:

    ```json
    {
      "reply": "{{ $json.choices[0].message.content }}"
    }
    ```
    *(A expressão exata pode variar dependendo do seu modelo de IA).*

### Passo 4: Ativar o Workflow

1.  Salve e **ative** seu workflow.
2.  Garanta que a **URL de Produção** do webhook foi a que você me forneceu.
