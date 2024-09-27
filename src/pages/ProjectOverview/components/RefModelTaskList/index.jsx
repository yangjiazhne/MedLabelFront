import { getModelList, getTaskList, createPredictAllTask } from '@/request/actions/task'
import { getPathoSegRef } from '@/request/actions/tagger'
import React, { useEffect, useMemo, useState, useRef } from 'react'
import styles from './index.module.scss'
import {
  Button,
  Descriptions,
  Modal,
  Spin,
  Dropdown,
  Menu,
  Tag,
  Table,
  Space,
  Progress,
  Popover,
  message,
} from 'antd'
import { arraysEqualIgnoreOrder } from '@/helpers/Utils'
import { getToken } from '@/helpers/dthelper'
import { taskTypes, imgUploadPre } from '@/constants'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
const RefModelTaskList = ({ projectDetails }) => {
  const history = useHistory()
  const columns = [
    {
      title: (
        <span style={{ margin: '0px auto', display: 'table', fontWeight: 'bold' }}>模型名称</span>
      ),
      dataIndex: 'modelName',
      key: 'modelName',
      render: text => <span style={{ margin: '0px auto', display: 'table' }}>{text}</span>,
    },
    {
      title: (
        <span style={{ margin: '0px auto', display: 'table', fontWeight: 'bold' }}>
          适用图像类型
        </span>
      ),
      dataIndex: 'imageType',
      key: 'imageType',
      align: 'center',
      render: text => <span style={{ margin: '0px auto', display: 'table' }}>{text}</span>,
    },
    {
      title: (
        <span style={{ margin: '0px auto', display: 'table', fontWeight: 'bold' }}>类别数量</span>
      ),
      dataIndex: 'hasLabel',
      align: 'center',
      key: 'hasLabel',
      render: (value, record) => {
        return record.labels.length > 0 ? (
          <Popover
            content={record.labels.map((item, idx) => (
              <Tag key={idx}>{item}</Tag>
            ))}
          >
            {record.labels.length}
          </Popover>
        ) : (
          '-'
        )
      },
    },
    {
      title: (
        <span style={{ margin: '0px auto', display: 'table', fontWeight: 'bold' }}>推理信息</span>
      ),
      dataIndex: 'Status',
      key: 'status',
      align: 'center',
      render: (value, record) => {
        const colorMap = {
          推理中: 'warning',
          推理完成: 'success',
          推理失败: 'error',
          待推理: 'cyan',
          未推理: 'processing',
        }
        return (
          <Space style={{ margin: '0px auto', display: 'vertical' }}>
            <>
              <div style={{ margin: '0px', fontFamily: 'Tahoma' }}>
                {record.CreateTime ? record.CreateTime.split('.')[0] + '  ' : ''}
                <Tag color={colorMap[record.Status]}>{record.Status}</Tag>
              </div>
              <div style={{ width: '100%' }}>
                {record.CreateTimeStamp && record.FinishTimeStamp
                  ? (({ h, m, s }) => `推理总耗时：${h}时${m}分${s}秒`)(
                      (() => {
                        const totalTime = record.FinishTimeStamp
                          ? record.FinishTimeStamp - record.CreateTimeStamp
                          : 3671
                        const h = Math.floor(totalTime / 3600)
                        const m = Math.floor((totalTime % 3600) / 60)
                        const s = Math.floor(totalTime % 60)
                        return { h, m, s }
                      })()
                    )
                  : ''}
              </div>
            </>
          </Space>
        )
      },
    },
    {
      title: <span style={{ margin: '0px auto', fontWeight: 'bold' }}>{'操作'}</span>,
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      render: (_, record) => {
        return (
          <>
            <Space style={{ margin: '0px auto' }}>
              <span
                className="task-action"
                style={{
                  color: 'rgb(22, 64, 131)',
                }}
                onClick={() => {
                  currentModelDetail.current = refModels.find(
                    item => item.modelName === record.modelName
                  )
                  setModelDetailModalVisible(true)
                }}
              >
                模型介绍
              </span>
              {record.Status === '推理完成' ? (
                <span
                  className="task-action"
                  style={{
                    color: 'rgb(22, 64, 131)',
                  }}
                  onClick={() => {
                    if (projectDetails.imageType !== 'mrxs') {
                      history.push(
                        `/projects/space/${projectDetails.id}?status=al&model=` + record.modelName
                      )
                    } else {
                      history.push(
                        `/projects/pathoSpace/${projectDetails.id}?status=al&model=` +
                          record.modelName
                      )
                    }
                  }}
                >
                  查看结果
                </span>
              ) : (
                <></>
              )}
              {record.Status === '推理失败' ? (
                <div
                  className="task-action"
                  style={{
                    color: 'rgb(22, 64, 131)',
                  }}
                  onClick={() => {
                    currentTask.current = refTaskDict[record.modelName]
                    setErrorMsgModalVisible(true)
                  }}
                >
                  查看报错
                </div>
              ) : (
                <></>
              )}

              {record.Status != '推理完成' && record.Status != '推理中' && (
                <div
                  className="task-action"
                  style={{
                    color: 'rgb(22, 64, 131)',
                  }}
                  onClick={() => {
                    currentModelDetail.current = refModels.find(
                      item => item.modelName === record.modelName
                    )
                    currentTask.current = refTaskDict[record.modelName]
                    setSubmitModalVisible(true)
                  }}
                >
                  {record.Status === '未推理' ? '开始推理' : '重新推理'}
                </div>
              )}
            </Space>
          </>
        )
      },
    },
  ]

  const [refModels, setRefModels] = useState([])

  //这个对象用于存放模型对应的推理任务，key是modelName,values是task
  const [refTaskDict, setRefTaskDict] = useState({})
  const [dataSource, setDataSource] = useState([])

  const currentModelDetail = useRef(null)
  const currentTask = useRef(null)

  const [modelDetailModalVisible, setModelDetailModalVisible] = useState(false)
  const [errorMsgModalVisible, setErrorMsgModalVisible] = useState(false)
  const [submitModalVisible, setSubmitModalVisible] = useState(false)

  const fetchRefModels = async () => {
    if (projectDetails) {
      const totalModels = (await getModelList()).data.data
      console.log(totalModels)
      const availableModels = totalModels.filter(model => {
        return (
          taskTypes[model.type].value === projectDetails.task_type &&
          arraysEqualIgnoreOrder(model.labels, JSON.parse(projectDetails.taskRules).tags.split(','))
        )
      })
      //   const availableModels = totalModels
      setRefModels(availableModels)
    }
  }

  const createTask = async () => {
    const token = getToken()

    const taskQuery = {
      modelName: currentModelDetail.current.modelName,
      datasetName: projectDetails.name,
      projectId: projectDetails.id,
      tasktype: taskTypes[currentModelDetail.current.type].label,
    }
    let taskRes
    if (projectDetails.imageType !== 'mrxs') {
      taskRes = await createPredictAllTask(taskQuery)
    } else {
      taskRes = await getPathoSegRef(taskQuery)
    }
    if (!taskRes.err) {
      const body = taskRes.data
      if (body.code === 1) {
        message.error('推理任务创建失败')
      } else {
        message.success('推理任务创建成功')
        fetchRefTaskDict()
        setSubmitModalVisible(false)
      }
    } else {
      message.error('推理任务创建失败', taskRes.err)
    }
  }

  // 获取推理任务列表
  const fetchRefTaskDict = async () => {
    if (refModels.length > 0) {
      const totalTaskList = (await getTaskList()).data

      let avaiTaskDict = {}
      refModels.forEach(model => {
        const task = totalTaskList.find(
          task => task.projectId === projectDetails.id && task.modelName === model.modelName
        )
        if (task) {
          avaiTaskDict[model.modelName] = task
        }
      })

      setRefTaskDict(avaiTaskDict)
    }
  }

  useEffect(() => {
    fetchRefModels()
  }, [projectDetails])

  useEffect(() => {
    fetchRefTaskDict()
  }, [refModels])

  useEffect(() => {
    var need = false
    for (const task of Object.values(refTaskDict)) {
      if (task.Status === '推理中' || task.Status === '待推理') {
        need = true
        break
      }
    }
    if (need) {
      const timer = setInterval(() => {
        fetchRefTaskDict()
      }, 3000)
      return () => clearInterval(timer)
    }
  }, [refTaskDict])

  useEffect(() => {
    if (Object.keys(refModels).length > 0) {
      setDataSource([])
      refModels.forEach(model => {
        const task = refTaskDict[model.modelName]
        const newRecord = {
          modelName: model.modelName,
          imageType: model.imageType,
          hasLabel: model.hasLabel,
          Status: task?.Status || '未推理',
          CreateTime: task?.CreateTime || '',
          CreateTimeStamp: task?.CreateTimeStamp || 0,
          FinishTimeStamp: task?.FinishTimeStamp || 0,
          ErrorMsg: task?.ErrorMsg || '暂无错误信息',
          labels: model.hasLabel ? model.labels : [],
        }
        setDataSource(dataSource => [...dataSource, newRecord])
      })
    }
  }, [refTaskDict, refModels])
  
  if (refModels.length === 0) {
    return <></>
  } else {
    return (
      <div className={styles.container}>
        <p style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'bold', fontSize: '16px' }}>
          模型推理
        </p>
        <Table
          rowKey={record => record.indexOfItem}
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          className={styles.center}
        />
        <Modal
          title="模型详细信息"
          open={modelDetailModalVisible}
          footer={null}
          onCancel={() => {
            currentModelDetail.current = null
            setModelDetailModalVisible(false)
          }}
          width={1000}
        >
          <ModelDetail record={currentModelDetail.current} />
        </Modal>
        <Modal
          open={errorMsgModalVisible}
          footer={null}
          onCancel={() => {
            currentTask.current = null
            setErrorMsgModalVisible(false)
          }}
          width={1000}
        >
          {
            <pre
              dangerouslySetInnerHTML={{
                __html: currentTask.current?.ErrorMsg,
              }}
              style={{ fontFamily: 'Consolas' }}
            />
          }
        </Modal>
        <Modal
          title="确认提交任务"
          open={submitModalVisible}
          onCancel={() => setSubmitModalVisible(false)}
          onOk={() => {
            createTask()
          }}
          okText="确认"
          cancelText="取消"
          width={500}
        >
          <div>
            <div style={{ textAlign: 'center' }}>
              确认使用模型
              <span style={{ fontWeight: 'bold', color: 'red' }}>
                {currentModelDetail.current?.modelName}
              </span>
              推理以下数据集
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>
                <span>{projectDetails.name}</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    )
  }
}

const ModelDetail = ({ record }) => {
  const labelList = record.labels || []
  return (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="模型名称" key="modelName">
        <span style={{ fontWeight: 'bold' }}>{record.modelName}</span>
      </Descriptions.Item>
      <Descriptions.Item label="类型" key="type" span={2}>
        {taskTypes[record.type].label}
      </Descriptions.Item>
      <Descriptions.Item label="适用图像类型" key="imageType">
        {record.imageType}
      </Descriptions.Item>
      <Descriptions.Item label="类别" key="hasLabel" span={2}>
        {labelList.length > 0 ? labelList.map((item, idx) => <Tag key={idx}>{item}</Tag>) : <>-</>}
      </Descriptions.Item>
      <Descriptions.Item label="结果示例图片" span={2}>
        <Space align="center" size={15}>
          {record.path?.map((p, idx) => (
            <img src={`${imgUploadPre}${p}`} key={idx} style={{ width: '200px', height: 'auto' }} />
          ))}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label="模型简介" key="introduction" span={2}>
        {record.introduction}
      </Descriptions.Item>
    </Descriptions>
  )
}
export default RefModelTaskList
