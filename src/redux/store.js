/*
 * @Author: Azhou
 * @Date: 2021-05-11 22:59:42
 * @LastEditors: Azhou
 * @LastEditTime: 2021-05-23 19:56:49
 */
import { createStore as _createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from './reducers'
import createMiddleware from './middleware/clientMiddleware'
import ApiClient from '../helpers/ApiClient'
import { userInitialState } from './reducers/user'
import { projectInitialState } from './reducers/project'



const client = new ApiClient()

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

let finalCreateStore = composeEnhancers(applyMiddleware(createMiddleware(client), thunk))(_createStore)

export default finalCreateStore(rootReducer, {
  user: userInitialState,
  project: projectInitialState
})
