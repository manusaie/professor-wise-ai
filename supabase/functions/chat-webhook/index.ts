import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  content?: string;
  file?: {
    name: string;
    type: string;
    data: string; // base64 encoded file data
  };
  audio?: {
    data: string; // base64 encoded audio data
    format: string; // wav, mp3, etc.
  };
  user_id: string;
  conversation_id?: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
}

interface N8NWebhookPayload {
  message: {
    content?: string;
    file_url?: string;
    file_type?: string;
    message_type: string;
    user_id: string;
    conversation_id: string;
  };
  user_profile: {
    display_name: string;
    tutor_name: string;
    tutor_gender: string;
  };
  conversation_history: Array<{
    content: string;
    sender: string;
    created_at: string;
  }>;
}

interface N8NResponse {
  response: {
    content?: string;
    audio?: {
      data: string;
      format: string;
    };
    file?: {
      url: string;
      type: string;
      name: string;
    };
    message_type: 'text' | 'audio' | 'image' | 'file';
  };
  xp_awarded?: number;
  coins_awarded?: number;
}

serve(async (req) => {
  console.log(`🔥 Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const chatMessage: ChatMessage = await req.json();
    console.log('📥 Received message:', JSON.stringify(chatMessage, null, 2));

    // Validate required fields
    if (!chatMessage.user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get or create conversation
    let conversationId = chatMessage.conversation_id;
    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: chatMessage.user_id,
          title: 'New Chat Session',
          subject: 'General'
        })
        .select()
        .single();

      if (convError) {
        console.error('❌ Error creating conversation:', convError);
        throw convError;
      }
      conversationId = newConversation.id;
      console.log('✅ Created new conversation:', conversationId);
    }

    // Handle file upload if present
    let fileUrl: string | null = null;
    let fileType: string | null = null;
    let fileSize: number | null = null;

    if (chatMessage.file) {
      console.log('📎 Processing file upload...');
      const fileData = chatMessage.file.data;
      const fileName = `${chatMessage.user_id}/${Date.now()}-${chatMessage.file.name}`;
      
      // Convert base64 to blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, byteArray, {
          contentType: chatMessage.file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading file:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrl;
      fileType = chatMessage.file.type;
      fileSize = byteArray.length;
      console.log('✅ File uploaded:', fileUrl);
    }

    // Handle audio upload if present
    if (chatMessage.audio) {
      console.log('🎵 Processing audio upload...');
      const audioFileName = `${chatMessage.user_id}/${Date.now()}-audio.${chatMessage.audio.format}`;
      
      // Convert base64 to blob
      const byteCharacters = atob(chatMessage.audio.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(audioFileName, byteArray, {
          contentType: `audio/${chatMessage.audio.format}`,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Error uploading audio:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(audioFileName);
      
      fileUrl = publicUrl;
      fileType = `audio/${chatMessage.audio.format}`;
      fileSize = byteArray.length;
      console.log('✅ Audio uploaded:', fileUrl);
    }

    // Save user message to database
    const { data: userMessage, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: chatMessage.user_id,
        sender: 'user',
        content: chatMessage.content || '',
        message_type: chatMessage.message_type,
        file_url: fileUrl,
        file_type: fileType,
        file_size: fileSize
      })
      .select()
      .single();

    if (msgError) {
      console.error('❌ Error saving user message:', msgError);
      throw msgError;
    }
    console.log('✅ User message saved:', userMessage.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', chatMessage.user_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      throw profileError;
    }

    // Get conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('content, sender, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('❌ Error fetching history:', historyError);
      throw historyError;
    }

    // Prepare payload for N8N
    const n8nPayload: N8NWebhookPayload = {
      message: {
        content: chatMessage.content,
        file_url: fileUrl,
        file_type: fileType,
        message_type: chatMessage.message_type,
        user_id: chatMessage.user_id,
        conversation_id: conversationId
      },
      user_profile: {
        display_name: profile.display_name || 'Student',
        tutor_name: profile.tutor_name || 'Professor',
        tutor_gender: profile.tutor_gender || 'neutral'
      },
      conversation_history: history || []
    };

    console.log('📤 Sending to N8N:', JSON.stringify(n8nPayload, null, 2));

    // Send to N8N webhook (replace with your actual N8N webhook URL)
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL') || 'https://webhook.site/unique-url';
    
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      console.error('❌ N8N webhook failed:', n8nResponse.status, await n8nResponse.text());
      throw new Error(`N8N webhook failed with status ${n8nResponse.status}`);
    }

    const n8nResult: N8NResponse = await n8nResponse.json();
    console.log('📥 N8N response:', JSON.stringify(n8nResult, null, 2));

    // Handle AI response file/audio if present
    let aiFileUrl: string | null = null;
    let aiFileType: string | null = null;
    let aiFileSize: number | null = null;

    if (n8nResult.response.audio) {
      console.log('🎵 Processing AI audio response...');
      const audioFileName = `${chatMessage.user_id}/${Date.now()}-ai-audio.${n8nResult.response.audio.format}`;
      
      const byteCharacters = atob(n8nResult.response.audio.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(audioFileName, byteArray, {
          contentType: `audio/${n8nResult.response.audio.format}`,
          upsert: false
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(audioFileName);
        
        aiFileUrl = publicUrl;
        aiFileType = `audio/${n8nResult.response.audio.format}`;
        aiFileSize = byteArray.length;
        console.log('✅ AI audio uploaded:', aiFileUrl);
      }
    }

    if (n8nResult.response.file) {
      aiFileUrl = n8nResult.response.file.url;
      aiFileType = n8nResult.response.file.type;
      console.log('✅ AI file URL set:', aiFileUrl);
    }

    // Save AI response to database
    const { data: aiMessage, error: aiMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        user_id: chatMessage.user_id,
        sender: 'ai',
        content: n8nResult.response.content || '',
        message_type: n8nResult.response.message_type,
        file_url: aiFileUrl,
        file_type: aiFileType,
        file_size: aiFileSize
      })
      .select()
      .single();

    if (aiMsgError) {
      console.error('❌ Error saving AI message:', aiMsgError);
      throw aiMsgError;
    }
    console.log('✅ AI message saved:', aiMessage.id);

    // Award XP and coins if specified
    if (n8nResult.xp_awarded || n8nResult.coins_awarded) {
      console.log('🏆 Awarding rewards...');
      
      if (n8nResult.xp_awarded) {
        await supabase.from('xp_transactions').insert({
          user_id: chatMessage.user_id,
          amount: n8nResult.xp_awarded,
          reason: 'Chat interaction',
          reference_id: userMessage.id
        });

        // Update user profile XP
        await supabase
          .from('profiles')
          .update({
            total_xp: profile.total_xp + n8nResult.xp_awarded
          })
          .eq('user_id', chatMessage.user_id);
      }

      if (n8nResult.coins_awarded) {
        await supabase
          .from('profiles')
          .update({
            coins: profile.coins + n8nResult.coins_awarded
          })
          .eq('user_id', chatMessage.user_id);
      }
    }

    // Return the AI response
    const response = {
      success: true,
      conversation_id: conversationId,
      user_message_id: userMessage.id,
      ai_message_id: aiMessage.id,
      response: {
        content: n8nResult.response.content,
        message_type: n8nResult.response.message_type,
        file_url: aiFileUrl,
        file_type: aiFileType,
        audio_url: n8nResult.response.message_type === 'audio' ? aiFileUrl : undefined
      },
      rewards: {
        xp_awarded: n8nResult.xp_awarded || 0,
        coins_awarded: n8nResult.coins_awarded || 0
      }
    };

    console.log('✅ Webhook completed successfully');
    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});