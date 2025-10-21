const express = require('express');
const router = express.Router();

/**
 * 解析Cookie过期时间
 */
function parseCookieExpiry(cookieValue) {
  // 尝试从SESSDATA中解析过期时间
  if (cookieValue.includes('%2C')) {
    const parts = cookieValue.split('%2C');
    if (parts.length >= 2) {
      const timestamp = parseInt(parts[1]);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }
  }
  
  // 默认设置为30天后过期
  return Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
}

// POST /api/convert-cookies - 转换Cookie格式
router.post('/', (req, res) => {
  try {
    const { cookies } = req.body;
    
    if (!cookies) {
      return res.status(400).json({
        success: false,
        error: '请提供Cookie数据'
      });
    }

    // 解析Cookie字符串
    let cookieArray = [];
    if (typeof cookies === 'string') {
      // 标准格式：key=value; key2=value2
      cookieArray = cookies.split(';').map(cookie => {
        const [name, value] = cookie.trim().split('=');
        return { name: name.trim(), value: value ? value.trim() : '' };
      }).filter(cookie => cookie.name && cookie.value);
    } else if (Array.isArray(cookies)) {
      // JSON数组格式：[{"name":"key","value":"value"}]
      cookieArray = cookies;
    }

    // 转换为TinyDB格式
    const tinyDbFormat = {
      "_default": {
        "1": {
          "value": cookieArray.map(cookie => {
            // 根据Cookie名称设置属性
            const isImportant = ['SESSDATA', 'bili_jct'].includes(cookie.name);
            const expires = parseCookieExpiry(cookie.value);
            
            return {
              name: cookie.name,
              value: cookie.value,
              domain: ".bilibili.com",
              path: "/",
              expires: expires,
              httpOnly: isImportant,
              secure: true,
              sameSite: "Lax"
            };
          })
        }
      }
    };

    res.json({
      success: true,
      data: tinyDbFormat
    });
  } catch (error) {
    console.error('转换Cookie失败:', error);
    res.status(500).json({
      success: false,
      error: '转换失败: ' + error.message
    });
  }
});

module.exports = router;