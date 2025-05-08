// Cloudflare Pages 函数 - 消息API
import { createD1Client } from '../../lib/cloudflare/d1-client';

export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = createD1Client(env.DB);
  
  try {
    if (request.method === 'GET') {
      // 获取消息列表
      const senderId = url.searchParams.get('senderId');
      const receiverId = url.searchParams.get('receiverId');
      const page = Number(url.searchParams.get('page') || '1');
      const limit = Number(url.searchParams.get('limit') || '20');
      
      if (!senderId || !receiverId) {
        return new Response(JSON.stringify({ error: '缺少发送者ID或接收者ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const messages = await db.getMessages(senderId, receiverId, page, limit);
      
      return new Response(JSON.stringify(messages), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      // 发送新消息
      const data = await request.json();
      
      // 验证必填字段
      if (!data.sender_id || !data.receiver_id || !data.content) {
        return new Response(JSON.stringify({ error: '缺少必填字段' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const message = await db.sendMessage(data);
      
      return new Response(JSON.stringify(message), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'PATCH') {
      // 标记消息为已读
      const messageId = url.pathname.split('/').pop();
      
      if (!messageId || isNaN(Number(messageId))) {
        return new Response(JSON.stringify({ error: '无效的消息ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await db.markMessageAsRead(Number(messageId));
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: '不支持的HTTP方法' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('API错误:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
