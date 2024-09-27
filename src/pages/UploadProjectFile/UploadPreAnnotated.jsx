import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import React, { useMemo, useState } from 'react'
import { imagePolyBoundingSample } from './config'
import { Upload, Button, message, Progress } from 'antd'
import styles from './index.module.scss'
import { VIcon } from '@/components'
import bytes from 'bytes'
// import { uploadFileDT } from '@/request/actions/project'

const { Dragger } = Upload

const UploadPreAnnotated = ({ handleUploadDone }) => {
  const [jsonFile, setJsonFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProcess, setUploadProcess] = useState(0)

  const sizeError = useMemo(() => jsonFile && jsonFile.size / 1024 / 1024 > 10, [jsonFile])

  const onRemove = file => {
    setJsonFile(null)
  }
  const beforeUpload = file => {
    setJsonFile(file)
    return false
  }
  const handleSubmit = async () => {
    if (!jsonFile) {
      message.error('Please choose a file')
      return
    }
    setUploading(true)
    const projectId = localStorage.getItem('currentProject')

    // const res = await uploadFileDT(
    //   jsonFile,
    //   projectId,
    //   event => setUploadProcess(event.percent),
    //   'PRE_TAGGED_JSON'
    // )
    setUploading(false)
    // if (res.err) message.error(res.data || 'something was wrong')
    // else handleUploadDone(res.data)
  }

  return (
    <div>
      <h3 style={{ textAlign: 'center' }}>Select file with Pre-Annotated data</h3>
      <ul>
        <li>
          Please upload a text file with each line in file having input sentence in following json
          format.
        </li>
        <li>Format is similar to the annotated and downloaded json file from dataturks.</li>
        <li>Max size 10MB</li>
      </ul>
      <code style={{ width: '500px' }}>{JSON.stringify(imagePolyBoundingSample)}</code>
      <Dragger
        beforeUpload={beforeUpload}
        maxCount={1}
        accept=".json"
        showUploadList={false}
        style={{ margin: '20px auto', width: '200px' }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
      </Dragger>
      {jsonFile && (
        <div className={styles.fileList} style={{ borderColor: sizeError ? 'red' : '' }}>
          <VIcon type="icon-json" style={{ fontSize: '26px' }} />
          <span style={{ margin: '0 15px' }}>{jsonFile.name}</span>
          {`size: ${bytes(jsonFile.size)}`}
          <DeleteOutlined style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={onRemove} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {(uploading || uploadProcess > 0) && (
          <Progress percent={uploadProcess} style={{ width: '400px', margin: 'auto' }} />
        )}
        <Button
          style={{ width: '200px', margin: '20px auto' }}
          type="primary"
          disabled={uploading}
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </div>
  )
}

export default UploadPreAnnotated
