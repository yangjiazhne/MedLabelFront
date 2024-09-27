/*
 * @Author: Azhou
 * @Date: 2021-06-08 21:29:50
 * @LastEditors: Azhou
 * @LastEditTime: 2021-06-08 21:52:42
 */
import superagent from 'superagent'
import { BASE_URL, PYTHON_SERVER_HTTP } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import { handleError } from '@/helpers/Utils'

// create project first step: upload base information
// 这些接口都是旧时代产物，先放在这里，后面做整合的时候要清理掉
export const getReflectImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + 'getReflectImg')
      .set('token', token)
      .send(data)
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
  })
}

export const getSmartPath = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(BASE_URL + 'getSmartPath')
      .set('token', token)
      .send(data)
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
  })
}

export const getEISegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'eiseg')
      .set('token', token)
      .send(data)
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
  })
}

export const getSAMSegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'sam_seg')
      .set('token', token)
      .send(data)
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
  })
}

export const getHQSAMSegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'HQ_sam_click')
      .set('token', token)
      .send(data)
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
  })
}

export const getSemSAMSegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'Semantic_SAM_click')
      .set('token', token)
      .send(data)
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
  })
}

// 普通图像单张推理
export const getNewSegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'predict_one')
      .set('token', token)
      .send(data)
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
  })
}

// 病理图单张交互式标注（sam，eiseg）
export const getPathoSegImg = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'predict_pathology_one')
      .set('token', token)
      .send(data)
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
  })
}

// 病理图单张推理
export const getPathoSegRef = data => {
  const token = getToken()
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'predict_pathology_temp')
      .set('token', token)
      .send(data)
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
  })
}

// 整个数据集进行推理（仅支持普通图像（ct、normal等），不支持病理图（因为病理图暂时没有批量推理的需求））
export const getInferResult = data => {
  return new Promise((resolve, reject) => {
    superagent
      .post(PYTHON_SERVER_HTTP + 'predict_all')
      .send(data)
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
  })
}
