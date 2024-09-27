import { VButton } from '@/components'
import { useHistory, useParams } from 'react-router-dom'
import React from 'react'
import styles from './index.module.scss'
import bytes from 'bytes'

const UploadDone = ({ fileUploadStats }) => {
  // @ts-ignore
  let { projectId } = useParams()
  let history = useHistory()
  return (
    <div style={{  margin: 'auto', width: '600px', textAlign: 'center', padding: '40px 0' }}>
      <h2>数据集生成任务创建成功</h2>
      <div className={styles.stats}>
        <div className={styles.statsItem}>
          <span style={{ color: 'green' }}>{fileUploadStats.numHitsCreated}</span>个项目创建成功
        </div>
        <div className={styles.statsItem}>
          <span style={{ color: 'green' }}>{fileUploadStats.numHitsIgnored}</span>个项目创建失败
        </div>
      </div>
      <div className={styles.buttonWrap}>
        <VButton color="teal" onClick={() => history.push(`/userHome/my-projects`)}>
          返回数据集页面
        </VButton>
        {fileUploadStats.taskId && (
          <VButton
            color="teal"
            style={{ marginLeft: '20px' }}
            onClick={() => history.push(`/userHome/task-list/${fileUploadStats.taskId}`)}
          >
            查看创建进度
          </VButton>
        )}
      </div>
    </div>
  )
}

export default UploadDone
