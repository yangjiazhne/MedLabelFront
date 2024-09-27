/*
 * @Author: Azhou
 * @Date: 2021-05-13 14:57:51
 * @LastEditors: Azhou
 * @LastEditTime: 2021-12-02 21:21:12
 */
import {
  UPDATE_USER_DETAIL,
  UPDATE_CURRENT_USER_PROJECTS,
  UPDATE_CURRENT_USER_PROJECTS_LENGTH,
  UPDATE_USER_LOGIN,
} from '../actionTypes'

export const userInitialState = {
  isLogin: false,                  //用户是否登录
  userDetail: {},                  // 用户信息,
  currentUserProjects: [],         // 用户当前页面的数据集
  currentUserProjectsLength: 0     // 用户的数据集数量
}

const user = function (state = userInitialState, action) {
  switch (action.type) {
    case UPDATE_USER_LOGIN: {
      return {
        ...state,
        isLogin: action.payload,
      }
    }
    case UPDATE_USER_DETAIL: {
      return {
        ...state,
        userDetail: action.payload,
      }
    }
    case UPDATE_CURRENT_USER_PROJECTS: {
      return {
        ...state,
        currentUserProjects: action.payload,
      }
    }
    case UPDATE_CURRENT_USER_PROJECTS_LENGTH: {
      return {
        ...state,
        currentUserProjectsLength: action.payload
      }
    }
    default:
      return state
  }
}
export default user
