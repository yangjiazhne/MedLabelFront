/*
 * @Author: Azhou
 * @Date: 2021-05-12 15:29:10
 * @LastEditors: Azhou
 * @LastEditTime: 2021-08-30 10:49:42
 */

// 开发环境下才会启用的转发代理
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    // createProxyMiddleware('/dataturks', {
    //   target: 'http://47.111.17.95:9090/',
    //   changeOrigin: true,
    //   ws: true,
    // }),
    createProxyMiddleware('/dataturks', {
      target: 'http://10.214.211.205:9090/',
      changeOrigin: true,
      ws: true, 
    }),
    createProxyMiddleware('/anno', {
      target: 'http://127.0.0.1:5088/',
      changeOrigin: true,
      pathRewrite: { '^/anno': '' },
    })
  )
}
