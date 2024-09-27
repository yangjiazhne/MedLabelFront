/*
 * @Author: Azhou
 * @Date: 2021-08-18 11:17:43
 * @LastEditors: Azhou
 * @LastEditTime: 2022-11-22 15:15:17
 */
import { HIT_STATE_NOT_DONE } from '@/helpers/Utils'
import '@/lib/fabric/fabric'
import store from '@/redux/store'
import { hitShapeTypes } from '@/constants'
import { hexToRgba } from '@/helpers/Utils'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'

// @ts-ignore
const fabric = window.fabric

export const getCurrentResult = currentCanvas => {
  const { project } = store.getState()
  const { boundingBoxMap } = project

  const finalTaggerInfo = currentCanvas.getObjects().map(item => {
    const baseInfo = {
      id: item.id,
      type: item.type,
      shape: item.shape,
      label: item.label,
    }
    if(item.tagInfo) baseInfo.tagInfo = item.tagInfo

    item.setCoords()
    const actualLeft = item.left > 0 ? item.left : 0,
        actualTop = item.top > 0 ? item.top : 0
    switch (item.shape) {
      case hitShapeTypes.POINT:
        baseInfo.left = actualLeft
        baseInfo.top = actualTop
        baseInfo.radius = item.radius
        break
      case hitShapeTypes.ELLIPSE:
        baseInfo.left = actualLeft
        baseInfo.top = actualTop
        baseInfo.rx = item.rx
        baseInfo.ry = item.ry
        break
      case hitShapeTypes.RECT:
        const { br, tl } = item.aCoords
        let width = br.x - tl.x
        let height = br.y - tl.y
        baseInfo.points = [
          [actualLeft, actualTop],
          [actualLeft + width, actualTop],
          [actualLeft + width, actualTop + height],
          [actualLeft, actualTop + height],
        ]
        break
      case hitShapeTypes.POLYGON:
      case hitShapeTypes.POLYGONPATH:
        const polygonMatrix = item.calcTransformMatrix()
        // 获取当前polygon移动的距离
        const polygonMoveX = polygonMatrix[4] - item.pathOffset.x,
            polygonMoveY = polygonMatrix[5] - item.pathOffset.y
        baseInfo.points = item.points
            .map(point => [(point.x + polygonMoveX), (point.y + polygonMoveY)])
            .map(point => [point[0] > 0 ? point[0] : 0, point[1] > 0 ? point[1] : 0])
        break
      case hitShapeTypes.PATH:
        const pathMatrix = item.calcTransformMatrix()
        // 获取当前polygon移动的距离
        const pathMoveX = pathMatrix[4] - item.pathOffset.x,
            pathMoveY = pathMatrix[5] - item.pathOffset.y
        baseInfo.points = item.path.map(point => {
          if (point[0] === 'M' || point[0] === 'L') {
            return [
              point[0],
              Math.max((point[1] + pathMoveX), 0),
              Math.max((point[2] + pathMoveY), 0),
            ]
          }
          if (point[0] === 'Q')
            return [
              'Q',
              Math.max((point[1] + pathMoveX), 0),
              Math.max((point[2] + pathMoveY), 0),
              Math.max((point[3] + pathMoveX), 0),
              Math.max((point[4] + pathMoveY), 0),
            ]
        })
        baseInfo.fill = item.fill
        break
    }
    return baseInfo
  })
  finalTaggerInfo.forEach(tagger => {
    let originTagIndex = -1
    boundingBoxMap.forEach((box, index) => {
      try {
        if (box.id === tagger.id) {
          originTagIndex = index
          throw 'find index'
        }
      } catch (e) { }
    })
    if (originTagIndex !== -1) {
      // 存在此标记，更新它
      boundingBoxMap.splice(originTagIndex, 1, tagger)
    } else {
      // 不存在此标记，插入记录
      boundingBoxMap.push(tagger)
    }
  })
  return boundingBoxMap.filter(box =>  box.label !== null)
}

