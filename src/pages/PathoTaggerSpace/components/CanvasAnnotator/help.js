/*
 * @Author: Azhou
 * @Date: 2021-06-09 14:12:20
 * @LastEditors: Azhou
 * @LastEditTime: 2022-11-22 11:20:52
 */
import { hitShapeTypes } from '@/constants'
import { hexToRgba } from '@/helpers/Utils'
import '@/lib/fabric/fabric'
import store from '@/redux/store'
import {
  actionHandler,
  anchorWrapper,
  drawPoint,
  drawPolygon,
  drawPolygonPath,
  drawRectangle,
  drawEllipse,
  polygonPositionHandler,
} from './utils'

// @ts-ignore
const fabric = window.fabric

// 渲染已有的标注信息
export const renderBoxMap = (boundingBox) => {
  const { project } = store.getState()
  const { currentCanvas, entityColorMap, strokeWidth, circleRadius } = project

  if (boundingBox.length === 0 || !currentCanvas) return
  let fBoxes = []
  const scaleFactor = 1
  if (Object.keys(boundingBox).length != 0)
    fBoxes = boundingBox
      ?.map((box, index) => {
        box.label = box.label || null
        const color = entityColorMap[box.label] || '#000000'

        const id = box.id
        switch (box.shape) {
          case hitShapeTypes.POINT:
            return drawPoint({
              id,
              color,
              circleRadius: circleRadius,
              position: { x: box.left, y: box.top },
              label: box.label,
              tagInfo: box.tagInfo,
            })
          case hitShapeTypes.ELLIPSE:
            return drawEllipse({
              left: box.left,
              top: box.top,
              rx: box.rx,
              ry: box.ry,
              label: box.label,
              tagInfo: box.tagInfo,
              strokeWidth: strokeWidth,
              color,
              id, 
            })
          case hitShapeTypes.RECT:
            return drawRectangle({
              id,
              beginPoint: { x: box.points[0][0] / scaleFactor, y: box.points[0][1] / scaleFactor },
              endPoint: { x: box.points[2][0] / scaleFactor, y: box.points[2][1] / scaleFactor },
              color,
              label: box.label,
              tagInfo: box.tagInfo,
              strokeWidth: strokeWidth,
            })
          case hitShapeTypes.POLYGONPATH:
            return drawPolygonPath({
              id,
              points: box.points.map(point => ({
                x: point[0] / scaleFactor,
                y: point[1] / scaleFactor,
              })),
              color,
              label: box.label,
              tagInfo: box.tagInfo,
              strokeWidth: strokeWidth,
            })
          case hitShapeTypes.POLYGON:
            return drawPolygon({
              id,
              points: box.points.map(point => ({
                x: point[0] / scaleFactor,
                y: point[1] / scaleFactor,
              })),
              color,
              label: box.label,
              tagInfo: box.tagInfo,
              strokeWidth: strokeWidth,
            })
        }
      })
      .filter(Boolean)
  // console.log('fBoxes: ', fBoxes)
  let _actualBoxMap = [...fBoxes]
  // 当前为 patch 图像
  // if (sliceWidth > 0) {
  //   // 过滤出不在当前背景图内的标注信息
  //   _actualBoxMap = fBoxes.filter(box =>
  //     imgContainBox({ sliceX, sliceY, sliceWidth, sliceHeight }, box)
  //   )
  // }
  fabric.util.enlivenObjects(_actualBoxMap, function (objects) {
    var origRenderOnAddRemove = currentCanvas.renderOnAddRemove
    currentCanvas.renderOnAddRemove = false

    objects.forEach(function (o) {
      // console.log(o)
      // 数据库中的object坐标统一都是相对于左上角(0,0)开始的，这渲染时要加上图片的偏移量
      // o.left -= sliceX
      // o.top -= sliceY
      // o.setCoords()
      if (o.shape == hitShapeTypes.POLYGON) {
        o.set({
          controls: o.points.reduce(function (acc, point, index) {
            acc['p' + index] = new fabric.Control({
              positionHandler: polygonPositionHandler,
              actionHandler: anchorWrapper(
                index > 0 ? index - 1 : o.points.length - 1,
                actionHandler
              ),
              actionName: 'modifyPolygon',
              pointIndex: index,
            })
            return acc
          }, {}),
        })
      }
      currentCanvas.add(o)
    })

    currentCanvas.fire('selection:cleared', {}) // 清除第一次绘制controls时,触发事件绘制的右侧编辑框
    currentCanvas.renderAll()
    currentCanvas.renderOnAddRemove = origRenderOnAddRemove
  })
}

