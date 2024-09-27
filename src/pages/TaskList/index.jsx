import {
  getTaskList,
  postClassifyTask,
  postSegmentTask,
  postYoloTask,
  getDatasetCreateTaskList,
} from '@/request/actions/task'
import { useParams } from 'react-router-dom'
import { Spin, message, Tabs } from 'antd'
import React, { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { RefTaskTable, DatasetCreateTaskTable } from './components'
import styles from './index.module.scss'

const TaskList = () => {
  // @ts-ignore
  let { datasetTaskId } = useParams()

  const { userProjects } = useSelector(state => state.user)

  const [loading, setLoading] = useState(false)
  const [refInitialized, setRefInitialized] = useState(false)
  const [datasetCreateInitialized, setDatasetCreateInitialized] = useState(false)

  const [refTaskList, setRefTaskList] = useState(null)
  const [datasetCreateTaskList, setDatasetCreateTaskList] = useState(null)

  //当前激活的tab
  const [activeTab, setActiveTab] = useState(datasetTaskId ? 'dataset' : 'ref')

  // 推理任务是否全部处理完毕 列表为空 或 列表中的任务全部推理成功/推理失败
  const refTaskListFetchEnd = useMemo(() => {
    return (
      refInitialized &&
      (refTaskList.length === 0 ||
        (refTaskList.length > 0 &&
          refTaskList.filter(task => !(task.Status === '推理完成' || task.Status === '推理失败'))
            .length === 0))
    )
  }, [refTaskList])

  // 数据集创建任务是否全部完成  列表为空 或 每个任务的成功数和失败数加起来等于总任务数
  const datasetCreateTaskListFetchEnd = useMemo(() => {
    return (
      datasetCreateInitialized &&
      (datasetCreateTaskList.length === 0 ||
        (datasetCreateTaskList.length > 0 &&
          datasetCreateTaskList.filter(task => task.SuccessNum + task.FailedNum < task.TotalNum)
            .length === 0))
    )
  }, [datasetCreateTaskList])

  const fetchRefTaskList = async () => {
    getTaskList().then(res => {
      if (!res.err) {
        setRefTaskList(res.data)
      } else {
        message.error('获取任务列表失败，请检查网络连接后重试或联系工作人员')
      }
    })
  }

  const fetchdatasetCreateTaskList = async () => {
    // 暂时没有获得后端代码，测试时用临时数据
    let dicomList = await getDatasetCreateTaskList('dicom')
    let pathoList = await getDatasetCreateTaskList('mrxs')
    dicomList = dicomList.data.map((item, index) => {
      return {
        TaskId: item.id,
        Type: 'dicom',
        DatasetName: item.name,
        CreateTime: new Date(item.created_timestamp).toLocaleString(),
        EndTime: new Date(item.end_timestamp).toLocaleString(),
        SuccessNum: item.successProjects,
        FailedNum: item.failedProjects,
        TotalNum: item.totalProjects,
      }
    })
    pathoList = pathoList.data.map((item, index) => {
      return {
        TaskId: item.id,
        Type: 'mrxs',
        DatasetName: item.name,
        CreateTime: new Date(item.created_timestamp).toLocaleString(),
        EndTime: new Date(item.end_timestamp).toLocaleString(),
        SuccessNum: item.successProjects,
        FailedNum: item.failedProjects,
        TotalNum: item.totalProjects,
      }
    })
    setDatasetCreateTaskList([...dicomList, ...pathoList])
  }

  const fetchData = async () => {
    setLoading(true)
    // 获取推理任务列表
    if (activeTab === 'ref') {
      fetchRefTaskList()
      if (!refInitialized) {
        setRefInitialized(true)
      }
    }

    // 获取数据集创建任务列表
    if (activeTab === 'dataset') {
      fetchdatasetCreateTaskList()
      if (!datasetCreateInitialized) {
        setDatasetCreateInitialized(true)
      }
    }

    setLoading(false)
  }

  // useEffect(() => {
  //   setInterval(() => {
  //     console.log(datasetCreateTaskListFetchEnd)
  //   }, 3000)
  // })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'ref' && !refTaskListFetchEnd) {
      const intervalId = setInterval(fetchRefTaskList, 2000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [refTaskListFetchEnd, activeTab])

  useEffect(() => {
    if (activeTab === 'dataset' && !datasetCreateTaskListFetchEnd) {
      const intervalId = setInterval(fetchdatasetCreateTaskList, 2000)
      return () => {
        clearInterval(intervalId)
      }
    }
  }, [datasetCreateTaskListFetchEnd, activeTab])

  return (
    <div style={{padding: '30px 60px', flex: 1, minHeight:'88vh', width: '100%'}}>
      <Spin spinning={loading}>
        {/* <div className={styles.titleWrap}>
          <div className={styles.title}>任务中心</div>
        </div> */}
        <div className={styles.container}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ marginBottom: 30, width: '100%' }}
          >
            <Tabs.TabPane tab="推理任务" key="ref">
              {refTaskList && <RefTaskTable taskList={refTaskList} />}
            </Tabs.TabPane>
            <Tabs.TabPane tab="数据集创建任务" key="dataset">
              {datasetCreateTaskList && (
                <DatasetCreateTaskTable
                  taskList={datasetCreateTaskList}
                  defaultTaskId={datasetTaskId}
                />
              )}
            </Tabs.TabPane>
          </Tabs>
        </div>
     </Spin>
    </div>
  )
}

export default TaskList
