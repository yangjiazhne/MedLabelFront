import store from '@/redux/store'
import '@/lib/fabric/fabric'
import { message, Modal } from 'antd'
import { hitShapeTypes, intePathGenerateWay, traPathGenerateWay } from '@/constants'
import {
  getEISegImg,
  getSmartPath,
  getSAMSegImg,
  getHQSAMSegImg,
  getSemSAMSegImg,
  getNewSegImg,
  getPathoSegImg,
} from '@/request/actions/tagger'
import {
  actionHandler,
  addPolygonPoint,
  anchorWrapper,
  drawPoint,
  drawPolygon,
  drawPolygonPath,
  drawRectangle,
  drawEllipse,
  polygonPositionHandler,
} from './utils'
import { hexToRgba } from '@/helpers/Utils'
import { useSelector } from 'react-redux'

// @ts-ignore
const fabric = window.fabric

// 注册canvas监听事件
// 这些传入的参数都有什么作用呢
export const fabricObjAddEvent = (
  canvas, // fabric canvas
  setPosition, // 设置每个物体右侧控制标志的位置
  tempInObject, // 在自由路径时判断鼠标是否位于某个对象中
  drawingRect, // 是否正在绘制矩形
  drawingEllipse,   //是否正在绘制椭圆
  mouseFrom, // 绘制矩形的起始点
  drawingPolygon, // 是否正在绘制多边形
  drawingPolygonPath,  // 是否正在绘制多边形路径
  polygonPoints, // 多边形的点数组
  drawingObject, // 正在绘制的自由路径对象？
  tempActiveLine, // 多边形的正在绘制的临时线
  tempLineArr, // 多边形的临时线数组
  panningCanvas, // 是否正在拖拽画布
  moveCount, // 移动计数
  pathGroupArr, // 画笔模式下的路径数组
  setDrawingPath, // 设置是否正在绘制路径
  setChangeSession, // 设置是否改变了画布内容
  setLoadingInfo, //  设置loading信息
  eiSegPointArr, // 保存eiSeg点的数组
  currentEISegPaths, // 保存eiSeg路径的数组
  setSettingEIPoint, // 设置是否正在设置eiSeg点
  updateLabel, // 更新目前选择的标签
  space, // 是否status标注为notDone 或 isEdit是否是true（表示重新进入编辑状态）
  firstClick, // 记录第一次点击状态
  isEditLine, // 当前是否在编辑已有自由路径
  dispatch,
  ControlTypeChangeTODRAG
) => {
  canvas.on({
    'selection:created': o => {
      // 拖拽模式下不允许选中object
      if (o.selected.length > 1)
        // 已禁用了canvas的多选
        return
      
      dispatch({
        type: 'UPDATE_CURRENT_ACTIVE_OBJ',
        payload: o.selected[0],
      })
      if (o.selected && o.selected.length > 0 && o.selected[0].label) {
        dispatch({
          type: 'UPDATE_CURRENT_ENTITY',
          payload: o.selected[0].label,
        })
      }

      if(o.selected[0].shape !== hitShapeTypes.POINT){
        o.selected[0].set('fill','rgba(0,0,0,0.3)')
      }

      const bl = o.selected[0].aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)

      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.selected[0].type,
      })
    },
    'selection:updated': o => {
      if (o.selected.length > 1) return
      if (o.selected && o.selected.length > 0 && o.selected[0].label) {
        dispatch({
          type: 'UPDATE_CURRENT_ENTITY',
          payload: o.selected[0].label,
        })
      }

      dispatch({
        type: 'UPDATE_CURRENT_ACTIVE_OBJ',
        payload: o.selected[0],
      })
      const bl = o.selected[0].aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)

      canvas.forEachObject(function (object) {
        if(object.shape !== hitShapeTypes.POINT){
          object.set('fill', false);
        }
      })
      if(o.selected[0].shape !== hitShapeTypes.POINT){
        o.selected[0].set('fill','rgba(0,0,0,0.3)')
      }

      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.selected[0].type,
      })
    },
    'selection:cleared': o => {
      dispatch({
        type: 'UPDATE_CURRENT_ACTIVE_OBJ',
        payload: null,
      })
      canvas.forEachObject(function (object) {
        if(object.shape !== hitShapeTypes.POINT){
          object.set('fill', false);
        }
      })
      setPosition({ left: 0, top: 0, display: 'none' })
      if (!space) {
        dispatch({
          type: 'UPDATE_CURRENT_ENTITY',
          payload: '',
        })
      }
    },
    'object:removed': o => {
      setChangeSession(true)
    },
    'object:modified': o => {
      setChangeSession(true)

      const bl = o.target.aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)
      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.target.type,
      })
    },
    'object:scaling': o => {
      const bl = o.target.aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)
      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.target.type,
      })
    },
    'object:moving': o => {
      const bl = o.target.aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)
      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.target.type,
      })
    },
    'object:rotating': o => {
      const bl = o.target.aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)
      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.target.type,
      })
    },
    'object:skewing': o => {
      const bl = o.target.aCoords.bl
      const _relativeBl = fabric.util.transformPoint(bl, canvas.viewportTransform)
      setPosition({
        left: _relativeBl.x,
        top: _relativeBl.y,
        display: 'block',
        type: o.target.type,
      })
    },
    'mouse:down:before': o => {
      if (o.target) {
        if (o.target === canvas.getActiveObject()) {
          firstClick.current = false
        } else {
          firstClick.current = true
        }
      }
    },
    'mouse:down': o => {
      const { project } = store.getState()
      const {
        currentShape,
        entityColorMap,
        currentEntity,
        currentControlType,
        segPositive,
        isMutiTag,
        pathoImgInfo,
        pathoViewSize,
        SAMMode,
        currentIntePathWay,
        strokeWidth,
        circleRadius,
        currentCanvas
      } = project
      if (o.e && o.target) {
        o.e.preventDefault();
        o.e.stopPropagation();
      }
      switch (currentControlType) {
        case 'default':
          if (!currentEntity || !currentShape) return
          // 默认模式下处理鼠标点击事件
          // 视口坐标系转换为画布坐标系
          const matrix = fabric.util.invertTransform(canvas.viewportTransform)
          // // console.log('o.pointer', o.pointer)
          const actualPoint = fabric.util.transformPoint(o.pointer, matrix)
          const leftTopPoint = fabric.util.transformPoint({ x: 0, y: 0 }, matrix)
          // // console.log('leftTopPointCanvas', leftTopPoint)
          leftTopPoint.x = convertCanvasToImage(leftTopPoint.x, pathoImgInfo.size.width, 1000)
          leftTopPoint.y = convertCanvasToImage(leftTopPoint.y, pathoImgInfo.size.width, 1000)
          // // console.log('leftTopPointImage', leftTopPoint)

          // 画点
          if (currentShape === hitShapeTypes.POINT) {
            if (o.target) return
            drawingRect.current = false
            actualPoint.x -= circleRadius
            actualPoint.y -= circleRadius
            const point = drawPoint({
              color: entityColorMap[currentEntity],
              position: actualPoint,
              label: currentEntity,
              strokeWidth: strokeWidth,
              circleRadius: circleRadius,
            })
            canvas.add(point)
            if (!isMutiTag) {
              ControlTypeChangeTODRAG()
            }
            dispatch({
              type: 'UPDATE_CURRENT_CANVAS',
              payload: currentCanvas,
            })
            dispatch({
              type: 'UPDATE_NEW_ANNOTATION',
              payload: point
            })
          }

          //画椭圆形
          if (currentShape === hitShapeTypes.ELLIPSE) {
            if (o.target) return
            drawingEllipse.current = true
            mouseFrom.current = actualPoint
          }

          // 画矩形 或 GRABCUT生成path
          if (
            currentShape === hitShapeTypes.RECT ||
            (currentShape === hitShapeTypes.INTEPATH &&
              currentIntePathWay === intePathGenerateWay.SAMSEG &&
              SAMMode === 'box')
          ) {
            if (o.target) return
            if (
              currentShape === hitShapeTypes.INTEPATH &&
              currentIntePathWay === intePathGenerateWay.SAMSEG &&
              SAMMode === 'box'
            ) {
              if (pathoViewSize.width > 1024 || pathoViewSize.height > 1024) {
                Modal.warning({
                  content: `该算法要求视窗内图片尺寸小于 1024*1024，当前视窗内图片尺寸为 ${pathoViewSize.width} * ${pathoViewSize.height}，请放大图片后再使用该算法。`,
                })
                return
              }
            }
            drawingRect.current = true
            mouseFrom.current = actualPoint
          }

          // 画多边形路径
          if (currentShape === hitShapeTypes.POLYGONPATH) {
            if(o.target) return
            drawingPolygonPath.current = true
            mouseFrom.current = actualPoint
            addPolygonPoint(
              actualPoint,
              canvas,
              polygonPoints,
              drawingObject,
              entityColorMap[currentEntity],
              tempActiveLine,
              tempLineArr,
              strokeWidth,
              0
            ) // 往多边形中添加点
          }

          // 画多边形
          if (currentShape === hitShapeTypes.POLYGON) {
            // //// console.log(drawingPolygon)
            if (o.target && !drawingPolygon.current) return
            if (o.target && o.target.id === polygonPoints.current[0].id) {
              //// console.log('绘制完毕')
              // 多边形绘制完毕
              generatePolygon(
                canvas,
                polygonPoints,
                tempLineArr,
                drawingObject,
                tempActiveLine,
                entityColorMap[currentEntity],
                currentEntity,
                strokeWidth,
                dispatch
              )
              if (!isMutiTag) {
                ControlTypeChangeTODRAG()
              }
              dispatch({
                type: 'UPDATE_CURRENT_CANVAS',
                payload: currentCanvas,
              })
              drawingPolygon.current = false
            } else {
              // 多边形绘制中
              drawingPolygon.current = true
              addPolygonPoint(
                actualPoint,
                canvas,
                polygonPoints,
                drawingObject,
                entityColorMap[currentEntity],
                tempActiveLine,
                tempLineArr,
                strokeWidth,
                circleRadius
              ) // 往多边形中添加点
            }
          }

          // EISEG生成path
          if (
            currentShape === hitShapeTypes.INTEPATH &&
            currentIntePathWay === intePathGenerateWay.EISEG
          ) {
            // 临时路径数组不为空时允许穿透
            if (o.target && !currentEISegPaths.current.length) return
            if (pathoViewSize.width > 1024 || pathoViewSize.height > 1024) {
              Modal.warning({
                title: '注意',
                content: (
                  <div>
                    &emsp; 该算法要求视窗内图片尺寸小于 <b>1024*1024</b>
                    <br />
                    &emsp; 当前视窗内图片尺寸为{' '}
                    <b>
                      {pathoViewSize.width} * {pathoViewSize.height}
                    </b>
                    <br />
                    &emsp; 请<b>放大图片</b>后再使用该算法
                  </div>
                ),
              })
              return
            }
            setSettingEIPoint(true)
            actualPoint.x -= circleRadius
            actualPoint.y -= circleRadius
            const point = drawPoint({
              color: segPositive ? 'green' : 'red',
              position: actualPoint,
              strokeWidth: strokeWidth,
              circleRadius: circleRadius,
            })
            // // console.log(actualPoint)
            // // console.log(point)
            point.set({ positive: segPositive })
            canvas.add(point)
            eiSegPointArr.current.push(point)
            if (eiSegPointArr.current.length === 1) {
              message.info('图像特征抽取中，预计需要10秒')
            }
            generateEISegPath(setLoadingInfo, eiSegPointArr, currentEISegPaths, leftTopPoint)
          } else if (
            currentShape === hitShapeTypes.INTEPATH &&
            currentIntePathWay === intePathGenerateWay.SAMSEG &&
            SAMMode === 'point'
          ) {
            if (o.target && !currentEISegPaths.current.length) return
            if (pathoViewSize.width > 1024 || pathoViewSize.height > 1024) {
              Modal.warning({
                title: '注意',
                content: (
                  <div>
                    &emsp; 该算法要求视窗内图片尺寸小于 <b>1024*1024</b>
                    <br />
                    &emsp; 当前视窗内图片尺寸为{' '}
                    <b>
                      {pathoViewSize.width} * {pathoViewSize.height}
                    </b>
                    <br />
                    &emsp; 请<b>放大图片</b>后再使用该算法
                  </div>
                ),
              })
              return
            }
            setSettingEIPoint(true)
            actualPoint.x -= circleRadius
            actualPoint.y -= circleRadius
            const point = drawPoint({
              color: segPositive ? 'green' : 'red',
              position: actualPoint,
              strokeWidth: strokeWidth,
              circleRadius: circleRadius,
            })
            point.set({ positive: segPositive })
            canvas.add(point)
            eiSegPointArr.current.push(point)
            if (eiSegPointArr.current.length === 1) {
              message.info('图像特征抽取中，预计需要10秒')
            }
            generateSAMSegPath(setLoadingInfo, eiSegPointArr, currentEISegPaths, leftTopPoint)
          }
          // else if (
          //   currentShape === hitShapeTypes.INTEPATH &&
          //   currentIntePathWay === intePathGenerateWay.HQSAMSEG
          // ) {
          //   if (o.target && !currentEISegPaths.current.length) return
          //   setSettingEIPoint(true)
          //   const point = drawPoint({
          //     color: segPositive ? 'green' : 'red',
          //     position: actualPoint,
          //   })
          //   point.set({ positive: segPositive })
          //   canvas.add(point)
          //   eiSegPointArr.current.push(point)
          //   if (eiSegPointArr.current.length === 1) {
          //     message.info('图像特征抽取中，预计需要10秒')
          //   }
          //   generateHQSAMSegPath(setLoadingInfo, eiSegPointArr, currentEISegPaths)
          // } else if (
          //   currentShape === hitShapeTypes.INTEPATH &&
          //   currentIntePathWay === intePathGenerateWay.SemSAMSEG
          // ) {
          //   if (o.target && !currentEISegPaths.current.length) return
          //   setSettingEIPoint(true)
          //   const point = drawPoint({
          //     color: segPositive ? 'green' : 'red',
          //     position: actualPoint,
          //   })
          //   point.set({ positive: segPositive })
          //   canvas.add(point)
          //   eiSegPointArr.current.push(point)
          //   if (eiSegPointArr.current.length === 1) {
          //     message.info('图像特征抽取中，预计需要10秒')
          //   }
          //   generateSemSAMSegPath(setLoadingInfo, eiSegPointArr, currentEISegPaths)
          // }
          break
        case 'drag':
          // 拖拽模式下处理鼠标点击事件
          // panningCanvas.current = true
          break
        default:
          break
      }
    },
    'mouse:move': o => {
      // // console.log('mouse:move')
      const { project } = store.getState()
      const {
        currentShape,
        entityColorMap,
        strokeWidth,
        currentEntity,
        currentControlType,
        currentTraPathWay,
        currentIntePathWay,
        SAMMode,
      } = project

      const matrix = fabric.util.invertTransform(canvas.viewportTransform)
      const actualPoint = fabric.util.transformPoint(o.pointer, matrix)

      switch (currentControlType) {
        // 默认模式下处理鼠标移动事件
        case 'default':
          canvas.defaultCursor = currentEntity ? 'crosshair' : 'default'

          moveCount.current++
          if (moveCount.current % 2) return // 减少绘制频率
          if (
            drawingRect.current &&
            (currentShape === hitShapeTypes.RECT ||
              (currentShape === hitShapeTypes.TRAPATH && isRectGrabPath(currentTraPathWay)) ||
              (currentShape === hitShapeTypes.INTEPATH &&
                currentIntePathWay === intePathGenerateWay.SAMSEG &&
                SAMMode === 'box'))
          ) {
            generateRect(
              canvas,
              dispatch,
              actualPoint,
              drawingObject,
              mouseFrom,
              entityColorMap[currentEntity],
              currentEntity,
              strokeWidth,
              false
            )
          }
          if ( drawingPolygonPath.current && currentShape === hitShapeTypes.POLYGONPATH) {
            addPolygonPoint(
              actualPoint,
              canvas,
              polygonPoints,
              drawingObject,
              entityColorMap[currentEntity],
              tempActiveLine,
              tempLineArr,
              strokeWidth,
              0
            ) // 往多边形中添加点
          }

          //绘制椭圆形
          if ( drawingEllipse.current && currentShape === hitShapeTypes.ELLIPSE) {
            generateEllipse(
              canvas,
              dispatch,
              actualPoint,
              drawingObject,
              mouseFrom,
              currentEntity,
              entityColorMap[currentEntity],
              strokeWidth,
              false
            )
          }

          // console.log(canvas.isDrawingMode)
          // console.log(tempInObject.current)
          if (canvas.isDrawingMode && !tempInObject.current) {
            // console.log('进来了')
            let objects = canvas.getObjects()
            for (var i = 0; i < objects.length; i++) {
              // 如果鼠标指针进入一个path对象并且是当前正在绘制对象的一部分时就忽略，否则检查鼠标指针是否在对象中
              if (!(objects[i].type === 'path')) {
                if (isInObject(objects[i], actualPoint)) {
                  canvas.isDrawingMode = false
                  tempInObject.current = true
                  break
                }
              }
            }
          } else if (!canvas.isDrawingMode && tempInObject.current) {
            let objects = canvas.getObjects()
            for (var i = 0; i < objects.length; i++) {
              // 检查鼠标指针是否不在任何对象中
              if (!(objects[i].type === 'path')) {
                if (isInObject(objects[i], actualPoint)) {
                  return
                }
              }
            }
            canvas.isDrawingMode = true
            tempInObject.current = false
          }
          break
        // 拖拽模式下处理鼠标移动事件
        case 'drag':
          canvas.defaultCursor = 'grab'
        // if (panningCanvas.current && o.e) {
        //   var delta = new fabric.Point(o.e.movementX, o.e.movementY)
        //   canvas.relativePan(delta)
        // }
        default:
          break
      }
    },
    'mouse:up': o => {
      //// console.log('mouse:up')
      const { project } = store.getState()
      const {
        currentShape,
        entityColorMap,
        strokeWidth,
        currentEntity,
        currentControlType,
        currentTraPathWay,
        currentIntePathWay,
        pathoImgInfo,
        SAMMode,
        currentCanvas,
        isMutiTag,
      } = project

      const matrix = fabric.util.invertTransform(canvas.viewportTransform)
      const actualPoint = fabric.util.transformPoint(o.pointer, matrix)
      const leftTopPoint = fabric.util.transformPoint({ x: 0, y: 0 }, matrix)
      // // console.log('leftTopPointCanvas', leftTopPoint)
      leftTopPoint.x = convertCanvasToImage(leftTopPoint.x, pathoImgInfo.size.width, 1000)
      leftTopPoint.y = convertCanvasToImage(leftTopPoint.y, pathoImgInfo.size.width, 1000)
      // // console.log('leftTopPointImage', leftTopPoint)
      if (!firstClick.current && canvas.getActiveObject()) {
        canvas.discardActiveObject()
        canvas.renderAll()
      }
      switch (currentControlType) {
        // 默认模式下处理鼠标抬起事件
        case 'default':
          if (
            (currentShape === hitShapeTypes.RECT ||
              (currentShape === hitShapeTypes.INTEPATH &&
                currentIntePathWay === intePathGenerateWay.SAMSEG &&
                SAMMode === 'box')) &&
            drawingRect.current
          ) {
            // 矩形绘制完毕
            if (currentShape === hitShapeTypes.RECT) {
              generateRect(
                canvas,
                dispatch,
                actualPoint,
                drawingObject,
                mouseFrom,
                entityColorMap[currentEntity],
                currentEntity,
                strokeWidth,
                true
              )
            }
            if (
              currentShape === hitShapeTypes.INTEPATH &&
              currentIntePathWay === intePathGenerateWay.SAMSEG &&
              SAMMode === 'box'
            ) {
              generateSAMRectSegPath(
                canvas,
                actualPoint,
                drawingObject,
                mouseFrom,
                setLoadingInfo,
                entityColorMap[currentEntity],
                currentEntity,
                leftTopPoint
              )
            }

            drawingObject.current = null
            drawingRect.current = false
            moveCount.current = 1
            if (!isMutiTag) {
              ControlTypeChangeTODRAG()
            }
            dispatch({
              type: 'UPDATE_CURRENT_CANVAS',
              payload: currentCanvas,
            })
          }

           //椭圆形绘制完毕
           if(currentShape === hitShapeTypes.ELLIPSE && drawingEllipse.current){
            generateEllipse(
              canvas,
              dispatch,
              actualPoint,
              drawingObject,
              mouseFrom,
              currentEntity,
              entityColorMap[currentEntity],
              strokeWidth,
              true
            )
            drawingObject.current = null
            drawingEllipse.current = false
            moveCount.current = 1
            if (!isMutiTag) {
              ControlTypeChangeTODRAG()
            }
            dispatch({
              type: 'UPDATE_CURRENT_CANVAS',
              payload: currentCanvas,
            })
          }
          // 多边形路径绘制完成
          if ( drawingPolygonPath.current && currentShape === hitShapeTypes.POLYGONPATH) {
            generatePolygonPath(
              canvas,
              polygonPoints,
              tempLineArr,
              drawingObject,
              tempActiveLine,
              entityColorMap[currentEntity],
              currentEntity,
              strokeWidth,
              dispatch
            )

            tempActiveLine.current = null
            polygonPoints.current = []
            drawingObject.current = null
            drawingPolygonPath.current = false
            moveCount.current = 1
            if (!isMutiTag) {
              ControlTypeChangeTODRAG()
            }
            dispatch({
              type: 'UPDATE_CURRENT_CANVAS',
              payload: currentCanvas,
            })
          }
          if (canvas.isDrawingMode && canvas.brushMode === 'pencil') {
            setDrawingPath(true)
            // 画笔模式
            o.currentTarget.set({
              shape: hitShapeTypes.PATH,
            })
            pathGroupArr.current.push(o.currentTarget)
          }
          break
        // 拖拽模式下处理鼠标抬起事件
        case 'drag':
          break
        // panningCanvas.current = false
        default:
          break
      }
    },
    'mouse:wheel': o => {
      // //// console.log('mouse:wheel', o.e.deltaY)
      // const event = o.e
      // event.preventDefault()
      // var zoom = (event.deltaY > 0 ? 0.1 : -0.1) + canvas.getZoom()
      // zoom = Math.max(0.1, zoom) //最小为原来的1/10
      // zoom = Math.min(3, zoom) //最大是原来的3倍
      // // 以canvas的中心为缩放中心点（若以鼠标当前位置为中心点，则缩放后移动鼠标再缩放，位置会出现严重偏差）
      // const centerPoint = { x: canvas.getWidth() / 2, y: canvas.getHeight() / 2 }
      // var zoomPoint = new fabric.Point(centerPoint.x, centerPoint.y)
      // canvas.zoomToPoint(zoomPoint, zoom)
      // const obj = canvas.getActiveObject()
      // if (obj) {
      //   const _relativeTr = fabric.util.transformPoint(obj.aCoords.tr, canvas.viewportTransform)
      //   setPosition({
      //     left: _relativeTr.x,
      //     top: _relativeTr.y,
      //     display: 'block',
      //     type: obj.type,
      //   })
      // }
    },
  })
}

