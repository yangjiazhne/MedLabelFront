/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:45:47
 */
import { getModelList } from '@/request/actions/task'
import { Descriptions, Spin, Tag, message, Modal, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ModelTable } from './components'
import styles from './index.module.scss'
import { taskTypes, imgUploadPre } from '@/constants'

export const ModelDetail = ({ record }) => {
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

const ModelList = () => {
  const [loading, setLoading] = useState(false)
  const [modelList, setModelList] = useState([])

  const [modelDetail, setModelDetail] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  // const [handleUploadDone, setHandleUploadDone] = useState(null)

  // 获取模型列表
  const refreshData = async () => {
    setLoading(true)
    const res = await getModelList()
    setLoading(false)
    if (!res.err) {
      setModelList(res.data.data)
    } else {
      message.error(res.data || '请求发生错误！')
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return (
    <div style={{padding: '30px 60px', flex: 1, minHeight:'88vh', width: '100%'}}>
      <Spin spinning={loading}>
        {/* <div className={styles.titleWrap}>
            <div className={styles.title}>模型</div>
        </div> */}
        <div className={styles.container}>
            <ModelTable
                modelList={modelList}
                setModelDetail={setModelDetail}
                setDetailModalVisible={setDetailModalVisible}
                // setHandleUploadDone={setHandleUploadDone}
            />
        </div>
        <div style={{ width: '5px' }} />

        <Modal
            title="模型详细信息"
            open={detailModalVisible}
            footer={null}
            onCancel={() => setDetailModalVisible(false)}
            width={1000}
        >
            <ModelDetail record={modelDetail} />
        </Modal>
      </Spin>
    </div>
  )}

export default ModelList
