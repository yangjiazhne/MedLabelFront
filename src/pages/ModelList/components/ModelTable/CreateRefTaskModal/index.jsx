/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:54:23
 */
import { getModelList } from '@/request/actions/task'
import { getToken } from '@/helpers/dthelper'
import {
  Form,
  Input,
  Select,
  Spin,
  Modal,
  Tag,
  Space,
  Descriptions,
  Table,
  message,
  ConfigProvider,
  Pagination,
  Button,
} from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import qs from 'qs'
import zhCN from 'antd/lib/locale/zh_CN'
import React, { useMemo, useRef, useEffect, useState } from 'react'
import { features, getFormConfig } from './config'
import styles from './index.module.scss'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router-dom'
// import debounce from 'lodash/debounce'
import { searchProject } from '@/request/actions/project'
import { getTaskList, createPredictAllTask } from '@/request/actions/task'
import { taskTypes } from '@/constants'

const { Option } = Select
const activeStyle = {
  backgroundColor: '#5cc1bb',
  color: '#fff',
}

// 模型描述
const RefModelDetail = record => {
  const labelList = record.labels || []

  return (
    <Descriptions bordered column={3}>
      <Descriptions.Item label="模型名称" key="modelName">
        <span style={{ fontWeight: 'bold' }}>{record.modelName}</span>
      </Descriptions.Item>
      <Descriptions.Item label="任务类型" key="taskType">
        {taskTypes[record.type].label}
      </Descriptions.Item>
      <Descriptions.Item label="适用图像类型" key="imageType">
        {record.imageType}
      </Descriptions.Item>
      <Descriptions.Item label="类别" key="hasLabel" span={3}>
        {labelList.length > 0 ? labelList.map((item, idx) => <Tag key={idx}>{item}</Tag>) : <>-</>}
      </Descriptions.Item>
    </Descriptions>
  )
}

