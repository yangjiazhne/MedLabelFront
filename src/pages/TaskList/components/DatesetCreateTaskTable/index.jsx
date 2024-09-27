import { Modal, Space, Table, Tag, Progress, Button, Empty, Input, message } from 'antd'
import React, { useState, useMemo, useEffect } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { TaskDetailsDrawer } from './TaskDetailsDrawer'
import {
  getDicomTaskDetails,
  getPathoTaskDetails,
  reCreateDicomDataset,
  reCreatePathoDataset,
} from '@/request/actions/task'
import { searchProject } from '@/request/actions/project'

const DatasetCreateTaskTable = ({ taskList, defaultTaskId }) => {
  // 用于渲染某个任务的详细信息，在drawer中显示
  const [curTaskId, setCurTaskId] = useState(-1)
  const [curTaskType, setCurTaskType] = useState('')
  const [taskDetails, setTaskDetails] = useState(null)
  const [showDrawer, setShowDrawer] = useState(false)

  // 重新创建数据集的modal
  const [reCreateModalVisible, setReCreateModalVisible] = useState(false)
  const [resourceAddress, setResourceAddress] = useState('')
  const [resourceProjectId, setResourceProjectId] = useState(null)

  // 数据集创建任务全部结束 任务列表为空 或 任务全部完成/失败
  const taskDetailsFetchEnd = useMemo(() => {
    return (
      !taskDetails ||
      (taskDetails.length > 0 &&
        taskDetails.filter(task => task.SuccessNum + task.FailedNum < task.TotalNum).length === 0)
    )
  }, [taskDetails])

  const columns = [
    {
      title: '总数据集名称',
      dataIndex: 'DatasetName',
      key: 'DatasetName',
      width: '14%',
      align: 'center',
      render: text => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'Type',
      key: 'Type',
      width: '8%',
      align: 'center',
      render: (text, record) => {
        if (record.Type === 'mrxs') {
          return <Tag color="cyan">病理图</Tag>
        } else if (record.Type === 'dicom') {
          return <Tag color="purple">dicom</Tag>
        }
      },
    },
    {
      title: '创建时间',
      dataIndex: 'CreateTime',
      key: 'CreateTime',
      width: '18%',
      align: 'center',
      render: text => <span>{text ? text.split('.')[0] : '-'}</span>,
    },
    {
      title: '进度',
      dataIndex: 'Progress',
      key: 'Progress',
      width: '40%',
      align: 'center',
      render: (text, record) => {
        let percent = ((record.SuccessNum + record.FailedNum) / record.TotalNum) * 100
        percent = parseFloat(percent.toFixed(1))

        return (
          <Progress
            percent={percent}
            // strokeColor={{
            //   '0%': '#108ee9',
            //   '100%': '#87d068',
            // }}
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
        if (record.SuccessNum + record.FailedNum < record.TotalNum) {
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
      width: '10%',
      align: 'center',
      render: (text, record) => {
        let taskId = record.TaskId
        let taskType = record.Type
        return (
          <Button
            type="primary"
            onClick={async () => {
              let _taskDetails = await fetchTaskDetails(taskId, taskType)
              setTaskDetails(_taskDetails)  // 该条任务详情信息
              setCurTaskId(taskId)  // 当前任务id
              setCurTaskType(taskType)  // 当前任务类型
              setShowDrawer(true)  // 打开查看详情drawer
            }}
          >
            查看详情
          </Button>
        )
      },
    },
  ]

  // 检查defaultTaskId是否存在, 并且是否在taskList中，如果存在则默认展开drawer
  useEffect(async () => {
    if (defaultTaskId && taskList) {
      const task = taskList.find(task => task.TaskId == defaultTaskId)
      const taskId = task.TaskId
      const taskType = task.Type

      if (task) {
        let _taskDetails = await fetchTaskDetails(taskId, taskType)
        setTaskDetails(_taskDetails)
        setCurTaskId(taskId)
        setCurTaskType(taskType)
        setShowDrawer(true)
      }
    }
  }, [defaultTaskId])

  // 定时刷新任务详情
  useEffect(() => {
    if (curTaskId !== -1 && showDrawer && taskDetails && !taskDetailsFetchEnd) {
      const intervalId = setInterval(async () => {
        let _taskDetails = await fetchTaskDetails(curTaskId, curTaskType)   // 获取当前任务的详情
        setTaskDetails(_taskDetails)
      }, 2000)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [curTaskId, taskDetailsFetchEnd, showDrawer])

  // 获取任务详情
  const fetchTaskDetails = async (taskId, taskType) => {
    let _taskDetails
    if (taskType === 'dicom') {
      _taskDetails = await getDicomTaskDetails(taskId)
    } else if (taskType === 'mrxs') {
      _taskDetails = await getPathoTaskDetails(taskId)
    }

    // 转换数据格式
    _taskDetails = _taskDetails.data.map((item, index) => {
      return {
        Id: item.id,
        TaskId: taskId,
        Type: taskType,
        ProjectId: item.project,
        DatasetName: item.projectName,
        CreateTime: new Date(item.created_timestamp).toLocaleString(),
        EndTime: new Date(item.end_timestamp).toLocaleString(),
        SuccessNum: item.successImages,
        FailedNum: item.failedImages,
        TotalNum: item.totalImages,
      }
    })
    return _taskDetails
  }

  // 重新创建病理图数据集
  const reCreateDataset = async projectId => {
    const projectDetail = (await searchProject(projectId)).data
    console.log(projectDetail)
    setResourceAddress(projectDetail.mrxsAddress)
    setResourceProjectId(projectId)
    setReCreateModalVisible(true)
  }

  const handleInputChange = e => {
    setResourceAddress(e.target.value)
  }

  return (
    <div>
      {taskList && taskList.length === 0 ? (
        <Empty style={{ marginTop: '50px' }} description={<h2>无数据集创建任务</h2>}></Empty>
      ) : (
        <div>
          <Table columns={columns} dataSource={taskList} rowKey={record => record.TaskId} />
          <TaskDetailsDrawer
            taskDetails={taskDetails}
            showDrawer={showDrawer}
            setShowDrawer={setShowDrawer}
            reCreateDataset={reCreateDataset}
          />
          <Modal
            title="确认资源地址"
            open={reCreateModalVisible}
            okText="确认"
            cancelText="取消"
            onOk={() => {
              const taskFunctions = {
                dicom: reCreateDicomDataset,
                mrxs: reCreatePathoDataset,
              }

              const reCreateTask = taskFunctions[curTaskType]

              if (reCreateTask) {
                reCreateTask(resourceProjectId, curTaskId, resourceAddress).then(async res => {
                  if (res.err) {
                    message.error('重新创建任务失败，请检查网络连接或联系工作人员')
                  } else {
                    message.success('重新创建任务成功')
                    let _taskDetails = await fetchTaskDetails(curTaskId, curTaskType)
                    setTaskDetails(_taskDetails)
                  }
                  setReCreateModalVisible(false)
                })
              } else {
                message.error('该任务类型暂不支持重新创建，请删除数据集后重试')
              }
            }}
            onCancel={() => {
              setReCreateModalVisible(false)
            }}
          >
            <Input.TextArea
              placeholder="请输入资源地址，只允许输入一条"
              value={resourceAddress}
              onChange={handleInputChange}
            />
          </Modal>
        </div>
      )}
    </div>
  )
}

export default DatasetCreateTaskTable
