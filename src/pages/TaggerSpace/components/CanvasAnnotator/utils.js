/*
 * @Author: Azhou
 * @Date: 2021-09-17 18:23:48
 * @LastEditors: Azhou
 * @LastEditTime: 2021-09-18 21:00:18
 */
import { hitShapeTypes } from '@/constants'
import '@/lib/fabric/fabric'
import { hexToRgba } from '@/helpers/Utils'

// @ts-ignore
const fabric = window.fabric

export const addPolygonPoint = (
  point,
  canvas,
  polygonPoints,
  drawingObject,
  fillColor,
  tempActiveLine,
  tempLineArr,
  circleRadius = 1
) => {
  const MIN = 99
  const MAX = 999999
  const random = Math.floor(Math.random() * (MAX - MIN + 1)) + MIN
  const id = new Date().getTime() + random
  const circle = new fabric.Circle({
    radius: 3 * circleRadius,
    fill: '#ffffff',
    stroke: '#333333',
    strokeWidth: 0.5,
    left: point.x,
    top: point.y,
    selectable: false,
    hasBorders: false,
    hasControls: false,
    originX: 'center',
    originY: 'center',
    id: id,
  })
  if (polygonPoints.current.length == 0) {
    circle.set({
      fill: 'red',
    })
  }
  let _points = [point.x, point.y, point.x, point.y]
  const line = new fabric.Line(_points, {
    strokeWidth: 2,
    fill: '#999999',
    stroke: '#1ae04e',
    class: 'line',
    originX: 'center',
    originY: 'center',
    selectable: false,
    hasBorders: false,
    hasControls: false,
    evented: false,
  })
  if (drawingObject.current) {
    let points = drawingObject.current.get('points')
    points.push(point)
    const polygon = new fabric.Polygon(points, {
      stroke: fillColor,
      strokeWidth: 3,
      fill: false,
      // opacity: 0.4,
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      strokeDashArray: circleRadius === 0 ? false :[20, 10, 10, 10], // 设置虚线样式
    })
    canvas.remove(drawingObject.current)
    canvas.add(polygon)
    drawingObject.current = polygon
    canvas.renderAll()
  } else {
    const polygon = new fabric.Polygon([point], {
      stroke: fillColor,
      strokeWidth: 1,
      fill: false,
      // opacity: 0.4,
      selectable: false,
      hasBorders: false,
      hasControls: false,
      evented: false,
      strokeDashArray: circleRadius === 0 ? false :[20, 10, 10, 10], // 设置虚线样式
    })
    drawingObject.current = polygon
    canvas.add(polygon)
  }
  tempActiveLine.current = line

  polygonPoints.current.push(circle)
  tempLineArr.current.push(line)

  canvas.add(line)
  canvas.add(circle)
  canvas.selection = false
}

// define a function that can locate the controls.
// this function will be used both for drawing and for interaction.  该函数在controls定义时和移动时都会被调用
export function polygonPositionHandler(dim, finalMatrix, fabricObject) {
  var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
    y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y

  fabricObject.canvas.fire('custom:modifyPolygon', { target: fabricObject })
  return fabric.util.transformPoint(
    { x: x, y: y },
    fabric.util.multiplyTransformMatrices(
      fabricObject.canvas.viewportTransform,
      fabricObject.calcTransformMatrix()
    )
  )
}

// define a function that will define what the control does
// this function will be called on every mouse move after a control has been
// clicked and is being dragged.
// The function receive as argument the mouse event, the current trasnform object
// and the current position in canvas coordinate
// transform.target is a reference to the current object being transformed,
export function actionHandler(eventData, transform, x, y) {
  var polygon = transform.target,
    currentControl = polygon.controls[polygon.__corner],
    mouseLocalPosition = polygon.toLocalPoint(new fabric.Point(x, y), 'center', 'center'),
    polygonBaseSize = polygon._getNonTransformedDimensions(),
    size = polygon._getTransformedDimensions(0, 0),
    finalPointPosition = {
      x: (mouseLocalPosition.x * polygonBaseSize.x) / size.x + polygon.pathOffset.x,
      y: (mouseLocalPosition.y * polygonBaseSize.y) / size.y + polygon.pathOffset.y,
    }
  polygon.points[currentControl.pointIndex] = finalPointPosition
  return true
}