export const handleKeyDown = (event, currentCanvas, dispatch) => {
  const { project } = store.getState()
  const { newAnnotation } = project

  const tagName = event.target.tagName.toLowerCase()

  if (tagName === 'input' || tagName === 'textarea') {
    return // 直接返回，不阻止输入框的键盘事件
  }

  event.preventDefault()
  const keyName = event.key
  if (event.ctrlKey && keyName === 'z') {
    if(newAnnotation){
      const targetObject = currentCanvas.getObjects().find(obj => obj.id === newAnnotation.id);
      if (targetObject) {
        currentCanvas.discardActiveObject();
        currentCanvas.setActiveObject(targetObject);
        currentCanvas.renderAll();
      } 
      //删除obj
      const modal = Modal.confirm({
        title: '确认',
        icon: <ExclamationCircleOutlined />,
        content: '确定删除该标注吗？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          currentCanvas.remove(targetObject).requestRenderAll()
          dispatch({
            type: 'UPDATE_NEW_ANNOTATION',
            payload: null
          })
          modal.destroy()
        },
      })
    }
  } 
  
  // else {
  //   const obj = currentCanvas.getActiveObject()
  //   if (obj) {
  //     // 删除obj
  //     // if (keyName === 'Backspace') {
  //     //   const modal = Modal.confirm({
  //     //     title: '确认',
  //     //     icon: <ExclamationCircleOutlined />,
  //     //     content: '确定删除该标注吗？',
  //     //     okText: '确认',
  //     //     cancelText: '取消',
  //     //     onOk: () => {
  //     //       currentCanvas.remove(obj).requestRenderAll()
  //     //       modal.destroy()
  //     //     },
  //     //   })
  //     // }
  //     // 移动obj
  //     if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(keyName)) {
  //       const STEP = 2 // 上下左右移动的步长
  //       if (keyName === 'ArrowUp') obj.top -= STEP
  //       if (keyName === 'ArrowDown') obj.top += STEP
  //       if (keyName === 'ArrowLeft') obj.left -= STEP
  //       if (keyName === 'ArrowRight') obj.left += STEP
  //       obj.setCoords()
  //       currentCanvas.fire('object:modified', { target: obj })
  //       currentCanvas.requestRenderAll()
  //     }
  //   }
  // }
}

export const renderModelInfer = (inferRes, currentInferPaths) => {
    const { project } = store.getState()
    const { currentCanvas, entityColorMap } = project
    currentInferPaths.current.forEach(path => currentCanvas.remove(path))
    currentInferPaths.current = []
    if(inferRes.length===0) return
    inferRes?.map((box, index)=>{
      if (!box) {
        return
      }
      box.label = box.label || null
      const color = entityColorMap[box.label] || '#000000'
      const id = box.id

      switch(box.shape){
        case hitShapeTypes.RECT:{
          const left = box.points[0][0] < box.points[2][0] ? box.points[0][0] : box.points[2][0]
          const top = box.points[0][1] < box.points[2][1] ? box.points[0][1] : box.points[2][1]
          const _rect = new fabric.Rect({
            id: id || Date.now(),
            left: left,
            top: top,
            width: Math.abs(box.points[2][0] - box.points[0][0]),
            height: Math.abs(box.points[2][1] - box.points[0][1]),
            fill: false,
            color: color,
            stroke: color,
            strokeWidth: 3,
            opacity: 1,
            erasable: false,
            label: box.label,
            shape: hitShapeTypes.RECT,
            perPixelTargetFind: true,
          })
          _rect.setCoords()
          currentInferPaths.current.push(_rect)
          currentCanvas.add(_rect)
          break
        }

        case hitShapeTypes.ELLIPSE:{
          const _ellipse = new fabric.Ellipse({
            id: id || Date.now(),
            label: box.label,
            left: box.left,
            top: box.top,
            rx: box.rx,
            ry: box.ry,
            color: color,
            fill: false,
            stroke: color,
            strokeWidth: 3,
            opacity: 1,
            erasable: false,
            shape: hitShapeTypes.ELLIPSE,
            perPixelTargetFind: true,
          })
          _ellipse.setCoords()
          currentInferPaths.current.push(_ellipse)
          currentCanvas.add(_ellipse)
          break
        }

        case hitShapeTypes.POLYGONPATH:{
          const points = box.points.map(point => ({
            x: point[0],
            y: point[1],
          }))
          const _polygonPath = new fabric.Polygon(points, {
            id: id || Date.now(),
            label: box.label,
            stroke: color,
            color: color,
            shape: hitShapeTypes.POLYGONPATH,
            strokeWidth: 3,
            fill: false,
            opacity: 1,
            erasable: false,
            objectCaching: false,
            transparentCorners: false,
            perPixelTargetFind: true,
          })
          _polygonPath.setCoords()
          currentInferPaths.current.push(_polygonPath)
          currentCanvas.add(_polygonPath)
          break
        }
      
        case hitShapeTypes.PATH:{
          const _path = new fabric.Path(
            box.points.map(point => {
              if (point[0] === 'M' || point[0] === 'L') {
                return [point[0], point[1], point[2]]
              }
              if (point[0] === 'Q')
                return [
                  'Q',
                  point[1],
                  point[2],
                  point[3],
                  point[4],
                ]
            }),
            {
              id: id || Date.now(),
              fill: box.fill || hexToRgba(color, 0.4),
              strokeWidth: 3,
              stroke: color,
              label: box.label,
              shape: hitShapeTypes.PATH,
              // lockMovementX: true,
              // lockMovementY: true,
              lockRotation: true,
              lockScalingFlip: true,
              lockScalingX: true,
              lockScalingY: true,
              lockSkewingX: true,
              lockSkewingY: true,
              erasable: false,
            })
          _path.setCoords()
          currentInferPaths.current.push(_path)
          currentCanvas.add(_path)
          break
        }
      }
    })
}