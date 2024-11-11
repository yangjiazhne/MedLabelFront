import { useDispatch, useSelector } from 'react-redux'
import store from '@/redux/store'
import { hitShapeTypes } from '@/constants'
// @ts-ignore
const fabric = window.fabric

export const zoomHandler = (event, dispatch, setZooming, setPosition) => {
  const { project } = store.getState()
  const {
    currentCanvas,
    // strokeWidth,
    // circleRadius
  } = project

  const activeObject = currentCanvas.getActiveObject();
  if (activeObject) {
    const bl = activeObject.aCoords.bl
    const _relativeBl = fabric.util.transformPoint(bl, currentCanvas.viewportTransform)
    setPosition({
      left: _relativeBl.x,
      top: _relativeBl.y,
      display: 'block',
      type: activeObject.type,
    })
  }

  setZooming(true)
  const viewport = event.eventSource.viewport

  // 根据当前放大倍数,调整图形属性
  var zoom = event.zoom
  
  if (zoom) {
    const radius = 2 / zoom
    dispatch({
      type: 'UPDATE_CIRCLERADIUS',
      payload: radius,
    })

    // 调整边框和自由划线的线宽
    const strokeWidth = 2  / zoom             // 修改尺度的同时修改 MedLabel/client/src/pages/PathoTaggerSpace/help.js  的 getCurrentResult
    dispatch({
      type: 'UPDATE_STROKEWIDTH',
      payload: strokeWidth,
    })

    currentCanvas.forEachObject(function (object) {
      if(object.shape === hitShapeTypes.POINT){
        object.set('radius', radius);
      }else{
        object.set('strokeWidth', strokeWidth);
      }
    })
  }

  // 根据当前放大倍数，初始化视窗内图片大小
  // 获取视窗的位置和大小
  const viewportBounds = viewport.getBounds(true)

  // 将视窗坐标转换为图像坐标
  const imageBounds = {
    topLeft: viewport.viewportToImageCoordinates(viewportBounds.getTopLeft()),
    bottomRight: viewport.viewportToImageCoordinates(viewportBounds.getBottomRight()),
  }

  // 计算视窗内的图像的宽度和高度
  const width = Math.abs(imageBounds.bottomRight.x - imageBounds.topLeft.x).toFixed(0)
  const height = Math.abs(imageBounds.bottomRight.y - imageBounds.topLeft.y).toFixed(0)

  dispatch({
    type: 'UPDATE_PATHOVIEWSIZE',
    payload: { width: width, height: height },
  })
}

export const animationHandler = (event, dispatch, setZooming, setPosition) => {
  const { project } = store.getState()
  const {
    currentCanvas
  } = project

  const activeObject = currentCanvas.getActiveObject();
  if (activeObject) {
    const bl = activeObject.aCoords.bl
    const _relativeBl = fabric.util.transformPoint(bl, currentCanvas.viewportTransform)
    setPosition({
      left: _relativeBl.x,
      top: _relativeBl.y,
      display: 'block',
      type: activeObject.type,
    })
  }
}

export const animationEndHandler = (event, dispatch, setZooming, setPosition) => {
  const { project } = store.getState()
  const {
    currentCanvas
  } = project

  const activeObject = currentCanvas.getActiveObject();
  if (activeObject) {
    const bl = activeObject.aCoords.bl
    const _relativeBl = fabric.util.transformPoint(bl, currentCanvas.viewportTransform)
    setPosition({
      left: _relativeBl.x,
      top: _relativeBl.y,
      display: 'block',
      type: activeObject.type,
    })
  }
  const viewport = event.eventSource.viewport

  // 根据当前放大倍数，调整视窗内图片大小
  // 获取视窗的位置和大小
  const viewportBounds = viewport.getBounds(true)

  // 将视窗坐标转换为图像坐标
  const imageBounds = {
    topLeft: viewport.viewportToImageCoordinates(viewportBounds.getTopLeft()),
    bottomRight: viewport.viewportToImageCoordinates(viewportBounds.getBottomRight()),
  }

  // 计算视窗内的图像的宽度和高度
  const width = Math.abs(imageBounds.bottomRight.x - imageBounds.topLeft.x).toFixed(0)
  const height = Math.abs(imageBounds.bottomRight.y - imageBounds.topLeft.y).toFixed(0)
  async function updateSize() {
    await dispatch({
      type: 'UPDATE_PATHOVIEWSIZE',
      payload: { width: width, height: height },
    })
    setZooming(false)
  }
  updateSize()
}
