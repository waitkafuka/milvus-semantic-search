# Semantic Search Demo

这是一个基于 MySQL、Milvus 和 OpenAI 实现的语义搜索系统。该系统能够将文本内容转换为向量并存储，然后基于语义相似度进行搜索。

## 技术栈

- MySQL: 存储原始文本内容
- Milvus: 向量数据库，用于存储和检索文本的向量表示
- OpenAI: 使用 text-embedding-ada-002 模型生成文本的向量表示
- Node.js: 运行时环境

## 系统要求

- Node.js >= 14
- MySQL >= 5.7
- Milvus >= 2.0
- OpenAI API 访问权限

## 安装

1. 克隆项目并安装依赖： 
```bash
git clone [repository-url]
cd semantic-search-demo
npm install
```

2. 配置环境变量：

创建 `.env` 文件并填入以下配置：
```
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database

# Milvus Configuration
MILVUS_HOST=localhost
MILVUS_PORT=19530
MILVUS_COLLECTION=your_collection_name
MILVUS_DATABASE=your_database_name

# OpenAI Configuration
OPENAI_BASE_URL=your_openai_base_url
OPENAI_API_KEY=your_openai_api_key
```


## 数据库初始化

1. MySQL 表结构：
```sql
sql
CREATE TABLE articles (
id INT PRIMARY KEY AUTO_INCREMENT,
content TEXT NOT NULL
);
```

2. Milvus 集合将在首次运行时自动创建。

## 使用方法

1. 初始化系统（首次运行时）：
```bash
javascript
// 在 src/index.js 中取消注释以下行
await initializeSystem();
```
2. 运行搜索示例
```bash
npm run start
```


## 主要功能

1. `initializeSystem()`: 
   - 初始化 Milvus 集合
   - 从 MySQL 读取所有内容
   - 为每条内容生成向量并存储到 Milvus

2. `searchContent(query, limit)`:
   - 将搜索查询转换为向量
   - 在 Milvus 中搜索相似向量
   - 返回匹配的内容及其相似度分数

## 项目结构  

src/  
├── config/    
│  └── database.js # 数据库配置  
├── services/  
│ ├── milvusService.js # Milvus 相关操作  
│ ├── mysqlService.js # MySQL 相关操作  
│ └── openaiService.js # OpenAI API 调用  
└── index.js # 主程序入口  


## 注意事项

1. 确保 MySQL 和 Milvus 服务已启动
2. OpenAI API 调用需要有效的 API key
3. 首次运行需要初始化系统
4. 向量维度固定为 1536（OpenAI ada-002 模型）

## 性能优化

- Milvus 使用 IVF_FLAT 索引以平衡召回率和性能
- 可通过调整 nprobe 参数优化搜索精度和速度
- MySQL 使用连接池管理数据库连接

## License

MIT