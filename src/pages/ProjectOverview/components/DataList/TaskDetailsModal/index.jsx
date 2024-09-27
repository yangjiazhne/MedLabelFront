import { Modal, Space, Table, Tag, Progress, Button, Empty } from 'antd'
import React, { useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'

const TaskDetailsModal = ({ taskDetails, showTaskDetailModal, setShowTaskDetailModal, reCreateDataset }) => {
  const history = useHistory()
  const columns = [
    {
      title: '数据集名称',
      dataIndex: 'DatasetName',
      key: 'DatasetName',
      width: '25%',
      align: 'center',
      render: text => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '进度',
      dataIndex: 'Progress',
      key: 'Progress',
      width: '50%',
      align: 'center',
      render: (text, record) => {
        let percent = ((record.SuccessNum + record.FailedNum) / record.TotalNum) * 100
        percent = parseFloat(percent.toFixed(1))

        return (
          <Progress
            percent={percent}
            status={percent < 100 ? 'active' : record.FailedNum > 0 ? 'exception' : 'success'}
          />
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'Status',
      width: '10%',
      align: 'center',
      render: (text, record) => {
        if (record.SuccessNum === 0 && record.FailedNum === 0) {
          return <Tag color="#595959">等待中</Tag>
        } else if (record.SuccessNum + record.FailedNum < record.TotalNum) {
          return <Tag color="geekblue">进行中</Tag>
        } else if (record.SuccessNum === record.TotalNum) {
          return <Tag color="green">创建完成</Tag>
        } else if (record.FailedNum === record.TotalNum) {
          return <Tag color="red">创建失败</Tag>
        } else if (record.SuccessNum + record.FailedNum === record.TotalNum) {
          return <Tag color="orange">部分完成</Tag>
        }
      },
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: '15%',
      align: 'center',
      render: (text, record) => {
        if (
          record.SuccessNum + record.FailedNum < record.TotalNum ||
          record.SuccessNum === record.TotalNum
        ) {
          return (
            <Button
              type="primary"
              onClick={() => {
                history.push(`/userHome/projects/${record.ProjectId}`)
              }}
            >
              到详情页
            </Button>
          )
        } else if (
          record.FailedNum === record.TotalNum ||
          record.SuccessNum + record.FailedNum === record.TotalNum
        ) {
          return (
            <Button type="primary" onClick={() => reCreateDataset(record.ProjectId)}>
              重新创建
            </Button>
          )
        }
      },
    },
  ]

  return (
    <Modal title="Basic Modal" open={showTaskDetailModal} onOk={() => setShowTaskDetailModal(false)} onCancel={() => setShowTaskDetailModal(false)}>
      {!taskDetails || taskDetails.length === 0 ? (
        <Empty style={{ marginTop: '50px' }} description={<h2>任务列表为空</h2>}></Empty>
      ) : (
        <Table columns={columns} dataSource={taskDetails} rowKey={record => record.ProjectId} />
      )}
    </Drawer>
  )
}

export default TaskDetailsModal
