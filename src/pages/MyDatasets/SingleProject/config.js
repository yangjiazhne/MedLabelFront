import { DeleteOutlined, FormOutlined } from '@ant-design/icons'

// 数据集相关操作
export const projectOperateItems = [
    {
      label: '删除',
      key: 'delete',
      icon: <DeleteOutlined style={{ color: 'red' }} />,
    },
    {
      label: '编辑',
      key: 'edit',
      icon: <FormOutlined style={{ color: '#2e8efb' }} />,
    },
];
