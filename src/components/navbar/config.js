import { ClusterOutlined, DatabaseOutlined, UnorderedListOutlined } from '@ant-design/icons'

// 导航栏
export const pathItems = [
    {
      label: '数据集',
      pathName: '/userHome/my-projects',
      key: 'datasets',
      icon: <DatabaseOutlined />,
    },
    {
      label: '模型推理',
      pathName: '/userHome/model-list',
      key: 'models',
      icon: <ClusterOutlined />,
      disabled: true
    },
    {
      label: '任务中心',
      pathName: '/userHome/task-list',
      key: 'tasks',
      icon: <UnorderedListOutlined />,
      disabled: true
    }
];

// 用户登出
export const userOperateItems = [
    {
      key: 'logout',
      label: '退出登录'
    },
  ]