// 前端API客户端
// 用于与Cloudflare Pages函数进行交互

// 定义API客户端类型
export type ApiClient = {
  // 用户相关API
  getUser: (userId: string) => Promise<any>;
  createUser: (user: any) => Promise<any>;
  updateUser: (userId: string, data: any) => Promise<any>;
  
  // 帖子相关API
  getPosts: (page?: number, limit?: number) => Promise<any[]>;
  getPostById: (postId: number) => Promise<any>;
  getPostsByUserId: (userId: string, page?: number, limit?: number) => Promise<any[]>;
  createPost: (post: any) => Promise<any>;
  updatePost: (postId: number, data: any) => Promise<any>;
  deletePost: (postId: number) => Promise<void>;
  
  // 评论相关API
  getCommentsByPostId: (postId: number) => Promise<any[]>;
  createComment: (comment: any) => Promise<any>;
  deleteComment: (commentId: number) => Promise<void>;
  
  // 打卡相关API
  checkIn: (userId: string) => Promise<any>;
  hasCheckedInToday: (userId: string) => Promise<boolean>;
  
  // 消息相关API
  getMessages: (senderId: string, receiverId: string, page?: number, limit?: number) => Promise<any[]>;
  sendMessage: (message: any) => Promise<any>;
  markMessageAsRead: (messageId: number) => Promise<void>;
};

// 创建API客户端
export function createApiClient(baseUrl: string = ''): ApiClient {
  // 通用请求函数
  async function fetchApi(endpoint: string, options: RequestInit = {}) {
    const url = `${baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || `请求失败: ${response.status}`);
    }
    
    return response.json();
  }
  
  return {
    // 用户相关API
    async getUser(userId: string) {
      return fetchApi(`/api/users/${userId}`);
    },
    
    async createUser(user: any) {
      return fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify(user),
      });
    },
    
    async updateUser(userId: string, data: any) {
      return fetchApi(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    
    // 帖子相关API
    async getPosts(page = 1, limit = 10) {
      return fetchApi(`/api/posts?page=${page}&limit=${limit}`);
    },
    
    async getPostById(postId: number) {
      return fetchApi(`/api/posts/${postId}`);
    },
    
    async getPostsByUserId(userId: string, page = 1, limit = 10) {
      return fetchApi(`/api/posts?userId=${userId}&page=${page}&limit=${limit}`);
    },
    
    async createPost(post: any) {
      return fetchApi('/api/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });
    },
    
    async updatePost(postId: number, data: any) {
      return fetchApi(`/api/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    
    async deletePost(postId: number) {
      return fetchApi(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
    },
    
    // 评论相关API
    async getCommentsByPostId(postId: number) {
      return fetchApi(`/api/comments?postId=${postId}`);
    },
    
    async createComment(comment: any) {
      return fetchApi('/api/comments', {
        method: 'POST',
        body: JSON.stringify(comment),
      });
    },
    
    async deleteComment(commentId: number) {
      return fetchApi(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    
    // 打卡相关API
    async checkIn(userId: string) {
      return fetchApi('/api/check-in', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
    },
    
    async hasCheckedInToday(userId: string) {
      const result = await fetchApi(`/api/check-in?userId=${userId}`);
      return result.hasCheckedIn;
    },
    
    // 消息相关API
    async getMessages(senderId: string, receiverId: string, page = 1, limit = 20) {
      return fetchApi(`/api/messages?senderId=${senderId}&receiverId=${receiverId}&page=${page}&limit=${limit}`);
    },
    
    async sendMessage(message: any) {
      return fetchApi('/api/messages', {
        method: 'POST',
        body: JSON.stringify(message),
      });
    },
    
    async markMessageAsRead(messageId: number) {
      return fetchApi(`/api/messages/${messageId}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
    },
  };
}
