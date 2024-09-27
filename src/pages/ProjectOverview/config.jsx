/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:28:14
 */
import React from 'react'
import { timeConverter, timeConverter2 } from '@/helpers/Utils'
import { Tag } from 'antd'

// 此处不再显示
export const renderProjectDetail = (projectDetails, entityColorMap) => {
  if (!projectDetails || !projectDetails.taskRules) return []
  const taskRules = JSON.parse(projectDetails.taskRules)
  const { tags, instructions } = taskRules
  let taskType = '其他任务'
  let datasetType = '普通图片'
  if (projectDetails.task_type === 'IMAGE_DETECTION_IMAGE_SEGMENTATION') {
    taskType = 'detection and segmentation task'
  } else if (projectDetails.task_type === 'IMAGE_CLASSIFICATION') {
    taskType = 'classification task'
  }
  if (projectDetails.imageType === 'normal') {
    datasetType = 'normal'
  } else if (projectDetails.imageType === 'dicom') {
    datasetType = 'dicom'
  } else if (projectDetails.imageType === 'mrxs') {
    datasetType = 'mrxs'
  }
  let result = [
    {
      label: 'visible type',
      value: projectDetails.public ? 'public' : 'private',
      span: 2,
    },
    {
      label: 'createTime',
      value: timeConverter2(projectDetails.created_timestamp / 1000),
      span: 1,
    },
    { label: 'dataset name', value: projectDetails.name, span: 2 },
    {
      label: 'done / total',
      value: `${projectDetails.totalHitsDone} / ${projectDetails.totalHits}`,
      span: 1,
    },
    {
      label: 'task type',
      value: taskType,
      span: 2,
    },
    {
      label: 'dataset type',
      value: datasetType,
      span: 1,
    },
    {
      label: 'entitiesNumber',
      value: tags.split(',').map(tag => (
        <Tag key={tag} style={{ marginRight: '5px', marginBottom: '5px' }} color={entityColorMap[tag]}>
          {tag}
        </Tag>
      )),
      span: 3,
    },
    { label: 'introduction', value: instructions, span: 3 },
  ]

  if (projectDetails.status === 'INVALID')
    result.push({ label: '无效原因', value: projectDetails.memo || '-', span: 3 })
  if (projectDetails.medicalImageFormat)
    result.push({
      label: '医学图片类型',
      value: `${projectDetails.medicalImageFormat} ${projectDetails.imageOrganType}`,
      span: 3,
    })
  return result
}
