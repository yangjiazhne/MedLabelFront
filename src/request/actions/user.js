/*
 * @Author: Azhou
 * @Date: 2021-05-12 15:02:24
 * @LastEditors: Azhou
 * @LastEditTime: 2021-11-25 11:47:17
 */

import { BASE_URL } from '@/constants'
import superagent from 'superagent'
import { getToken } from '@/helpers/dthelper'
import { handleError } from '@/helpers/Utils'

// 用户注册
export const userRegister = (username, email, password, phone, profilelink) => {

  return new Promise((resolve, reject) => {
    try {
      superagent
        .post(BASE_URL + '/user/register')
        .send({ username, email, password, phone, profilelink })
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
              data: res.body,
            })
        })
    } catch (err) {
      reject(err)
    }
  })
}

// 用户正常登录
export const userLogin = (usernameOrEmail, password) => {

  return new Promise((resolve, reject) => {
    try {
      superagent
        .post(BASE_URL + '/user/login')
        .send({ usernameOrEmail, password })
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
              data: res.body,
            })
        })
    } catch (err) {
      reject(err)
    }
  })
}

//获取用户相关信息
export const getUserDetail = () => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .get(BASE_URL + '/user/search')
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
