// Script de teste para verificar a integração com o N8N
// Execute com: node test-n8n-integration.js

const fetch = require('node-fetch');

// Substitua pelos seus valores reais
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://seu-projeto.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sua-chave-anon';
const TEST_USER_EMAIL = 'usuario@exemplo.com';
const TEST_PASSWORD = 'senha-segura';

async function testN8NIntegration() {
  try {
    console.log('1. Fazendo login para obter token de acesso...');
    
    // Passo 1: Fazer login para obter o token
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signInError) {
      console.error('Erro ao fazer login:', signInError.message);
      return;
    }

    console.log('Login realizado com sucesso!');
    
    // Passo 2: Enviar mensagem para o webhook via Edge Function
    console.log('\n2. Enviando mensagem para a Edge Function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/n8n-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message: 'Olá, este é um teste de integração!',
        user_id: session.user.id,
        timestamp: new Date().toISOString()
      }),
    });

    console.log(`Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro na resposta:', errorData);
      return;
    }

    const data = await response.json();
    console.log('\n3. Resposta recebida com sucesso!');
    console.log('Conteúdo da resposta:', JSON.stringify(data, null, 2));
    
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Inicializa o cliente Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Executa o teste
testN8NIntegration();
