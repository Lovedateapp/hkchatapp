// Cloudflare Pages 函数 - 帖子API
import { createD1Client } from '../../lib/cloudflare/d1-client';

export interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const db = createD1Client(env.DB);
  
  // 处理不同的HTTP方法
  try {
    if (request.method === 'GET') {
      // 获取帖子列表或单个帖子
      const postId = url.pathname.split('/').pop();
      
      if (postId && !isNaN(Number(postId))) {
        // 获取单个帖子
        const post = await db.getPostById(Number(postId));
        
        if (!post) {
          return new Response(JSON.stringify({ error: '帖子不存在' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(post), {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // 获取帖子列表
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '10');
        const userId = url.searchParams.get('userId');
        
        let posts;
        if (userId) {
          posts = await db.getPostsByUserId(userId, page, limit);
        } else {
          posts = await db.getPosts(page, limit);
        }
        
        return new Response(JSON.stringify(posts), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else if (request.method === 'POST') {
      // 创建新帖子
      const data = await request.json();
      
      // 验证必填字段
      if (!data.user_id || !data.content) {
        return new Response(JSON.stringify({ error: '缺少必填字段' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const post = await db.createPost(data);
      
      return new Response(JSON.stringify(post), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'PUT' || request.method === 'PATCH') {
      // 更新帖子
      const postId = url.pathname.split('/').pop();
      
      if (!postId || isNaN(Number(postId))) {
        return new Response(JSON.stringify({ error: '无效的帖子ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const data = await request.json();
      const post = await db.updatePost(Number(postId), data);
      
      if (!post) {
        return new Response(JSON.stringify({ error: '帖子不存在' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify(post), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'DELETE') {
      // 删除帖子
      const postId = url.pathname.split('/').pop();
      
      if (!postId || isNaN(Number(postId))) {
        return new Response(JSON.stringify({ error: '无效的帖子ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await db.deletePost(Number(postId));
      
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
