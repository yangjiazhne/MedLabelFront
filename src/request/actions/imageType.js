import superagent from 'superagent'
import { BASE_URL } from '@/constants'
import { getToken } from '@/helpers/dthelper'
import { handleError, handleUnauthorized } from '@/helpers/Utils'

//查询所有图像类型
export const searchImageType = () => {
    const token = getToken()
    return new Promise((resolve, reject) => {
      superagent
        .get(BASE_URL + '/imagetype/search')
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
  