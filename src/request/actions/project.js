/*
 * @Author: Azhou
 * @Date: 2021-05-20 20:35:24
 * @LastEditors: Azhou
 * @LastEditTime: 2022-11-22 16:38:07
 */
import superagent from 'superagent'
import { BASE_URL } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import { handleError, handleUnauthorized } from '@/helpers/Utils'

//创建数据集
export const createProject = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/project/create')
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

//编辑数据集
export const editProject = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/project/update')
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

//删除数据集
export const deleteProject = projectId => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/project/delete')
      .query({projectId})
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

//查询数据集
export const searchProject = (projectId, projectName,page,size) => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/project/search')
      .query({projectId, projectName, page, size})
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
