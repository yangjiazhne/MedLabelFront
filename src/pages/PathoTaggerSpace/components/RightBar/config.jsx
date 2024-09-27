/*
 * @Author: Azhou
 * @Date: 2021-06-21 15:27:15
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:49:11
 */
import React from 'react'
import { useHistory } from 'react-router-dom'
import { VIcon } from '@/components'
import { hitShapeTypes, imgUploadPre, intePathGenerateWay } from '@/constants'
import {
  ArrowUpOutlined,
  BorderOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import styles from './index.module.scss'
import { Divider, Modal, Space } from 'antd'

export const controls = [
  {
    value: 'default',
    icon: <ArrowUpOutlined style={{ transform: 'rotate(315deg)' }} />,
    title: 'default arrow',
    label: '绘制',
  },
  {
    value: 'drag',
    icon: <VIcon type="icon-Drag-Hand" />,
    title: 'drag canvas',
    label: '拖拽',
  },
]

export const shapes = [
  {
    value: hitShapeTypes.POINT,
    icon: <VIcon type="icon-point" style={{ fontSize: '18px' }} />,
    title: '绘制点',
    label: '点',
  },
  {
    value: hitShapeTypes.RECT,
    icon: <VIcon type="icon-rect" style={{ fontSize: '18px' }} />,
    title: '绘制矩形框',
    label: '矩形',
  },
  {
    value: hitShapeTypes.POLYGON,
    icon: <VIcon type="icon-polygon" style={{ fontSize: '18px' }} />,
    title: '绘制多边形框',
    label: '多边形',
  },
  {
    value: hitShapeTypes.ELLIPSE,
    icon: <VIcon type="icon-ellipse" style={{ fontSize: '18px' }} />,
    title: '绘制椭圆形框',
    label: '椭圆形',
  },
  {
    value: hitShapeTypes.POLYGONPATH,
    icon: <VIcon type="icon-ManagePaths" style={{ fontSize: '18px' }} />,
    title: '绘制自由路径',
    label: '自由路径',
  },
  // {
  //   value: hitShapeTypes.POINT,
  //   icon: <VIcon type="icon-point" />,
  //   title: '绘制点',
  //   label: '点',
  // },
  // {
  //   value: hitShapeTypes.MANUAL,
  //   icon: <VIcon type="icon-ManagePaths" />,
  //   title: 'Click to draw Manual path',
  //   label: '自由路径',
  // },
  // {
  //   value: hitShapeTypes.MANUALCLOSE,
  //   icon: <VIcon type="icon-ManagePaths" />,
  //   title: '绘制自由路径',
  //   label: '自由路径',
  // },
]

export const iconBtns = (clearPolygons, showReDoModal, saveRow, projectHits, space, isDone, setUpdateReady, updateReady) => {
  return [
    {
      icon: <CloseOutlined />,
      title: '清除所有标注',
      width: '',
      color: '#ff4d4f',
      show: space,
      disabled: false,
      onClick: clearPolygons,
    },
    // {
    //   icon: <VIcon type="icon-weibiaoti545" style={{ fontSize: '18px' }} />,
    //   title: '人工重新标注',
    //   color: '#faad14',
    //   width: '',
    //   show: !space,
    //   disabled: false,
    //   onClick: showReDoModal,
    // },
    // {
    //   icon: <SaveOutlined />,
    //   title: 'will save hits and status is notDone',
    //   color: 'teal',
    //   show: space,
    //   disabled: false,
    //   onClick: () => saveRow('savePartialHit'),
    // },
    // {
    //   icon: <CheckOutlined />,
    //   title: '临时保存',
    //   color: 'teal',
    //   width: '',
    //   show: !isDone,
    //   disabled: false,
    //   onClick: () => {
    //     Modal.success({
    //       title: '保存成功',
    //       content: '标注信息已保存，您可以刷新或重新打开页面继续标注',
    //     })
    //     saveRow('saveTempHit')
    //   },
    // },
    {
      icon: <CheckOutlined />,
      title: '保存标注',
      color: '#52c41a',
      width: '',
      show: !isDone || space,
      disabled: false,
      onClick: history => {
        saveRow('saveToDone')
        // Modal.success({
        //   title: '保存成功',
        //   content: '标注信息已保存，您可以刷新或重新打开页面继续标注',
        // })
        // if (isDone && space) {
        //   const modal = Modal.success({
        //     title: 'GT修改成功',
        //     content: '标注信息已保存，您可以刷新或重新打开页面继续标注',
        //   })
        // } else {
        //   let seconds = 3
        //   const modal = Modal.success({
        //     title: 'GT保存成功',
        //     content: `标注已完成，即将在${seconds}秒后跳转回数据集详情页`,
        //   })

          // const intervalId = setInterval(() => {
          //   seconds -= 1
          //   if (seconds <= 0) {
          //     clearInterval(intervalId)
          //     modal.destroy()
          //     const projectId = localStorage.getItem('currentProject')
          //     history.push('/userHome/projects/' + projectId)
          //   } else {
          //     modal.update({
          //       content: `标注已完成，即将在${seconds}秒后跳转回数据集详情页`,
          //     })
          //   }
          // }, 1000)
        // }
        setUpdateReady(updateReady + 1)
      },
    },
    //{
    //  icon: <LeftOutlined />,
    //  title: 'Previous',
    //  color: '#1890ff',
    //  show: true,
    //  disabled: currentIndex <= 0,
    //  onClick: getBackTopreviousRow,
    //},
    //{
    //  icon: <RightOutlined />,
    //  title: 'Next',
    //  color: '#1890ff',
    //  show: true,
    //  disabled: currentIndex >= projectHits.length - 1,
    //  onClick: saveTagAndNextRow,
    //},
  ]
}

export const segAlgos = [
  {
    value: hitShapeTypes.INTEPATH,
    algo: intePathGenerateWay.EISEG,
    title: intePathGenerateWay.EISEG,
    label: intePathGenerateWay.EISEG
  },
  {
    value: hitShapeTypes.INTEPATH,
    algo: intePathGenerateWay.SAMSEG,
    title: intePathGenerateWay.SAMSEG,
    label: intePathGenerateWay.SAMSEG,
  },
]

const traDesList = [
  {
    name: 'GrabCut',
    introduction:
      'GrabCut算法用于将图像中的前景对象从背景中分割出来，通过用户提供的前景(矩形框内的图像)和背景(矩形框外的图像)来自动地完成图像分割过程。',
    use: '框选出前景图像所在的位置进行分割',
  },
  {
    name: 'Canny',
    introduction:
      'Canny算法用于在图像中检测边缘，根据用户提供的阈值来确定图像中的边缘，高、低阈值将像素分为强边缘像素、弱边缘像素和非边缘像素三类进行处理。',
    use: '设置低阈值和高阈值之后框选想要分割的位置进行分割',
  },
  {
    name: 'RegionGrow',
    introduction:
      'RegionGrow算法是一种基于种子点的图像分割算法，用于将图像中的像素分组成具有相似特征的区域，适用于检测具有连续性特征的图像区域',
    use: '框选想要分割的位置进行分割',
  },
  {
    name: 'Threshold',
    introduction:
      '阈值分割算法是一种根据像素的灰度值将图像分成不同的区域的图像分割方法，通过设定阈值和高于阈值后设置像素的最大值来将图像中的像素分为前景和背景，从而实现图像分割，适用于具有明显灰度差异的图像。',
    use: '设置阈值和高于阈值后像素设置的最大值后框选想要分割的位置进行分割',
  },
  {
    name: 'WaterShed',
    introduction:
      'WaterShed是一种基于形态学的图像分割算法，用于将图像中的区域分割成具有边界的不同区域，适用于具有明显边界的图像分割任务。',
    use: '框选想要分割的位置进行分割',
  },
  {
    name: 'RegionSplitMerge',
    introduction:
      'RegionSplitMerge是一种基于递归分割和合并的图像分割算法，用于将图像中的像素分成具有相似特征的区域，适用于对图像进行细粒度的分割。',
    use: '框选想要分割的位置进行分割',
  },
]

const inteDesList = [
  {
    name: 'EISeg',
    introduction:
      'EISeg 是一种用于图像分割的交互式深度学习模型,在 EISeg 中，positive 点用于标记目标物体所在区域，negative 点用于标记非目标物体区域，通过设置 positive 和 negative 点，用户可以交互地指导模型进行图像分割',
    use: '选择positive点击图像中目标物体所在区域，点击一次会设置一个positive点并返回分割结果，可多次点击；选择negative点击图像中非目标物体所在区域，点击一次会设置一个negative点并返回结果，可多次点击。当结束标记时，点击结束交互按钮获取最终路径',
  },
  {
    name: 'SamSeg',
    introduction:
      'SamSeg 是一种用于图像分割的交互式深度学习模型,在 SamSeg 中，positive 点用于标记目标物体所在区域，negative 点用于标记非目标物体区域，通过设置 positive 和 negative 点，用户可以交互地指导模型进行图像分割',
    use: '选择positive点击图像中目标物体所在区域，点击一次会设置一个positive点并返回分割结果，可多次点击；选择negative点击图像中非目标物体所在区域，点击一次会设置一个negative点并返回结果，可多次点击。当结束标记时，点击结束交互按钮获取最终路径',
  },
]

export const desTra = () => {
  return (
    <div style={{ overflow: 'auto' }}>
      {traDesList.map(item => (
        <div className={styles.noticeList}>
          <p className={styles.noticeTitle}>{item.name}</p>
          <div>
            <p className={styles.noticeSubTitle}>算法介绍</p>
            <p className={styles.notice}>{item.introduction}</p>
            <p className={styles.noticeSubTitle}>使用说明</p>
            <p className={styles.notice}>{item.use}</p>
          </div>
          <Divider
            style={{
              marginTop: '10px',
              marginBottom: '5px',
              borderTop: '2px solid rgba(0,0,0,.1)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

export const desInte = () => {
  return (
    <div style={{ overflow: 'auto' }}>
      {inteDesList.map(item => (
        <div className={styles.noticeList}>
          <p className={styles.noticeTitle}>{item.name}</p>
          <div>
            <p className={styles.noticeSubTitle}>算法介绍</p>
            <p className={styles.notice}>{item.introduction}</p>
            <p className={styles.noticeSubTitle}>使用说明</p>
            <p className={styles.notice}>{item.use}</p>
          </div>
          <Divider
            style={{
              marginTop: '10px',
              marginBottom: '5px',
              borderTop: '2px solid rgba(0,0,0,.1)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

export const desInfer = modelList => {
  return (
    <div style={{ overflow: 'auto' }}>
      {modelList.map(item => (
        <div className={styles.noticeList}>
          <p className={styles.noticeTitle}>{item.modelName}</p>
          <div>
            <p className={styles.noticeSubTitle}>算法介绍</p>
            <p className={styles.notice}>{item.introduction}</p>
            <p className={styles.noticeSubTitle}>使用说明</p>
            <p className={styles.notice}>下拉框选择推理模型类型，点击开始推理获取推理结果</p>
            <p className={styles.noticeSubTitle}>推理结果示例图片</p>
            <Space size={20} style={{ marginTop: '5px' }}>
              {item.path.map(path => (
                <img style={{ height: '200px', width: 'auto' }} src={`${imgUploadPre}${path}`} />
              ))}
            </Space>
          </div>
          <Divider
            style={{
              marginTop: '10px',
              marginBottom: '5px',
              borderTop: '2px solid rgba(0,0,0,.1)',
            }}
          />
        </div>
      ))}
    </div>
  )
}