//生成最终的多边形路径
export const generatePolygonPath = (
  canvas,
  polygonPoints,
  tempLineArr,
  drawingObject,
  tempActiveLine,
  fillColor,
  currentEntity,
  strokeWidth,
  dispatch
) => {
  if (!drawingObject.current) return
  polygonPoints.current.forEach(point => canvas.remove(point))
  tempLineArr.current.forEach(line => canvas.remove(line))
  canvas.remove(drawingObject.current).remove(tempActiveLine.current)
  const points = drawingObject.current.get('points')
  // .map(_p => ({ x: _p.x + sliceX, y: _p.y + sliceY }))

  const polygonPath = drawPolygonPath({
    points,
    label: currentEntity,
    color: fillColor,
    strokeWidth,
  })

  canvas.add(polygonPath)
  dispatch({
    type: 'UPDATE_NEW_ANNOTATION',
    payload: polygonPath
  })
  tempActiveLine.current = null
  drawingObject.current = null
  polygonPoints.current = []

}

// 生成最终的多边形
export const generatePolygon = (
  canvas,
  polygonPoints,
  tempLineArr,
  drawingObject,
  tempActiveLine,
  fillColor,
  currentEntity,
  strokeWidth,
  dispatch
) => {
  if (!drawingObject.current) return
  polygonPoints.current.forEach(point => canvas.remove(point))
  tempLineArr.current.forEach(line => canvas.remove(line))
  canvas.remove(drawingObject.current).remove(tempActiveLine.current)
  const points = drawingObject.current.get('points')
  // .map(_p => ({ x: _p.x + sliceX, y: _p.y + sliceY }))

  const polygon = drawPolygon({
    points,
    color: fillColor,
    label: currentEntity,
    strokeWidth,
  })
  // polygon.left -= sliceX
  // polygon.top -= sliceY
  // polygon.setCoords()
  polygon.set({
    controls: points.reduce(function (acc, point, index) {
      acc['p' + index] = new fabric.Control({
        positionHandler: polygonPositionHandler,
        actionHandler: anchorWrapper(index > 0 ? index - 1 : points.length - 1, actionHandler),
        actionName: 'modifyPolygon',
        pointIndex: index,
      })
      return acc
    }, {}),
  })

  // //// console.log(polygon)
  canvas.add(polygon)
  dispatch({
    type: 'UPDATE_NEW_ANNOTATION',
    payload: polygon
  })
  //// console.log(canvas.getObjects())

  tempActiveLine.current = null
  drawingObject.current = null
  polygonPoints.current = []
}

