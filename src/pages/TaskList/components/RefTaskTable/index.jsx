/*
 * @Author: Azhou
 * @Date: 2021-11-24 18:02:41
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:48:41
 */
import { Button, Modal, Space, Table, message } from 'antd'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import './ModelTable.css'
import { getToken } from '@/helpers/dthelper'
import { taskTypes } from '@/constants'
import { createPredictAllTask } from '@/request/actions/task'

const RefTaskTable = ({ taskList }) => {
  const { t } = useTranslation()
  const [projId, setProjId] = useState('')
  const [open, setOpen] = useState(false)
  const [refModels, setRefModels] = useState([])
  const [refTaskDict, setRefTaskDict] = useState({})
  const goToRes = useGoToRes()

  const createTask = async (modelName, name, id, type) => {
    const token = getToken()

    const taskQuery = {
      modelName: modelName,
      datasetName: name,
      projectId: id,
      tasktype: type,
    }
    const taskRes = await createPredictAllTask(taskQuery)
    if (!taskRes.err) {
      const body = taskRes.data
      if (body.code === 1) {
        message.error('推理任务创建失败')
      } else {
        message.success('推理任务重建成功')
        // fetchRefTaskDict()
      }
    } else {
      message.error('推理任务创建失败', taskRes.err)
    }
  }

  // const fetchRefTaskDict = async () => {
  //   if (refModels.length > 0) {
  //     const totalTaskList = (await getTaskList()).data
  //     console.log(totalTaskList[0])

  //     let avaiTaskDict = {}
  //     refModels.forEach(model => {
  //       const task = totalTaskList.find(
  //         task => task.projectId === projectDetails.id && task.modelName === model.modelName
  //       )
  //       if (task) {
  //         avaiTaskDict[model.modelName] = task
  //       }
  //     })
  //     setRefTaskDict(avaiTaskDict)
  //   }
  // }

  const columns = [
    {
      title: t('datasetName'),
      dataIndex: 'DatasetName',
      key: 'DatasetName',
      width: '15%',
      render: text => <span style={{ fontWeight: 'bold', whiteSpace: 'pre-wrap' }}>{text}</span>,
    },
    {
      title: t('createTime'),
      dataIndex: 'CreateTimeStamp',
      key: 'CreateTimeStamp',
      width: '20%',
      sorter: (a, b) => a.CreateTimeStamp - b.CreateTimeStamp,
      render: text => {
        const timestamp = Number(text) * 1000 // convert to milliseconds
        const date = new Date(timestamp)

        const year = date.getFullYear()
        const month = date.getMonth() + 1 // getMonth() returns a zero-based value (where zero indicates the first month)
        const day = date.getDate()
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()

        const formattedDate = `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
        return <span>{formattedDate}</span>
      },
    },
    {
      title: t('modelName'),
      dataIndex: 'modelName',
      key: 'modelName',
      width: '10%',
      render: text => <span>{text}</span>,
    },
    {
      title: t('type'),
      dataIndex: 'Type',
      key: 'type',
      width: '8%',
      render: text => <span>{text || '-'}</span>,
    },
    {
      title: t('status'),
      dataIndex: 'Status',
      key: 'status',
      width: '10%',
      // render: (text, record) => (
      //   <div>
      //     {record.Progress === 100 ? (
      //       <CheckCircleOutlined style={{ color: 'green' }} />
      //     ) : (
      //       <span>时间还剩: {renderLeftTime(record.TimeLeft)}</span>
      //     )}
      //   </div>
      // ),
      render: (value, record) => <span>{value}</span>,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: '15%',
      render: (_, record) => (
        <Space>
          {record.Status === '推理完成' ? (
            <div
              className="task-action"
              style={{
                color: 'rgb(22, 64, 131)',
              }}
              onClick={() => {
                goToRes(record)
              }}
            >
              查看结果
            </div>
          ) : (
            <></>
          )}
          {record.Status === '推理失败' ? (
            <div style={{ display: 'flex' }}>
              <div
                className="task-action"
                style={{
                  color: 'rgb(22, 64, 131)',
                  marginTop: '5px',
                }}
                onClick={() => {
                  setProjId(record.projectId)
                  setOpen(true)
                }}
              >
                查看报错
              </div>
              <Button
                type="primary"
                style={{
                  // color: 'rgb(22, 64, 131)',
                  marginLeft: '10px',
                }}
                onClick={() => {
                  createTask(record.modelName, record.DatasetName, record.projectId, record.Type)
                }}
              >
                重新推理
              </Button>
            </div>
          ) : (
            <></>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <Table
        rowKey={record => record.key}
        columns={columns}
        dataSource={taskList.map((item, index) => {
          return {
            ...item,
            key: index,
          }
        })}
        pagination={false}
      />
      {/* 报错弹窗 */}
      <Modal open={open} footer={null} onCancel={() => setOpen(false)} width={1000}>
        {
          <pre
            dangerouslySetInnerHTML={{
              __html: taskList.find(task => task.projectId === projId)?.ErrorMsg || '暂无错误信息',
            }}
            style={{ fontFamily: 'Consolas' }}
          />
        }
      </Modal>
    </>
  )
}

export const useGoToRes = () => {
  const history = useHistory()

  const goToRes = task => {
    localStorage.setItem('currentProject', task.projectId)
    history.push(`/projects/space/${task.projectId}?status=al&model=${task.modelName}`)
  }

  return goToRes
}

export default RefTaskTable
