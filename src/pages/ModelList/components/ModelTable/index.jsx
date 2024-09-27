/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:46:36
 */
import React, { useState } from 'react'
import { Button, Popover, Space, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { taskTypes } from '@/constants'
import { CreateRefTaskModal } from './CreateRefTaskModal/index.jsx'

const ModelTable = ({ modelList, setModelDetail, setDetailModalVisible}) => {
  // 控制新建任务弹窗
  const [showCreateTask, setShowCreateTask] = useState(false)

  const [refModelDetail, setRefModelDetail] = useState(null)

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'modelName',
      align: 'center',
      key: 'modelName',
      render: text => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '任务类型',
      dataIndex: 'type',
      align: 'center',
      key: 'type',
      render: (text, _) => taskTypes[text].label,
    },
    {
      title: '适用图像类型',
      dataIndex: 'imageType',
      align: 'center',
      key: 'imageType',
      render: (text, _) => text,
    },
    {
      title: '类别数量',
      dataIndex: 'hasLabel',
      align: 'center',
      key: 'hasLabel',
      render: (text, record) =>
        text ? (
          <Popover
            content={record.labels.map((item, idx) => (
              <Tag key={idx}>{item}</Tag>
            ))}
          >
            {record.labels.length}
          </Popover>
        ) : (
          '-'
        ),
    },
    {
      title: '模型简介',
      dataIndex: 'introduction',
      align: 'center',
      key: 'introduction',
      // width: 20,
      render: (text, _) => (
        <div
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            display: 'inline-block',
            width: '20em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: '操作',
      align: 'center',
      key: 'operation',

      render: (text, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setModelDetail(record)
              setDetailModalVisible(true)
            }}
          >
            查看
          </Button>
          <Button
            style={{ color: 'white', backgroundColor: '#308014', borderColor: '#308014' }}
            onClick={() => {
              setRefModelDetail(record)
              setShowCreateTask(true)
            }}
            icon={<PlusOutlined />}
          >
            推理
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Table columns={columns} rowKey={'id'} dataSource={modelList} pagination={false} />
      <CreateRefTaskModal
        {...{ refModelDetail, showCreateTask, setShowCreateTask }}
      />
    </>
  )
}

export default ModelTable
