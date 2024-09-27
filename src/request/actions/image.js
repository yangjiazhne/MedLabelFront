import superagent from 'superagent'
import { handleError, handleUnauthorized } from '@/helpers/Utils'
import { BASE_URL, STATIC_URL } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import request from 'superagent';

//上传图片
export const uploadImage = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/image/upload/image')
      .send(data)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err){
          if (res?.status === 401) {
            handleUnauthorized()
            return
          }
          handleError(res?.body?.code);
          resolve({
            err: true,
            data: res.body.msg,
          })
        }
        else
          resolve({
            err: false,
            data: res.body,
          })
      })
  })
}

//上传图像文件夹
export const uploadImageFolder = data => {
    const token = getToken()
  
    return new Promise((resolve, reject) => {
      superagent
        .post(BASE_URL + '/image/upload/folder')
        .send(data)
        .set('Authorization', `Bearer ${token}`)
        .end((err, res) => {
          if (err){
            if (res?.status === 401) {
              handleUnauthorized()
              return
            }
            handleError(res?.body?.code);
            resolve({
              err: true,
              data: res.body.msg,
            })
          }
          else
            resolve({
              err: false,
              data: res.body,
            })
        })
    })
  }

//编辑图片信息
export const updateImage = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/image/update')
      .send(data)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err){
          if (res?.status === 401) {
            handleUnauthorized()
            return
          }
          handleError(res?.body?.code);
          resolve({
            err: true,
            data: res.body.msg,
          })
        }
        else
          resolve({
            err: false,
            data: res.body,
          })
      })
  })
}

//删除图片
export const deleteImage = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/image/delete')
      .send(data)
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err){
          if (res?.status === 401) {
            handleUnauthorized()
            return
          }
          handleError(res?.body?.code);
          resolve({
            err: true,
            data: res.body.msg,
          })
        }
        else
          resolve({
            err: false,
            data: res.body,
          })
      })
  })
}

//查询图片
export const searchImage = (imageGroupId, imageTypeId, imageId, imageName, imageUrl, page, size) => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/image/search')
      .query({imageGroupId, imageTypeId, imageId, imageName, imageUrl, page, size})
      .set('Authorization', `Bearer ${token}`)
      .end((err, res) => {
        if (err){
          handleError(res?.body?.code);
          resolve({
            err: true,
            data: res.body.msg,
          })
        }
        else
          resolve({
            err: false,
            data: res.body.data,
          })
      })
  })
}

// 获取病理图像的metadata.xml
export const  fetchImageTileInfo = (projectId, imageName) => {
  const url = `${STATIC_URL}/${projectId}/${imageName}/deepzoom/metadata.xml`;

  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    request
      .get(url)
      .type('text/xml')  // 设置请求类型为 XML
      .then(response => {
        try {
          // 解析 XML 字符串
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(response.text, 'application/xml');
          
          // 提取数据
          const imageElement = xmlDoc.getElementsByTagName('Image')[0];
          const sizeElement = xmlDoc.getElementsByTagName('Size')[0];

          // 构建 pathoImageInfo 对象
          const pathoImageInfo = {
            url: `${STATIC_URL}/${projectId}/${imageName}/deepzoom/imgs/`,
            overlap: imageElement.getAttribute('Overlap'),
            tileSize: imageElement.getAttribute('TileSize'),
            format: imageElement.getAttribute('Format').toLowerCase(),
            size: {
              width: sizeElement.getAttribute('Width'),
              height: sizeElement.getAttribute('Height')
            }
          };

          // 成功时解析 Promise
          resolve(pathoImageInfo);
        } catch (error) {
          // 捕获解析错误
          reject(new Error('Error parsing XML: ' + error.message));
        }
      })
      .catch(error => {
        // 捕获请求错误
        reject(new Error('Error fetching data: ' + error.message));
      });
  });
}

// 获取病理图像的宽度
export const  fetchImageSize = (projectId, imageName) => {
  const url = `${STATIC_URL}/${projectId}/${imageName}/deepzoom/metadata.xml`;

  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    request
      .get(url)
      .type('text/xml')  // 设置请求类型为 XML
      .then(response => {
        try {
          // 解析 XML 字符串
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(response.text, 'application/xml');
          
          // 提取数据
          const sizeElement = xmlDoc.getElementsByTagName('Size')[0];
          const imageSize = {
            width: sizeElement.getAttribute('Width'),
            height: sizeElement.getAttribute('Height')
          }
          // 成功时解析 Promise
          resolve(imageSize);
        } catch (error) {
          // 捕获解析错误
          reject(new Error('Error parsing XML: ' + error.message));
        }
      })
      .catch(error => {
        // 捕获请求错误
        reject(new Error('Error fetching data: ' + error.message));
      });
  });
}