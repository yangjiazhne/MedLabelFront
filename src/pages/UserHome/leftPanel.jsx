import React from 'react'
import styles from './index.module.scss'
import { useHistory, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getMenus } from './config'
import { UserOutlined } from '@ant-design/icons'

// 已废弃
const LeftPanel = () => {
  const history = useHistory()
  let location = useLocation()
  // @ts-ignore
  const { user, userProjects } = useSelector(state => state.user)

  return (
    <div className={styles.leftWrap}>
      <div className={`${styles.leftButton} ${styles.username}`}>
        <UserOutlined className={styles.icon} />
        <span>{`${user.firstName || ''} ${user.secondName || ''}`}</span>
      </div>
      {getMenus().map(menu => (
        <div
          key={menu.tag}
          className={`${styles.leftButton} ${styles.link}`}
          onClick={() => history.push(menu.pathName)}
          style={{ background: menu.pathName === location.pathname ? '#f2f2f2' : '' }}
        >
          {menu.icon}
          <span>{menu.desc}</span>
        </div>
      ))}
      {/* <div className={styles.linkWrap}>
        <div className={styles.linkTitle}>Datasets</div>
        {userProjects.map((v, index) => (
          <Link
            to={{
              pathname: '/userHome/projects/' + v.id,
            }}
            className={styles.linkProject}
            key={index}
          >
            {v.name}
          </Link>
        ))}
      </div> */}
    </div>
  )
}

export default LeftPanel