// 绘制椭圆形时要根据鼠标移动位置改变椭圆形大小【生成临时椭圆形】
const generateEllipse = (
  canvas,
  dispatch,
  endPoint,
  drawingObject,
  mouseFrom,
  currentEntity,
  fillColor,
  strokeWidth,
  isfinish
) => {
  if (drawingObject.current) {
    // 清除上一次绘制的椭圆形
    canvas.remove(drawingObject.current)
  }
  let beginPoint = mouseFrom.current
  let rx = Math.abs(beginPoint.x - endPoint.x) / 2
  let ry = Math.abs(beginPoint.y - endPoint.y) / 2
  let top = endPoint.y > beginPoint.y ? beginPoint.y : beginPoint.y - ry * 2
  let left = endPoint.x > beginPoint.x ? beginPoint.x :  beginPoint.x - rx * 2
  const ellipse = drawEllipse({
    top, 
    left, 
    rx, 
    ry,
    color: fillColor,
    label: currentEntity,
    strokeWidth: strokeWidth,
    isfinish: isfinish
  })
  canvas.add(ellipse)
  if(isfinish){
    dispatch({
      type: 'UPDATE_NEW_ANNOTATION',
      payload: ellipse
    })
  }

  drawingObject.current = ellipse
}

// 绘制矩形时要根据鼠标移动位置改变矩形大小【生成临时矩形】
const generateRect = (
  canvas,
  dispatch,
  endPoint,
  drawingObject,
  mouseFrom,
  fillColor,
  currentEntity,
  strokeWidth,
  isfinish
) => {
  if (drawingObject.current) {
    // 清除上一次绘制的矩形
    canvas.remove(drawingObject.current)
  }

  const rect = drawRectangle({
    beginPoint: mouseFrom.current,
    endPoint,
    color: fillColor,
    label: currentEntity,
    strokeWidth: strokeWidth,
    isfinish: isfinish
  })
  canvas.add(rect)

  if(isfinish){
    dispatch({
      type: 'UPDATE_NEW_ANNOTATION',
      payload: rect
    })
  }

  drawingObject.current = rect
}
// 根据选择框生成智能路径
const generateSmartPath = async (
  canvas,
  endPoint,
  drawingObject,
  mouseFrom,
  setLoadingInfo,
  fillColor,
  currentEntity
) => {
  if (drawingObject.current) {
    // 清除上一次绘制的矩形
    canvas.remove(drawingObject.current)
  }

  const { project } = store.getState()
  const { currentHit, currentTraPathWay, cannyThreshold, threshold } = project
  // 当前图像的缩略图切割信息
  let imgSrc = currentHit.thumbnailImg
  if (imgSrc.indexOf('/uploads') !== -1) {
    imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  }
  const data = {
    xPosition: mouseFrom.current.x,
    yPosition: mouseFrom.current.y,
    width: endPoint.x - mouseFrom.current.x,
    height: endPoint.y - mouseFrom.current.y,
    imgUrl: imgSrc,
    algorithm: currentTraPathWay,
  }
  if (currentTraPathWay === traPathGenerateWay.THRESHOLD) {
    data.thresh = threshold[0]
    data.maxVal = threshold[1]
  }
  if (currentTraPathWay === traPathGenerateWay.CANNY) {
    data.threshold1 = cannyThreshold[0]
    data.threshold2 = cannyThreshold[1]
  }
  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  const res = await getSmartPath(data)
  setLoadingInfo({ flag: false, text: '' })

  try {
    const grabPaths = JSON.parse(res.data.maskPath)
    grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      aiPath.setCoords()
      canvas.add(aiPath)
    })
  } catch (error) {}
}
// 根据选择框生成samSeg智能路径
const generateSAMRectSegPath = async (
  canvas,
  endPoint,
  drawingObject,
  mouseFrom,
  setLoadingInfo,
  fillColor,
  currentEntity,
  leftTopPoint
) => {
  if (drawingObject.current) {
    // 清除上一次绘制的矩形
    canvas.remove(drawingObject.current)
  }

  const { project } = store.getState()
  const { projectDetails, currentHit, currentCanvas, pathoViewSize, pathoImgInfo } =
    project

  let imgSrc = projectDetails.mrxsAddress
  const x1 = convertCanvasToImage(
    Math.min(mouseFrom.current.x, endPoint.x),
    pathoImgInfo.size.width,
    1000
  )
  const y1 = convertCanvasToImage(
    Math.min(mouseFrom.current.y, endPoint.y),
    pathoImgInfo.size.width,
    1000
  )
  const x2 = convertCanvasToImage(
    Math.max(mouseFrom.current.x, endPoint.x),
    pathoImgInfo.size.width,
    1000
  )
  const y2 = convertCanvasToImage(
    Math.max(mouseFrom.current.y, endPoint.y),
    pathoImgInfo.size.width,
    1000
  )
  const region = [
    leftTopPoint.x,
    leftTopPoint.y,
    Number(pathoViewSize.width),
    Number(pathoViewSize.height),
  ]
  const box = [[x1 - region[0], y1 - region[1], x2 - region[0], y2 - region[1]]]
  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  const res = await getPathoSegImg({
    region: region,
    box: box,
    imgPath: imgSrc,
    modelName: 'SegmentAnything',
    projectId: projectDetails.id,
  })
  setLoadingInfo({ flag: false, text: '' })

  if (!res.err && res.data?.length) {
    const grabPaths = res.data
    //坐标转换，图像坐标转换为canvas坐标
    const _grabPaths = grabPaths.map(pathPoints => {
      return pathPoints.map(point => {
        // 对每个点进行转换，并将处理后的点添加到新数组中
        return [
          (point[0] * 1000) / pathoImgInfo.size.width,
          (point[1] * 1000) / pathoImgInfo.size.width,
        ]
      })
    })
    _grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      // aiPath.left -= sliceX
      // aiPath.top -= sliceY
      aiPath.setCoords()
      currentCanvas.add(aiPath)
    })
  }
}
// 根据点数组生成eiSeg智能路径
const generateEISegPath = async (
  setLoadingInfo,
  eiSegPointArr,
  currentEISegPaths,
  leftTopPoint
) => {
  const { project } = store.getState()
  const {
    projectDetails,
    currentHit,
    projectHits,
    currentCanvas,
    entityColorMap,
    currentEntity,
    pathoViewSize,
    pathoImgInfo,
  } = project
  currentEISegPaths.current.forEach(path => currentCanvas.remove(path))
  const fillColor = entityColorMap[currentEntity]

  let imgSrc = projectDetails.mrxsAddress
  // if (imgSrc.indexOf('/uploads') !== -1) {
  //   imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  // }

  const region = [
    leftTopPoint.x,
    leftTopPoint.y,
    Number(pathoViewSize.width),
    Number(pathoViewSize.height),
  ]

  const clickList = eiSegPointArr.current.map(point => ({
    x: convertCanvasToImage(point.left, pathoImgInfo.size.width, 1000) - region[0],
    y: convertCanvasToImage(point.top, pathoImgInfo.size.width, 1000) - region[1],
    positive: point.positive ? 1 : 0,
    id: point.id,
  }))

  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  const res = await getPathoSegImg({
    region: region,
    click_list: clickList,
    imgPath: imgSrc,
    modelName: 'EISeg',
    projectId: projectDetails.id,
  })
  setLoadingInfo({ flag: false, text: '' })

  if (!res.err && res.data?.length) {
    const grabPaths = res.data
    //坐标转换，图像坐标转换为canvas坐标
    const _grabPaths = grabPaths.map(pathPoints => {
      return pathPoints.map(point => {
        // 对每个点进行转换，并将处理后的点添加到新数组中
        return [
          (point[0] * 1000) / pathoImgInfo.size.width,
          (point[1] * 1000) / pathoImgInfo.size.width,
        ]
      })
    })
    _grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      // aiPath.left -= sliceX
      // aiPath.top -= sliceY
      aiPath.setCoords()
      currentEISegPaths.current.push(aiPath)
      currentCanvas.add(aiPath)
    })
  }
}

