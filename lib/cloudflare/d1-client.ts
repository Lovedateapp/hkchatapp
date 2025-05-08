// D1数据库客户端
// 这个文件提供了与Cloudflare D1数据库交互的函数

import { D1Database } from '@cloudflare/workers-types';

// 定义D1客户端类型
export type D1Client = {
  // 用户相关操作
  getUser: (userId: string) => Promise<any>;
  createUser: (user: any) => Promise<any>;
  updateUser: (userId: string, data: any) => Promise<any>;
  
  // 帖子相关操作
  getPosts: (page?: number, limit?: number) => Promise<any[]>;
  getPostById: (postId: number) => Promise<any>;
  getPostsByUserId: (userId: string, page?: number, limit?: number) => Promise<any[]>;
  createPost: (post: any) => Promise<any>;
  updatePost: (postId: number, data: any) => Promise<any>;
  deletePost: (postId: number) => Promise<void>;
  
  // 评论相关操作
  getCommentsByPostId: (postId: number) => Promise<any[]>;
  createComment: (comment: any) => Promise<any>;
  deleteComment: (commentId: number) => Promise<void>;
  
  // 打卡相关操作
  checkIn: (userId: string) => Promise<any>;
  hasCheckedInToday: (userId: string) => Promise<boolean>;
  
  // 消息相关操作
  getMessages: (senderId: string, receiverId: string, page?: number, limit?: number) => Promise<any[]>;
  sendMessage: (message: any) => Promise<any>;
  markMessageAsRead: (messageId: number) => Promise<void>;
  
  // 执行自定义SQL
  executeQuery: (query: string, params?: any[]) => Promise<any>;
};

// 创建D1客户端
export function createD1Client(db: D1Database): D1Client {
  return {
    // 用户相关操作
    async getUser(userId: string) {
      const stmt = db.prepare('SELECT * FROM users WHERE id = ?').bind(userId);
      const result = await stmt.first();
      return result;
    },
    
    async createUser(user: any) {
      const { id, anonymous_id } = user;
      const stmt = db.prepare(
        'INSERT INTO users (id, anonymous_id) VALUES (?, ?) RETURNING *'
      ).bind(id, anonymous_id);
      return await stmt.first();
    },
    
    async updateUser(userId: string, data: any) {
      // 构建更新语句
      const keys = Object.keys(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), userId];
      
      const stmt = db.prepare(
        `UPDATE users SET ${setClause} WHERE id = ? RETURNING *`
      ).bind(...values);
      
      return await stmt.first();
    },
    
    // 帖子相关操作
    async getPosts(page = 1, limit = 10) {
      const offset = (page - 1) * limit;
      const stmt = db.prepare(
        'SELECT * FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(limit, offset);
      
      const result = await stmt.all();
      return result.results;
    },
    
    async getPostById(postId: number) {
      const stmt = db.prepare('SELECT * FROM posts WHERE id = ?').bind(postId);
      return await stmt.first();
    },
    
    async getPostsByUserId(userId: string, page = 1, limit = 10) {
      const offset = (page - 1) * limit;
      const stmt = db.prepare(
        'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(userId, limit, offset);
      
      const result = await stmt.all();
      return result.results;
    },
    
    async createPost(post: any) {
      const { user_id, content, anonymous_name, avatar_seed, district, categories } = post;
      const categoriesStr = Array.isArray(categories) ? categories.join(',') : categories;
      
      const stmt = db.prepare(
        `INSERT INTO posts (user_id, content, anonymous_name, avatar_seed, district, categories) 
         VALUES (?, ?, ?, ?, ?, ?) RETURNING *`
      ).bind(user_id, content, anonymous_name, avatar_seed, district, categoriesStr);
      
      return await stmt.first();
    },
    
    async updatePost(postId: number, data: any) {
      // 处理categories字段
      if (data.categories && Array.isArray(data.categories)) {
        data.categories = data.categories.join(',');
      }
      
      // 构建更新语句
      const keys = Object.keys(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), postId];
      
      const stmt = db.prepare(
        `UPDATE posts SET ${setClause} WHERE id = ? RETURNING *`
      ).bind(...values);
      
      return await stmt.first();
    },
    
    async deletePost(postId: number) {
      await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
    },
    
    // 评论相关操作
    async getCommentsByPostId(postId: number) {
      const stmt = db.prepare(
        'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
      ).bind(postId);
      
      const result = await stmt.all();
      return result.results;
    },
    
    async createComment(comment: any) {
      const { post_id, user_id, content, anonymous_name, avatar_seed } = comment;
      
      // 开始事务
      const results = await db.batch([
        db.prepare(
          `INSERT INTO comments (post_id, user_id, content, anonymous_name, avatar_seed) 
           VALUES (?, ?, ?, ?, ?) RETURNING *`
        ).bind(post_id, user_id, content, anonymous_name, avatar_seed),
        
        db.prepare(
          'UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?'
        ).bind(post_id)
      ]);
      
      return results[0].results[0];
    },
    
    async deleteComment(commentId: number) {
      // 先获取评论信息
      const comment = await db.prepare('SELECT post_id FROM comments WHERE id = ?').bind(commentId).first();
      
      if (comment) {
        // 开始事务
        await db.batch([
          db.prepare('DELETE FROM comments WHERE id = ?').bind(commentId),
          db.prepare(
            'UPDATE posts SET comment_count = comment_count - 1 WHERE id = ?'
          ).bind(comment.post_id)
        ]);
      }
    },
    
    // 打卡相关操作
    async checkIn(userId: string) {
      try {
        const stmt = db.prepare(
          `INSERT INTO check_ins (user_id, check_in_date) 
           VALUES (?, DATE('now')) RETURNING *`
        ).bind(userId);
        
        const checkIn = await stmt.first();
        
        // 更新用户的连续打卡天数
        await db.prepare(
          'UPDATE users SET streak_days = streak_days + 1 WHERE id = ?'
        ).bind(userId).run();
        
        return checkIn;
      } catch (error) {
        // 如果今天已经打卡，会因为唯一约束而失败
        return null;
      }
    },
    
    async hasCheckedInToday(userId: string) {
      const stmt = db.prepare(
        `SELECT * FROM check_ins 
         WHERE user_id = ? AND check_in_date = DATE('now')`
      ).bind(userId);
      
      const result = await stmt.first();
      return !!result;
    },
    
    // 消息相关操作
    async getMessages(senderId: string, receiverId: string, page = 1, limit = 20) {
      const offset = (page - 1) * limit;
      const stmt = db.prepare(
        `SELECT * FROM messages 
         WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) 
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(senderId, receiverId, receiverId, senderId, limit, offset);
      
      const result = await stmt.all();
      return result.results;
    },
    
    async sendMessage(message: any) {
      const { sender_id, receiver_id, content } = message;
      
      const stmt = db.prepare(
        `INSERT INTO messages (sender_id, receiver_id, content) 
         VALUES (?, ?, ?) RETURNING *`
      ).bind(sender_id, receiver_id, content);
      
      return await stmt.first();
    },
    
    async markMessageAsRead(messageId: number) {
      await db.prepare(
        'UPDATE messages SET read = true WHERE id = ?'
      ).bind(messageId).run();
    },
    
    // 执行自定义SQL
    async executeQuery(query: string, params: any[] = []) {
      const stmt = db.prepare(query).bind(...params);
      const result = await stmt.all();
      return result.results;
    }
  };
}
