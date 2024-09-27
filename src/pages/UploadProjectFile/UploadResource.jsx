import { DeleteOutlined, FileOutlined, UploadOutlined } from '@ant-design/icons'
import React, { useMemo, useState } from 'react'
import { Upload, Button, message, Progress, Tabs, Input } from 'antd'
import styles from './index.module.scss'
import { VIcon } from '@/components'
import bytes from 'bytes'
// import { uploadFileDT } from '@/request/actions/project'

const { Dragger } = Upload
const { TabPane } = Tabs

const UploadResource = ({ handleUploadDone }) => {
  const [resourceFile, setResourceFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProcess, setUploadProcess] = useState(0)
  const [tabValue, setTabValue] = useState('file')

  const onRemove = file => {
    setResourceFile(null)
  }
  const beforeUpload = file => {
    setResourceFile(file)
    return false
  }
  const handleSubmit = async () => {
    if (!resourceFile) {
      message.error('Please choose a file')
      return
    }
    setUploading(true)
    const projectId = localStorage.getItem('currentProject')

    // const res = await uploadFileDT(resourceFile, projectId, event =>
    //   setUploadProcess(event.percent)
    // )
    setUploading(false)
    // if (res.err) message.error(res.data || 'something was wrong')
    // else handleUploadDone(res.data)
  }

  return (
    <div>
      <h3 style={{ textAlign: 'center' }}>上传任何类型的资源</h3>
      <Tabs
        defaultActiveKey="images"
        onChange={key => {
          setTabValue(key)
          setUploadProcess(0)
        }}
      >
        <TabPane tab="资源" key="file" disabled={uploading}>
          <p style={{ opacity: '0.7', fontSize: '17px', width: '800px', margin: 'auto' }}>
          您可以上传任何资源类型，我们不会解码您的资源，您可以随时下载它。如果您的数据集是公开的，其他用户也可以下载它。
            <br />
          </p>
          <div style={{ margin: '20px auto', width: '200px', textAlign: 'left' }}>
            <Dragger
              beforeUpload={beforeUpload}
              maxCount={1}
              accept="*"
              showUploadList={false}
              style={{ margin: '20px auto', width: '200px' }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域</p>
            </Dragger>
          </div>
          {resourceFile && (
            <div className={styles.fileList}>
              <FileOutlined style={{ fontSize: '26px' }} />
              <span style={{ margin: '0 15px' }}>{resourceFile.name}</span>
              {`size: ${bytes(resourceFile.size)}`}
              <DeleteOutlined
                style={{ marginLeft: 'auto', cursor: 'pointer' }}
                onClick={onRemove}
              />
            </div>
          )}
        </TabPane>
        {/* <TabPane tab="resource link" key="link" disabled={uploading}>
          <p style={{ opacity: '0.7', fontSize: '17px', width: '400px', margin: 'auto' }}>
            Your resource link
          </p>
          <div
            style={{
              margin: '20px auto',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              width: '400px',
            }}
          >
            <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Resource URL: </span>
            <Input placeholder="/nfs/zly/medical/test.npz" style={{ width: '260px' }} />
          </div>
        </TabPane> */}
      </Tabs>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {(uploading || uploadProcess > 0) && (
          <Progress percent={uploadProcess} style={{ width: '400px', margin: 'auto' }} />
        )}
        <Button
          style={{ width: '200px', margin: '20px auto' }}
          type="primary"
          disabled={uploading}
          onClick={handleSubmit}
        >
          提交
        </Button>
      </div>
    </div>
  )
}

export default UploadResource