// 根据点数组生成samSeg智能路径
const generateSAMSegPath = async (
  setLoadingInfo,
  eiSegPointArr,
  currentEISegPaths,
  leftTopPoint
) => {
  const { project } = store.getState()
  const {
    projectDetails,
    currentHit,
    projectHits,
    currentCanvas,
    entityColorMap,
    currentEntity,
    pathoViewSize,
    pathoImgInfo,
  } = project
  currentEISegPaths.current.forEach(path => currentCanvas.remove(path))
  const fillColor = entityColorMap[currentEntity]

  let imgSrc = projectDetails.mrxsAddress
  // if (imgSrc.indexOf('/uploads') !== -1) {
  //   imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  // }
  const region = [
    leftTopPoint.x,
    leftTopPoint.y,
    Number(pathoViewSize.width),
    Number(pathoViewSize.height),
  ]

  const clickList = eiSegPointArr.current.map(point => ({
    x: convertCanvasToImage(point.left, pathoImgInfo.size.width, 1000) - region[0],
    y: convertCanvasToImage(point.top, pathoImgInfo.size.width, 1000) - region[1],
    positive: point.positive ? 1 : 0,
    id: point.id,
  }))

  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  //// console.log(projectDetails)
  const res = await getPathoSegImg({
    region: region,
    click_list: clickList,
    imgPath: imgSrc,
    modelName: 'SegmentAnything',
    projectId: projectDetails.id,
  })
  setLoadingInfo({ flag: false, text: '' })

  if (!res.err && res.data?.length) {
    const grabPaths = res.data
    //坐标转换，图像坐标转换为canvas坐标
    const _grabPaths = grabPaths.map(pathPoints => {
      return pathPoints.map(point => {
        // 对每个点进行转换，并将处理后的点添加到新数组中
        return [
          (point[0] * 1000) / pathoImgInfo.size.width,
          (point[1] * 1000) / pathoImgInfo.size.width,
        ]
      })
    })
    _grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      // aiPath.left -= sliceX
      // aiPath.top -= sliceY
      aiPath.setCoords()
      currentEISegPaths.current.push(aiPath)
      currentCanvas.add(aiPath)
    })
  }
}

