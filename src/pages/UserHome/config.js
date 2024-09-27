import { ClusterOutlined, DatabaseOutlined, UnorderedListOutlined } from '@ant-design/icons'
import React from 'react'
import styles from './index.module.scss'

// 已废弃
export const getMenus = () => {
  return [
    {
      tag: 'datasets',
      pathName: '/userHome/my-projects',
      desc: '数据集',
      icon: <DatabaseOutlined className={styles.icon} />,
    },
    {
      tag: 'models',
      pathName: '/userHome/model-list',
      desc: '模型推理',
      icon: <ClusterOutlined className={styles.icon} />,
    },
    {
      tag: 'tasks',
      pathName: '/userHome/task-list',
      desc: '任务中心',
      icon: <UnorderedListOutlined className={styles.icon} />,
    },
  ]
}
