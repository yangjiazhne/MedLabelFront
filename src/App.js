/*
 * @Author: Azhou
 * @Date: 2021-05-11 10:15:37
 * @LastEditors: Azhou
 * @LastEditTime: 2021-05-11 20:53:28
 */
import React from 'react'
import { HashRouter as Router, Switch, Route, Redirect } from 'react-router-dom'

import RouteWithSubRoutes from './router/routeWithSubRoutes'
import routes from './router/routes'
import './App.css'
import './styles/custom-antd.scss'

const App = () => {
  return (
    <Router>
      <Route exact path="/">
        <Redirect to="/entryPage" />
      </Route>
      <Switch>
        {routes.map((route, i) => (
          <RouteWithSubRoutes key={i} {...route} />
        ))}
      </Switch>
    </Router>
  )
}

export default App