const generateHQSAMSegPath = async (setLoadingInfo, eiSegPointArr, currentEISegPaths) => {
  const { project } = store.getState()
  const {
    projectDetails,
    currentHit,
    currentCanvas,
    entityColorMap,
    currentEntity,
  } = project
  currentEISegPaths.current.forEach(path => currentCanvas.remove(path))
  const fillColor = entityColorMap[currentEntity]

  // 当前图像的缩略图切割信息
  let imgSrc = currentHit.thumbnailImg
  if (imgSrc.indexOf('/uploads') !== -1) {
    imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  }
  const clickList = eiSegPointArr.current.map(point => ({
    x: point.left,
    y: point.top,
    positive: point.positive ? 1 : 0,
    id: point.id,
  }))

  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  const res = await getHQSAMSegImg({
    click_list: clickList,
    img_path: imgSrc,
  })
  setLoadingInfo({ flag: false, text: '' })

  if (!res.err && res.data?.length) {
    const grabPaths = res.data
    grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      aiPath.setCoords()
      currentEISegPaths.current.push(aiPath)
      currentCanvas.add(aiPath)
    })
  }
}

const generateSemSAMSegPath = async (setLoadingInfo, eiSegPointArr, currentEISegPaths) => {
  const { project } = store.getState()
  const { currentHit, currentCanvas, entityColorMap, currentEntity } = project
  currentEISegPaths.current.forEach(path => currentCanvas.remove(path))
  const fillColor = entityColorMap[currentEntity]

  // 当前图像的缩略图切割信息
  let imgSrc = currentHit.thumbnailImg
  if (imgSrc.indexOf('/uploads') !== -1) {
    imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  }
  const clickList = eiSegPointArr.current.map(point => ({
    x: point.left,
    y: point.top,
    positive: point.positive ? 1 : 0,
    id: point.id,
  }))

  setLoadingInfo({ flag: true, text: '智能抓取路径分析中...' })
  const res = await getSemSAMSegImg({
    click_list: clickList,
    img_path: imgSrc,
  })
  setLoadingInfo({ flag: false, text: '' })

  if (!res.err && res.data?.length) {
    const grabPaths = res.data
    grabPaths.forEach(pathPoints => {
      pathPoints.push(pathPoints[0])
      const aiPath = convertPointsToPath(pathPoints, fillColor, [currentEntity])
      aiPath.setCoords()
      currentEISegPaths.current.push(aiPath)
      currentCanvas.add(aiPath)
    })
  }
}