// 合并path
export const handleMultiPath = (groups, canvas, needMerge) => {
  let _points = [] // 记录某一线段的所有点坐标
  let pathGroup = [] // 记录所有分段路径
  let finalPathPoints // 最后用来生成总路径的点坐标数组

  // 当前canvas的变换矩阵
  const canvasMatrix = canvas.viewportTransform

  // 处理路径数组，将被擦除的点去除掉，形成新的分段路径数组
  groups.forEach(pathObj => {
    const matrix = pathObj.calcTransformMatrix()
    // 获取当前path移动的距离
    const moveX = matrix[4] - pathObj.pathOffset.x,
      moveY = matrix[5] - pathObj.pathOffset.y
    pathObj.path.forEach(point => {
      let isPointErase = false // 记录当前点是否被擦除
      if (point[0] === 'M' || point[0] === 'L') {
        const [_, x, y] = point
        // 由变换矩阵获取point相对于canvas左上角实际的位置
        const { x: testX, y: testY } = fabric.util.transformPoint({ x, y }, canvasMatrix)
        isPointErase = canvas.isTargetTransparent(pathObj, testX + moveX, testY + moveY)
        // 最终的点坐标需要加上自身移动的偏移量，相对于原图左上角的坐标
        point = [_, x + moveX, y + moveY]
      }
      if (point[0] === 'Q') {
        const [_, x1, y1, x2, y2] = point
        const { x: testX1, y: testY1 } = fabric.util.transformPoint({ x: x1, y: y1 }, canvasMatrix)
        const { x: testX2, y: testY2 } = fabric.util.transformPoint({ x: x2, y: y2 }, canvasMatrix)
        // console.log(typeof testX1, testX1)
        // console.log(typeof moveX, moveX)
        // console.log(typeof testY1, testY1)
        // console.log(typeof moveY, moveY)
        const isPointErase_1 = canvas.isTargetTransparent(pathObj, testX1 + moveX, testY1 + moveY)
        const isPointErase_2 = canvas.isTargetTransparent(pathObj, testX2 + moveX, testY2 + moveY)
        isPointErase = isPointErase_1 || isPointErase_2
        point = [_, x1 + moveX, y1 + moveY, x2 + moveX, y2 + moveY]
      }

      if (isPointErase) {
        if (_points.length) {
          // push一条新的路径
          pathGroup.push(_points)
          _points = []
        }
      } else {
        // 将未被擦除的点推入点数组
        _points.push(point)
      }
    })
    if (_points.length) {
      pathGroup.push(_points)
      _points = []
    }
  })

  // 被完全擦除，不需要合并
  if (!pathGroup.length) return null

  finalPathPoints = pathGroup.splice(0, 1)[0]

  while (pathGroup.length) {
    // 取母路径两个端点
    const endPoint_1 = finalPathPoints[0]
    const endPoint_2 = finalPathPoints[finalPathPoints.length - 1]
    // 记录两最近端点的相关信息
    let minDistanceInfo = { pathIndex: -1, pointIndex: -1, distance: Number.MAX_VALUE }
    let closePointIndex = null
    // 找出与母路径最近的路径及其端点
    pathGroup.forEach((path, index) => {
      const currentEndPoint_1 = path[0]
      const currentEndPoint_2 = path[path.length - 1]
      if (getPointDistance(currentEndPoint_1, endPoint_1) < minDistanceInfo.distance) {
        minDistanceInfo = {
          pathIndex: index,
          pointIndex: 0,
          distance: getPointDistance(currentEndPoint_1, endPoint_1),
        }
        closePointIndex = 0
      }
      if (getPointDistance(currentEndPoint_2, endPoint_1) < minDistanceInfo.distance) {
        minDistanceInfo = {
          pathIndex: index,
          pointIndex: path.length - 1,
          distance: getPointDistance(currentEndPoint_2, endPoint_1),
        }
        closePointIndex = 0
      }
      if (getPointDistance(currentEndPoint_1, endPoint_2) < minDistanceInfo.distance) {
        minDistanceInfo = {
          pathIndex: index,
          pointIndex: 0,
          distance: getPointDistance(currentEndPoint_1, endPoint_2),
        }
        closePointIndex = finalPathPoints.length - 1
      }
      if (getPointDistance(currentEndPoint_2, endPoint_2) < minDistanceInfo.distance) {
        minDistanceInfo = {
          pathIndex: index,
          pointIndex: path.length - 1,
          distance: getPointDistance(currentEndPoint_2, endPoint_2),
        }
        closePointIndex = finalPathPoints.length - 1
      }
    })

    // 头插
    if (closePointIndex === 0) {
      // 两头相近
      if (minDistanceInfo.pointIndex === 0) {
        pathGroup[minDistanceInfo.pathIndex].reverse()
        finalPathPoints = [...pathGroup[minDistanceInfo.pathIndex], ...finalPathPoints]
      } else {
        // 头尾相近
        finalPathPoints = [...pathGroup[minDistanceInfo.pathIndex], ...finalPathPoints]
      }
      // 尾插
    } else {
      // 尾头相近
      if (minDistanceInfo.pointIndex === 0) {
        finalPathPoints = [...finalPathPoints, ...pathGroup[minDistanceInfo.pathIndex]]
      } else {
        // 尾尾相近
        pathGroup[minDistanceInfo.pathIndex].reverse()
        finalPathPoints = [...finalPathPoints, ...pathGroup[minDistanceInfo.pathIndex]]
      }
    }
    pathGroup.splice(minDistanceInfo.pathIndex, 1)
  }

  const threshold = 3

  for (let i = 0; i < finalPathPoints.length; i++) {
    if (finalPathPoints[i][0] === 'M' || finalPathPoints[i][0] === 'L') {
      finalPathPoints[i] = [
        'Q',
        finalPathPoints[i][1],
        finalPathPoints[i][2],
        finalPathPoints[i][1] + 0.01,
        finalPathPoints[i][2] + 0.01,
      ]
    }
    if (i > 1) {
      const distance = Math.sqrt(
        Math.pow(finalPathPoints[i][1] - finalPathPoints[i - 1][3], 2) +
          Math.pow(finalPathPoints[i][2] - finalPathPoints[i - 1][4], 2)
      )
      if (distance > threshold) {
        const newControlPoint = [
          (finalPathPoints[i][1] + finalPathPoints[i - 1][3]) / 2,
          (finalPathPoints[i][2] + finalPathPoints[i - 1][4]) / 2,
        ]
        finalPathPoints[i][1] = newControlPoint[0]
        finalPathPoints[i][2] = newControlPoint[1]
      }
    }
  }

  if (finalPathPoints[0][0] !== 'M') {
    finalPathPoints.unshift(['M', finalPathPoints[0][3], finalPathPoints[0][4]])
  }
  if (finalPathPoints[finalPathPoints.length - 1][0] !== 'L') {
    finalPathPoints.push([
      'L',
      finalPathPoints[finalPathPoints.length - 1][3],
      finalPathPoints[finalPathPoints.length - 1][4],
    ])
  }

  const mergedPath = new fabric.Path(finalPathPoints, {
    id: Date.now(),
    strokeWidth: groups[0].strokeWidth,
    stroke: groups[0].stroke,
    fill: needMerge ? hexToRgba(groups[0].stroke, 0.4) : 'transparent',
    shape: hitShapeTypes.PATH,
    lockRotation: true,
    lockScalingFlip: true,
    lockScalingX: true,
    lockScalingY: true,
    lockSkewingX: true,
    lockSkewingY: true,
    erasable: false,
  })

  mergedPath.setCoords()

  return mergedPath
}
// 辅助函数：获取两点之间的直线距离
const getPointDistance = (point_1, point_2) => {
  const [_1, x1, y1] = point_1
  const [_2, x2, y2] = point_2
  const a = x1 - x2,
    b = y1 - y2
  return Math.sqrt(a * a + b * b)
}

// 判断box矩形是否在img矩形内
const imgContainBox = (imgInfo, box) => {
  const { sliceX, sliceY, sliceWidth, sliceHeight } = imgInfo
  const { left, top, width, height } = box

  const bgImgMinX = sliceX,
    bgImgMinY = sliceY,
    bgImgMaxX = sliceX + sliceWidth,
    bgImgMaxY = sliceY + sliceHeight,
    boxMinX = Math.min(left, left + width),
    boxMinY = Math.min(top, top + height),
    boxMaxX = Math.max(left, left + width),
    boxMaxY = Math.max(top, top + height)

  return (
    boxMinX >= bgImgMinX && boxMinY >= bgImgMinY && boxMaxX <= bgImgMaxX && boxMaxY <= bgImgMaxY
  )
}
