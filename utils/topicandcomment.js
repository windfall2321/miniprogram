const http = require('./request');
const config = require('./config');

// 处理图片URL
function processImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${config.IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

const topicService = {
  // 获取所有帖子
  async getAllTopics() {
    const response = await http.get('/topic/list');
    if (response.code === 200 && Array.isArray(response.data)) {
      const processed = await Promise.all(
        response.data.map(async (topic) => {
          const imageRes = await http.get(`/images/topic/${topic.topicId}`);  // 改这里
          if (Array.isArray(imageRes)) {
            topic.images = imageRes.map(img => processImageUrl(img.imageUrl));
          } else {
            topic.images = [];
          }
          return topic;
        })
      );
      return processed;
    } else {
      throw new Error(response.message || '获取帖子失败');
    }
  }
  ,
  

  // 获取单个帖子详情
  async getTopicDetail(topicId) {
    const response = await http.get(`/topic/${topicId}`);
    if (response.code === 200 && response.data) {
      const topic = response.data;

      // 获取帖子图片
      const imageRes = await http.get(`/images/topic/${topicId}`);
      if (Array.isArray(imageRes)) {
        topic.images = imageRes.map(img => processImageUrl(img.imageUrl));
      } else {
        topic.images = [];
      }

      return topic;
    } else {
      throw new Error(response.message || '获取帖子详情失败');
    }
  },

  // 获取某帖子的评论
  async getComments(topicId) {
    const res = await http.get(`/comment/list/${topicId}`);
    if (res.code === 200 && Array.isArray(res.data)) {
      const commentsWithImages = await Promise.all(
        res.data.map(async (comment) => {
          const imgRes = await http.get(`/images/comment/${comment.commentId}`);
          if (Array.isArray(imgRes)) {
            comment.images = imgRes.map(img => processImageUrl(img.imageUrl));
          } else {
            comment.images = [];
          }
          return comment;
        })
      );
      return commentsWithImages;
    } else {
      throw new Error(res.message || '获取评论失败');
    }
  },

  // 发布帖子
  async addTopic(topicData) {
    return http.post('/topic/addmini', topicData);
  },

  // 删除帖子
  async deleteTopic(topicId) {
    return http.delete(`/topic/delete/${topicId}`);
  },

  // 上传图片
  // async uploadImage(filePath, type, topicId = null, commentId = null) {
  //   return new Promise((resolve, reject) => {
  //     wx.uploadFile({
  //       url: `${config.BASE_URL}/images/upload`,
  //       filePath: filePath,
  //       name: 'file',
  //       formData: {
  //         type,
  //         topicId,
  //         commentId
  //       },
  //       header: {
  //         'Authorization': `Bearer ${wx.getStorageSync('token')}`
  //       },
  //       success(res) {
  //         if (res.statusCode === 200) {
  //           try {
  //             const data = JSON.parse(res.data);
  //             if (data.code === 200 || typeof data === 'string') {
  //               resolve(data);
  //             } else {
  //               reject(new Error(data.message || '上传失败'));
  //             }
  //           } catch (e) {
  //             reject(new Error('图片上传返回格式异常'));
  //           }
  //         } else {
  //           reject(new Error('上传失败'));
  //         }
  //       },
  //       fail(err) {
  //         reject(err);
  //       }
  //     });
  //   });
  // }
  async uploadImage(filePath, type, topicId = null, commentId = null) {
    return new Promise((resolve, reject) => {
      const formData = { type };
      if (topicId !== null && topicId !== undefined) {
        formData.topicId = String(topicId);
      }
      if (commentId !== null && commentId !== undefined) {
        formData.commentId = String(commentId);
      }
  
      wx.uploadFile({
        url: `${config.BASE_URL}/images/upload`,
        filePath,
        name: 'file',
        formData,
        header: {
          'Authorization': `Bearer ${wx.getStorageSync('token')}`
        },
        success(res) {
          if (res.statusCode === 200) {
            try {
              // 有的后端直接返回字符串，没法 JSON.parse，先尝试解析
              let data;
              try {
                data = JSON.parse(res.data);
              } catch (err) {
                // 不是标准 JSON，直接当字符串处理
                data = res.data;
              }
  
              // 如果 data 是对象且 code === 200，直接 resolve
              if (typeof data === 'object' && data.code === 200) {
                resolve(data);
              }
              // 如果是字符串且包含“上传成功”，也当做成功处理
              else if (typeof data === 'string' && data.includes('上传成功')) {
                resolve({ message: data });
              }
              else {
                reject(new Error((data.message || data) || '上传失败'));
              }
            } catch (e) {
              reject(new Error('图片上传返回格式异常'));
            }
          } else {
            reject(new Error('上传失败'));
          }
        },
        fail(err) {
          reject(err);
        }
      });
    });
  }
  
};

module.exports = topicService;
