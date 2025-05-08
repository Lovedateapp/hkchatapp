// Cloudflare Pages 函数 - 打卡API
import { createD1Client } from '../../lib/cloudflare/d1-client';

export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const db = createD1Client(env.DB);
  
  try {
    if (request.method === 'POST') {
      // 用户打卡
      const data = await request.json();
      
      // 验证必填字段
      if (!data.user_id) {
        return new Response(JSON.stringify({ error: '缺少用户ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 检查今天是否已经打卡
      const hasCheckedIn = await db.hasCheckedInToday(data.user_id);
      
      if (hasCheckedIn) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: '今天已经打卡了' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 执行打卡
      const checkIn = await db.checkIn(data.user_id);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: '打卡成功',
        data: checkIn
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'GET') {
      // 检查用户今天是否已打卡
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(JSON.stringify({ error: '缺少用户ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const hasCheckedIn = await db.hasCheckedInToday(userId);
      
      return new Response(JSON.stringify({ 
        hasCheckedIn 
      }), {
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
