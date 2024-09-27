import { VButton } from '@/components'
import { useHistory } from 'react-router-dom'
import React from 'react'
import styles from './index.module.scss'
import bytes from 'bytes'

// {
//   successNum: successNum,
//   failNum: failNum,
//   existNum: existTasks.length,
// }
const UploadDone = ({ UploadStats }) => {
  // @ts-ignore
  let history = useHistory()
  return (
    <div style={{ textAlign: 'center' }}>
      <h2>推理任务创建完成</h2>
      <div className={styles.stats}>
        <div className={styles.statsItem}>
          <span style={{ color: 'green' }}>{UploadStats.successNum}</span>个任务创建成功
        </div>
        <div className={styles.statsItem}>
          <span style={{ color: 'red' }}>{UploadStats.failNum}</span>个任务创建失败
        </div>
        <div className={styles.statsItem}>
          <span style={{ color: 'gray' }}>{UploadStats.existNum}</span>个任务已经存在
        </div>
      </div>
      <div className={styles.buttonWrap}>
        <VButton color="teal" onClick={() => location.reload()}>
          返回模型推理中心
        </VButton>
        <VButton
          color="teal"
          style={{ marginLeft: '20px' }}
          onClick={() => history.push(`/userHome/task-list`)}
        >
          查看任务进度
        </VButton>
      </div>
    </div>
  )
}

export default UploadDone
