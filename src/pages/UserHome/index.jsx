import React from 'react'
import { Switch } from 'react-router-dom'
import { Footer, Navbar } from '@/components'
import RouteWithSubRoutes from '@/router/routeWithSubRoutes'
import LeftPanel from './leftPanel'
import styles from './index.module.scss'

const UserHome = ({ routes }) => {

  return (
    <>
      <Navbar />
      <div className={styles.userHomeContainer}>
        {/* <LeftPanel /> */}
        <div style={{width: '100%'}}>
          <Switch>
            {routes.map((route, i) => (
              <RouteWithSubRoutes key={i} {...route} />
            ))}
          </Switch>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default UserHome
