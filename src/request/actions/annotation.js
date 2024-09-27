import superagent from 'superagent'
import { BASE_URL } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import { handleError, handleUnauthorized } from '@/helpers/Utils'

//新增标注
export const createAnnotation = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/annotation/create')
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
            data: res.body.data,
          })
      })
  })
}

//更新标注
export const updateAnnotation = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/annotation/update')
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
            data: res.body.data,
          })
      })
  })
}

//删除标注
export const deleteAnnotation = annotationId => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/annotation/delete')
      .query({ annotationId })
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
            data: res.body.data,
          })
      })
  })
}

//查询标注
export const searchAnnotation = (imageId, annotationId, annotationName, annotatedBy, page, size) => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/annotation/search')
      .query({imageId, annotationId, annotationName, annotatedBy, page, size})
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
            data: res.body.data,
          })
      })
  })
}

// 下载标注
export const downloadAnnotationByGroup = (imageGroupIds) => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/annotation/download/group')
      .query({imageGroupIds})
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
            data: res.body.data,
          })
      })
  })
}

export const downloadAnnotationByProject = (projectIds) => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/annotation/download/project')
      .query({projectIds})
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
            data: res.body.data,
          })
      })
  })
}