// 根据一维点数组返回path路径
const convertPointsToPath = (pathPoints, fillColor, label) => {
  const pointsForFabric = [['M', pathPoints[0][0], pathPoints[0][1]]]
  for (let i = 1; i < pathPoints.length - 1; i++) {
    var xc = (pathPoints[i][0] + pathPoints[i + 1][0]) / 2
    var yc = (pathPoints[i][1] + pathPoints[i + 1][1]) / 2
    pointsForFabric.push(['Q', pathPoints[i][0], pathPoints[i][1], xc, yc])
  }
  pointsForFabric.push([
    'L',
    pathPoints[pathPoints.length - 1][0],
    pathPoints[pathPoints.length - 1][1],
  ])
  return new fabric.Path(pointsForFabric, {
    id: Date.now() + Math.random() * 10, // 防止批量生成时时间过快导致时间戳相同
    strokeWidth: 0.03,
    stroke: fillColor,
    fill: hexToRgba(fillColor, 0.4),
    shape: hitShapeTypes.PATH,
    label,
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
}

const convertCanvasToImage = (x, imageWidth, canvasScale) => {
  let _x = x

  _x = _x * imageWidth

  _x = _x / canvasScale
  return _x
}

// Canny、RegionGrow、Threshold、WaterShed、RegionSplitMerge、Grabcut 都使用矩形框选择抓取区域
const isRectGrabPath = pathWay => {
  return [
    traPathGenerateWay.CANNY,
    traPathGenerateWay.GRABCUT,
    traPathGenerateWay.REGIONGROW,
    traPathGenerateWay.THRESHOLD,
    traPathGenerateWay.WATERSHED,
    traPathGenerateWay.REGIONSPLITMERGE,
  ].includes(pathWay)
}

const isInObject = (object, point) => {
  const strokeWidthOffset = object.strokeWidth ? object.strokeWidth : 0

  const isWithinObject =
    point.x >= object.left - strokeWidthOffset &&
    point.x <= object.left + object.width + strokeWidthOffset &&
    point.y >= object.top - strokeWidthOffset &&
    point.y <= object.top + object.height + strokeWidthOffset

  const isWithinFill =
    point.x > object.left + strokeWidthOffset &&
    point.x < object.left + object.width - strokeWidthOffset &&
    point.y > object.top + strokeWidthOffset &&
    point.y < object.top + object.height - strokeWidthOffset

  // 由于矩形只包括边框，这里对在矩形内部做单独判断
  if (object.type === 'rect') {
    return isWithinObject && !isWithinFill
  }

  return isWithinObject
}
