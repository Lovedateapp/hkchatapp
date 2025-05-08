// Cloudflare Pages 函数 - 评论API
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
      // 获取评论列表
      const postId = url.searchParams.get('postId');
      
      if (!postId || isNaN(Number(postId))) {
        return new Response(JSON.stringify({ error: '缺少有效的帖子ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const comments = await db.getCommentsByPostId(Number(postId));
      
      return new Response(JSON.stringify(comments), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'POST') {
      // 创建新评论
      const data = await request.json();
      
      // 验证必填字段
      if (!data.post_id || !data.user_id || !data.content) {
        return new Response(JSON.stringify({ error: '缺少必填字段' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      const comment = await db.createComment(data);
      
      return new Response(JSON.stringify(comment), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (request.method === 'DELETE') {
      // 删除评论
      const commentId = url.pathname.split('/').pop();
      
      if (!commentId || isNaN(Number(commentId))) {
        return new Response(JSON.stringify({ error: '无效的评论ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await db.deleteComment(Number(commentId));
      
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
