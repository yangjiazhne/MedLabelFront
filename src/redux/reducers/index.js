/*
 * @Author: Azhou
 * @Date: 2021-05-11 23:03:56
 * @LastEditors: 徐文祥
 * @LastEditTime: 2021-05-17 13:47:06
 */
import { combineReducers } from 'redux'

import user from './user'
import project from './project'

export default combineReducers({
  user,
  project,
})
