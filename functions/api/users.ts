// Cloudflare Pages 函数 - 用户API
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
      // 获取用户信息
      const userId = url.pathname.split('/').pop();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: '缺少用户ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const user = await db.getUser(userId);
      
      if (!user) {
        return new Response(JSON.stringify({ error: '用户不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(user), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      // 创建新用户
      const data = await request.json();
      
      // 验证必填字段
      if (!data.id) {
        return new Response(JSON.stringify({ error: '缺少用户ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 生成匿名ID（如果没有提供）
      if (!data.anonymous_id) {
        data.anonymous_id = crypto.randomUUID();
      }
      
      const user = await db.createUser(data);
      
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'PUT' || request.method === 'PATCH') {
      // 更新用户信息
      const userId = url.pathname.split('/').pop();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: '缺少用户ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const data = await request.json();
      const user = await db.updateUser(userId, data);
      
      if (!user) {
        return new Response(JSON.stringify({ error: '用户不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(user), {
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
