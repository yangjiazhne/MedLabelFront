# 环境配置

## 1.安装node.js
```
# 新建一个文件夹 apps 存放软件
# 直接下载编译好的文件
wget https://nodejs.org/dist/v14.17.3/node-v14.17.3-linux-x64.tar.xz
xz -d node-v14.17.3-linux-x64.tar.xz
tar -xvf node-v14.17.3-linux-x64.tar
```

### 1.1.配置环境变量
```
vim ~/.profile
# 最后面添加
NODE_PATH=${HOME}/apps/node-v14.17.3-linux-x64/bin
export PATH=${PATH}:${NODE_PATH}
source ~/.profile
```

### 1.2.验证
```
node -v  --------  v14.17.3
npm -v   --------  6.14.13
```

### 1.3.配置淘宝源
```
npm config set registry http://registry.npm.taobao.org/
```

## 2.安装nginx
```
cd ~/apps
wget http://nginx.org/download/nginx-1.20.1.tar.gz
tar -xvzf nginx-1.20.1.tar.gz
cd nginx-1.20.1

# 这个必须得手动编译
# 编译前检查，可能会需要安装 pcre和zlib
# --prefix 指定安装的目录
./configure --prefix=/home/yjz/apps/nginx

make && make install
```

### 2.1.修改配置
```
cd ~/apps/nginx/conf
vim nginx.conf

server {
    listen       3031;
    server_name  10.214.211.212;

    #charset koi8-r;

    #access_log  logs/host.access.log  main;

    location /api/ {
        proxy_pass http://10.214.211.212:9091/;
        add_header Access-Control-Allow-Origin '*';  
        add_header Access-Control-Allow-Credentials "true";
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
            add_header Access-Control-Allow-Headers  'token,DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,XRequested-With,Content-Type,Range';
            if ($request_method = 'OPTIONS') {
                return 200;
            }
    }
    
    location / {
        root    /home/yjz/MedLabel/client/build;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
        
            if ($request_method = 'OPTIONS') {
                return 200;
            } 
    }

    location /uploads {
        alias    /nfs5/medlabel/medlabel_212/projects;
        autoindex    on;
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range';
        add_header 'Access-Control-Expose-Headers' 'Content-Length,Content-Range';
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}

# 启动
cd /root/envs/nginx/sbin

./nginx 启动
./nginx -s stop 关闭
./nginx -s reload 重启
```