// define a function that can keep the polygon in the same position when we change its
// width/height/top/left.
export function anchorWrapper(anchorIndex, fn) {
  return function (eventData, transform, x, y) {
    var fabricObject = transform.target,
      absolutePoint = fabric.util.transformPoint(
        {
          x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
          y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
        },
        fabricObject.calcTransformMatrix()
      ),
      actionPerformed = fn(eventData, transform, x, y),
      newDim = fabricObject._setPositionDimensions({}),
      polygonBaseSize = fabricObject._getNonTransformedDimensions(),
      newX = (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) / polygonBaseSize.x,
      newY = (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) / polygonBaseSize.y
    fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5)
    return actionPerformed
  }
}

// 自由绘制时的鼠标样式
export const getDrawCursor = brushSize => {
  // const circle = `
  //   <svg
  //     height="${brushSize}"
  //     fill="rgba(0,0,0,0.4)"
  //     viewBox="0 0 ${brushSize * 2} ${brushSize * 2}"
  //     width="${brushSize}"
  //     xmlns="http://www.w3.org/2000/svg"
  //   >
  //     <circle
  //       cx="50%"
  //       cy="50%"
  //       r="${brushSize}"
  //     />
  //   </svg>
  // `
  const circle = `
    <svg
      height="${brushSize * 2}"
      fill="rgba(0,0,0,0.6)"
      viewBox="0 0 ${brushSize * 4} ${brushSize * 4}"
      width="${brushSize * 2}"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0.6" />
          <stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
        </radialGradient>
      </defs>
      <circle
				cx="50%"
				cy="50%"
				r="${brushSize * 1.5}"
        fill="url(#grad)"
        stroke="rgba(255,255,255,1)"
        stroke-width="4"
			/>
    </svg>
	`

  return `data:image/svg+xml;base64,${window.btoa(circle)}`
}

// 绘制点
export const drawPoint = options => {
  const { position, color, label, radius = 3, id, tagInfo } = options

  return new fabric.Circle({
    id: id || Date.now(),
    label,
    shape: hitShapeTypes.POINT,
    left: position.x,
    top: position.y,
    stroke: color,
    fill: color,
    color: color,
    radius,
    scaleY: 1,
    scaleX: 1,
    strokeWidth: 1,
    erasable: false,
    tagInfo
  })
}

// 绘制椭圆形
export const drawEllipse = options => {
  const { top, left, rx, ry, color, label, isfinish = true, id, tagInfo } = options

  const ellipse = new fabric.Ellipse({
    id: id || Date.now(),
    label,
    left: left,
    top: top,
    rx: rx,
    ry: ry,
    color: color,
    fill: false,
    stroke: color,
    strokeWidth: 3,
    opacity: 1,
    erasable: false,
    shape: hitShapeTypes.ELLIPSE,
    perPixelTargetFind: true,
    tagInfo
  })

  if(!isfinish) ellipse.set('strokeDashArray', [20, 10, 10, 10])

  return ellipse
}

// 绘制多边形路径
export const drawPolygonPath = options => {
  const { points, color, label, id, tagInfo } = options

  const _polygon = new fabric.Polygon(points, {
    id: id || Date.now(),
    label,
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
    tagInfo
  })

  return _polygon
}

// 绘制多边形
export const drawPolygon = options => {
  const { points, color, label, id, tagInfo } = options

  const _polygon = new fabric.Polygon(points, {
    id: id || Date.now(),
    stroke: color,
    color: color,
    shape: hitShapeTypes.POLYGON,
    strokeWidth: 3,
    fill: false,
    erasable: false,
    objectCaching: false,
    transparentCorners: false,
    label,
    tagInfo
  })

  return _polygon
}

//绘制矩形
export const drawRectangle = options => {
  const { beginPoint, endPoint, color, label, isfinish = true, id, tagInfo } = options

  let left = beginPoint.x < endPoint.x ? beginPoint.x : endPoint.x
  let top = beginPoint.y < endPoint.y ? beginPoint.y : endPoint.y

  const rect = new fabric.Rect({
    id: id || Date.now(),
    left: left,
    top: top,
    width: Math.abs(endPoint.x - beginPoint.x),
    height: Math.abs(endPoint.y - beginPoint.y),
    fill: false,
    color: color,
    stroke: color,
    strokeWidth: 3,
    strokeUniform: true,
    erasable: false,
    label: label,
    shape: hitShapeTypes.RECT,
    perPixelTargetFind: true,
    tagInfo
  })

  if(!isfinish) rect.set('strokeDashArray', [20, 10, 10, 10])

  return rect
}