// 数据集选择列表
const DatasetTable = ({
  taskType,    // 模型任务类型
  datasetList,    // 当前分页数据集
  currentPage,    // 当前页数
  setCurrentPage, // 页面大小
  datasetTotal,   // 总共数据集长度
  selectedDatasetList,   // 选中的数据集
  setSelectedDatasetList,    // 设置当前选中的数据集
  fetchOptions,   // 获取数据集接口
}) => {
  const handleSearch = (selectedKeys, confirm) => {
    confirm()
    // 这里调用后端搜索接口，传入 selectedKeys[0] 作为搜索关键词
    const queryData = {
      start: (currentPage - 1) * 5,
      count: 5,
      taskType: taskType.value,
      keyword: selectedKeys[0],
      tags: refModelDetail.labels.join(','),
      labelStrict: true,
    }
    fetchOptions(queryData)
  }

  const handleReset = clearFilters => {
    clearFilters()
    // 这里调用后端接口，获取未过滤的数据
    const queryData = {
      start: (currentPage - 1) * 5,
      count: 5,
      taskType: taskTypes[refModelDetail.type].value,
      tags: refModelDetail.labels.join(','),
      labelStrict: true,
    }
    fetchOptions(queryData)
  }

  const columns = [
    {
      title: '数据集名称',
      dataIndex: 'name',
      align: 'center',
      key: 'name',
      width: '30%',
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`请输入关键词`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm)}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
              重置
            </Button>
          </Space>
        </div>
      ),
      render: text => <span style={{ fontWeight: 'bold' }}>{text}</span>,
    },
    {
      title: '数据集简介',
      dataIndex: 'introduction',
      align: 'center',
      key: 'introduction',
      width: '70%',
      render: (text, record) => {
        return <span>{JSON.parse(record.taskRules).instructions}</span>
      },
    },
  ]

  // 控制选中行
  const rowSelection = {
    selectedRowKeys: selectedDatasetList.map(ele => ele.id),
    preserveSelectedRowKeys: true,
    onChange: (selectedRowKeys, selectedRows) => {
      console.log(selectedRowKeys)
      setSelectedDatasetList(selectedRows)
    },
  }
  return (
    <div>
      <div></div>
      <Table
        rowKey={'id'}
        columns={columns}
        dataSource={datasetList}
        bordered
        pagination={false}
        rowSelection={rowSelection}
        title={() => {
          return (
            <div style={{ textAlign: 'center', marginBottom: '-10px', marginTop: '-10px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '20px' }}>可选数据集列表</span>
              <div>
                <span style={{ fontSize: '10px' }}>
                  <span style={{ color: 'red' }}>*</span>
                  <span style={{ color: 'gray' }}>
                    勾选列表项表示选择该数据集，数据集和模型的类别、任务类型严格对应
                  </span>
                </span>
              </div>
            </div>
          )
        }}
      ></Table>
      <ConfigProvider locale={zhCN}>
        <Pagination
          current={currentPage}
          showQuickJumper
          // pageSizeOptions={['6', '10', '20', '30', '50']} // 修改这里
          defaultCurrent={1}
          defaultPageSize={5}
          total={datasetTotal}
          // 分页时合并选中数据集
          onChange={(current, size) => {
            setCurrentPage(current)
          }}
          style={{
            alignSelf: 'center',
            width: '50%',
            justifyContent: 'center',
            marginLeft: '35%',
            marginTop: '20px',
          }}
        />
      </ConfigProvider>
      <div style={{ float: 'right' }}>
        已选择<span style={{ color: 'red' }}>{selectedDatasetList.length}</span>个数据集
      </div>
    </div>
  )
}

export const CreateRefTaskModal = ({
  refModelDetail,
  showCreateTask,
  setShowCreateTask,
  // setHandleUploadDone,
  debounceTimeout = 800,
}) => {
  const dispatch = useDispatch()
  const history = useHistory()

  const [loading, setLoading] = useState(false)
  const [feature, setFeature] = useState('')

  const [fetching, setFetching] = useState(false) //表示是否正在加载选项数据
  const fetchRef = useRef(0) //标识当前的请求，以处理异步回调时的顺序问题。
  const currentTaskType = useRef('classification') //防止切换任务类型时如果searchValue有值会自动清空调接口请求数据

  const [datasetList, setDatasetList] = useState([])

  //控制当前页数
  const [currentPage, setCurrentPage] = useState(1)
  const [datasetTotal, setDatasetTotal] = useState(0)

  const [selectedDatasetList, setSelectedDatasetList] = useState([])

  const [submitModalVisible, setSubmitModalVisible] = useState(false)

  // @ts-ignore
  const { userProjects } = useSelector(state => state.user)

  useEffect(() => {
    if (refModelDetail) {
      const queryData = {
        start: (currentPage - 1) * 5,
        count: 5,
        taskType: taskTypes[refModelDetail.type].value,
        tags: refModelDetail.labels.join(','),
        labelStrict: true,
      }
      fetchOptions(queryData)
    }
  }, [refModelDetail, currentPage])

  useEffect(() => {
    if (loading) setLoading(false)
  }, [datasetList])

  const fetchOptions = async queryData => {
    console.log(qs.stringify(queryData))
    setLoading(true)
    const res = await getUserProjects(queryData)
    if (!res.err) {
      setDatasetList(res.data.allUserProjectDetail)
      setDatasetTotal(res.data.allUserProjectLength)
    } else {
      message.error(res.data)
    }
  }

  // const createTask = async () => {
  //   const { uid, token } = getUidToken()
  //   const res = await getTaskList()
  //   let taskList = []
  //   if (!res.err) {
  //     taskList = res.data
  //   } else {
  //     message.error(res.data, '获取任务列表失败，请检查网络连接后重试或联系工作人员')
  //   }
  //   const newDataset = selectedDatasetList.filter(dataset => {
  //     return !taskList.find(task => {
  //       return task.DatasetName === dataset.name && task.modelName === refModelDetail.modelName
  //     })
  //   })

  //   let successNum = 0
  //   let failNum = 0
  //   let taskRes
  //   newDataset.forEach(async dataset => {
  //     const taskQuery = {
  //       uid: uid,
  //       modelName: refModelDetail.modelName,
  //       datasetName: dataset.name,
  //       projectId: dataset.id,
  //       tasktype: taskTypes[refModelDetail.type].label,
  //     }
  //     if (dataset.imageType !== 'mrxs') {
  //       taskRes = await createPredictAllTask(taskQuery)
  //     } else {
  //       taskRes = await getPathoSegRef(taskQuery)
  //     }
  //     if (!taskRes.err) {
  //       const body = taskRes.data
  //       if (body.code === 1) {
  //         failNum++
  //       } else {
  //         successNum++
  //       }
  //     }
  //   })
  //   const existNum = selectedDatasetList.length - newDataset.length
  //   message.success(
  //     '创建成功' +
  //       successNum.toString() +
  //       '条任务, 创建失败' +
  //       failNum.toString() +
  //       '条任务, 已存在' +
  //       existNum.toString() +
  //       '条任务'
  //   )
  //   history.push('/userHome/task-list')

  //   // setHandleUploadDone({
  //   //   successNum: successNum,
  //   //   failNum: failNum,
  //   //   existNum: selectedDatasetList.length - newDataset.length,
  //   // })
  // }

  return (
    <div>
      <Modal
        title="新建推理任务"
        open={showCreateTask}
        onOk={() => {
          setSubmitModalVisible(true)
        }}
        okText="创建"
        cancelText="取消"
        onCancel={() => {
          setShowCreateTask(false)
        }}
        width={1000}
      >
        <div style={{ marginBottom: '20px' }}>
          <RefModelDetail {...refModelDetail} />
        </div>
        <Spin spinning={loading}>
          <DatasetTable
            taskType={refModelDetail?.type}
            datasetList={datasetList}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            datasetTotal={datasetTotal}
            selectedDatasetList={selectedDatasetList}
            setSelectedDatasetList={setSelectedDatasetList}
            fetchOptions={fetchOptions}
          />
        </Spin>
        <Modal
          title="确认提交任务"
          open={submitModalVisible}
          onCancel={() => setSubmitModalVisible(false)}
          onOk={() => {
            // createTask()
          }}
          width={500}
        >
          <div>
            <div style={{ textAlign: 'center' }}>
              确认使用模型
              <span style={{ fontWeight: 'bold', color: 'red' }}>{refModelDetail?.modelName}</span>
              推理以下数据集
            </div>
            <div style={{ textAlign: 'center' }}>
              {selectedDatasetList.map((ele, idx) => {
                return (
                  <div key={idx}>
                    <span>{ele.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Modal>
      </Modal>
    </div>
  )
}

export default CreateRefTaskModal
