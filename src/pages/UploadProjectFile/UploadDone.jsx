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
    <div style={{ textAlign: 'center', padding: '30px 120px', flex: 1, minHeight:'88vh', width: '100%' }}>
      <h2> Project update successful</h2>
      <div className={styles.stats}>
        <div className={styles.statsItem}>
          <span style={{ color: 'green' }}>{fileUploadStats.numHitsCreated}</span>Number of HITs
          created
        </div>
        <div className={styles.statsItem}>
          <span style={{ color: 'green' }}>{fileUploadStats.numHitsIgnored}</span>Number of HITs
          Ignored
        </div>
        <div className={styles.statsItem}>
          <span style={{ color: 'blue' }}>{bytes(fileUploadStats.totalUploadSizeInBytes)}</span>File
          Size
        </div>
      </div>
      <VButton color="teal" onClick={() => history.push(`/userHome/projects/${projectId}`)}>
        返回数据集页面
      </VButton>
    </div>
  )
}

export default UploadDone
