import superagent from 'superagent'
import { BASE_URL } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import { handleError, handleUnauthorized } from '@/helpers/Utils'

//创建组
export const createGroup = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/group/create')
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

//编辑组
export const updateGroup = data => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/group/update')
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

//删除组
export const deleteGroup = groupId => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + '/group/delete')
      .query({ groupId })
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

//查询组
export const searchGroup = (projectId, groupId, groupName, groupDescription, page, size) => {
  const token = getToken()

  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/group/search')
      .query({projectId, groupId, groupName, groupDescription,page,size})
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