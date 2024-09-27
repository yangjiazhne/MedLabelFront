import { Button, Progress, Tag } from 'antd'
import React, { useMemo } from 'react'
import styles from './index.module.scss'
import { Link } from 'react-router-dom'

// 已废弃
const SingleProject = ({ projectDetails }) => {
  const tagLens = useMemo(() => {
    const rules = JSON.parse(projectDetails.taskRules)
    return rules.tags.split(',').length
  }, [projectDetails])

  const taskPercent = useMemo(() => {
    if (projectDetails.totalHits === 0) return 0
    return Number(((projectDetails.totalHitsDone / projectDetails.totalHits) * 100).toFixed(2))
  }, [projectDetails])

  return (
    <div className={styles.projectWrap}>
      <div className={styles.title}>{projectDetails.name}</div>
      <Progress
        percent={taskPercent}
        format={percent => `${projectDetails.totalHitsDone} / ${projectDetails.totalHits}`}
        style={{ width: '80%', margin: '10px 0' }}
      />
      <div className={styles.desc}>
        <Tag color="cyan">{projectDetails.totalHits} hits</Tag>
        <Tag color="geekblue">{tagLens} entities</Tag>
      </div>
      <div className={styles.btnWrap}>
        <Button type="primary">
          <Link
            to={{
              pathname: '/userHome/projects/' + projectDetails.id,
            }}
          >
            Overview
          </Link>
        </Button>
      </div>
    </div>
  )
}

export default SingleProject
