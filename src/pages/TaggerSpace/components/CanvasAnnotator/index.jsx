import React, { useEffect, useMemo, useRef, useState } from 'react'
import '@/lib/fabric/fabric'
import '@/lib/fabric/fabric_eraser_brush'
import { renderBoxMap, handleMultiPath } from './help'
import { useDispatch, useSelector } from 'react-redux'
import useQuery from '@/hooks/useQuery'
import { Button, Modal, Spin, Tooltip, message, Input, Space, Tag } from 'antd'
import styles from './index.module.scss'
import { getImageSize } from '@/helpers/Utils'
import { CheckOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { hitShapeTypes, traPathGenerateWay, intePathGenerateWay, contorlTypes, hitShapeTypeLabels } from '@/constants'
import { getDrawCursor } from './utils'
import { fabricObjAddEvent } from './fabricObjAddEvent'
import TopRightWidget from './TopRightWidget'
import { generatePolygon } from './fabricObjAddEvent'
import { getNewSegImg } from '@/request/actions/tagger'
import { drawRectangle } from './utils'
import { VButton, VIcon } from '@/components'
import { searchAnnotation, updateAnnotation } from '@/request/actions/annotation'

// @ts-ignore
const fabric = window.fabric

const CanvasAnnotator = ({
  setChangeSession,
  space,
  setClassificationModel,
  setSelectedModels,
  setIsCheckedNone,
  updateReady
}) => {
  const dispatch = useDispatch()
  const windowWidth = (window.innerWidth * 82) / 100
  const windowHeight = window.innerHeight

  const {
    projectDetails,
    currentImage,
    entityColorMap,
    currentEntity,
    currentCanvas,
    currentShape,
    currentTraPathWay,
    currentIntePathWay,
    currentControlType,
    boundingBoxMap,
    currentModelInference,
    initBoundingBox,
    launchRefProcess,
    currentActiveObj,
    currentAnnotion
  } = useSelector(
    // @ts-ignore
    state => state.project
  )

  let queryInfo = useQuery()
  const { TextArea } = Input;

  // 注册的监听事件为闭包环境，拿不到useState中的最新值，故使用useRef
  // canvas全局的辅助变量
  const canvasInstance = useRef(null)
  const drawingObject = useRef(null) // 当前正在绘制的object
  const panningCanvas = useRef(false) // 是否正在拖动canvas

  const [loadingInfo, setLoadingInfo] = useState({ flag: true, text: '加载中...' })
  const [isEditLine, setIsEditLine] = useState(false)

  // 控制object的【删除、编辑】按钮的【位置、显示】
  const [position, setPosition] = useState({ left: 0, top: 0, display: 'none', type: '' })

  // 控制当前是否有选中的object
  const firstClick = useRef(true)

  // 绘制矩形的辅助变量
  const drawingRect = useRef(false) // 是否正在绘制矩形
  const mouseFrom = useRef({ x: 0, y: 0 }) // 绘制矩形时鼠标的起点位置
  const moveCount = useRef(1) // 计数器，用于减少绘制矩形时页面刷新的频率

  // 绘制椭圆形的辅助变量
  const drawingEllipse = useRef(false)  //是否正在绘制椭圆形

  // 绘制多边形路径的辅助变量
  const drawingPolygonPath = useRef(false)  //是否正在绘制多边形路径

  // 绘制多边形的辅助变量
  const drawingPolygon = useRef(false) // 是否正在绘制多边形
  const polygonPoints = useRef([]) // 当前绘制的polygon的点数组
  const tempLineArr = useRef([]) // 当前绘制的polygon的临时线数组【polygon绘制完成后要从页面清除】
  const tempActiveLine = useRef(null) // 绘制polygon时正在绘制的线

  // 绘制自由形状的辅助变量
  const tempInObject = useRef(false) // 当前鼠标临时位于的object
  const [spotSize, setSpotSize] = useState(5) // 自由绘制时，笔触/橡皮擦 的大小粗细
  const [drawingPath, setDrawingPath] = useState(false)
  const [brushMode, setBrushMode] = useState('pencil')
  const pathGroupArr = useRef([])

  // 所有交互式的辅助变量
  const eiSegPointArr = useRef([]) // 当前的控制点信息
  const currentEISegPaths = useRef([]) // 当前返回的多条路径信息，临时存储，每次返回时都要先清空上一次的所有路径
  const [settingEIPoint, setSettingEIPoint] = useState(false)

  const [taginfoValue, setTaginfoValue] = useState('')
  const [isTagInfoModalOpen, setIsTagInfModalOpen] = useState(false);
  const handleTagInfoModalOk = () => {
    if(currentActiveObj.tagInfo){
      currentActiveObj.tagInfo = taginfoValue
    }else{
      currentActiveObj.set('tagInfo', taginfoValue);
    }
    setIsTagInfModalOpen(false);
    setTaginfoValue('')
    // 取消选中所有对象
    currentCanvas.discardActiveObject();
    // 设置当前对象为选中状态
    currentCanvas.setActiveObject(currentActiveObj);
    // 重新渲染画布
    currentCanvas.renderAll();
  };
  const handelInfoValueChange = (event) => {
    if(event && event.target && event.target.value){
      let value = event.target.value;
      setTaginfoValue(value)
    }
  }

  const isFreeDraw = useMemo(
    () =>
      currentEntity &&
      currentShape === hitShapeTypes.MANUALCLOSE &&
      currentControlType === 'default',
    [currentEntity, currentShape, currentControlType]
  )

  useEffect(() => {
    fabric.Object.prototype.transparentCorners = false
    fabric.Object.prototype.cornerColor = 'blue'
    fabric.Object.prototype.cornerStyle = 'circle'
    canvasInstance.current = new fabric.Canvas('canvas', {
      selection: false,
      willReadFrequently: true,
    })
    dispatch({
      type: 'UPDATE_CURRENT_CANVAS',
      payload: canvasInstance.current,
    })
    // 注册监听事件
    fabricObjAddEvent(
      canvasInstance.current,
      tempInObject,
      setPosition,
      drawingRect,
      mouseFrom,
      drawingEllipse,
      drawingPolygonPath,
      drawingPolygon,
      polygonPoints,
      drawingObject,
      tempActiveLine,
      tempLineArr,
      panningCanvas,
      moveCount,
      pathGroupArr,
      firstClick,
      setDrawingPath,
      setChangeSession,
      setLoadingInfo,
      eiSegPointArr,
      currentEISegPaths,
      setSettingEIPoint,
      updateLabel,
      space,
      dispatch,
      ControlTypeChangeTODRAG
    )
    return () => {
      // 销毁当前canvas实例
      canvasInstance.current.dispose()
      dispatch({
        type: 'UPDATE_CURRENT_CANVAS',
        payload: null,
      })
    }
  }, [])

  //交互式标注初次点击弹框
  useEffect(() => {
    if (eiSegPointArr.current.length === 1) {
      message.info('图像特征抽取中，预计需要3秒')
    }
  }, [eiSegPointArr])

  const ControlTypeChangeTODRAG = () => {
    dispatch({
      type: 'UPDATE_CURRENT_CONTROL_TYPE',
      payload: contorlTypes.DRAG,
    })
    dispatch({
      type: 'UPDATE_CURRENT_SHAPE',
      payload: hitShapeTypes.NONE,
    })
  }

  // 更新触笔大小
  useEffect(() => {
    if (brushMode === 'pencil') {
      canvasInstance.current.freeDrawingBrush.width = spotSize
      canvasInstance.current.freeDrawingCursor = `url(${getDrawCursor(
        spotSize
      )}) ${spotSize} ${spotSize}, crosshair`
    } else if (brushMode === 'eraser') {
      const actualSpotSize = spotSize * 3
      canvasInstance.current.freeDrawingBrush.width = actualSpotSize
      canvasInstance.current.freeDrawingCursor = `url(${getDrawCursor(
        actualSpotSize
      )}) ${actualSpotSize} ${actualSpotSize}, crosshair`
    }
  }, [spotSize])

  const fetchAnnotionData = async(imageId) => {
    const annotionRes = await searchAnnotation(imageId)

    dispatch({
      type: 'UPDATE_ANNOTION',
      payload: annotionRes.data.content
    })

    if(annotionRes.data.content.length === 0){
      dispatch({
        type: 'UPDATE_CURRENT_ANNOTION',
        payload: null,
      })
      dispatch({
          type: 'UPDATE_INIT_BOUNDING_BOX',
          payload: []
      })
      dispatch({
          type: 'UPDATE_CUSTOM_ENTITY',
          payload: [],
      })
      return
    }

    dispatch({
      type: 'UPDATE_CURRENT_ANNOTION',
      payload: annotionRes.data.content[0],
    })

    const res = JSON.parse(annotionRes.data.content[0].annotationResult)

    if(res.hitResults){
      dispatch({
        type: 'UPDATE_INIT_BOUNDING_BOX',
        payload: res.hitResults,
      })
    }else{
      dispatch({
        type: 'UPDATE_INIT_BOUNDING_BOX',
        payload: [],
      })
    }

    if(res.customCategories){
      dispatch({
        type: 'UPDATE_CUSTOM_ENTITY',
        payload: res.customCategories,
      })
    }
  }

  // 切换标注图片
  useEffect(() => {
    if (!currentImage) return
    setLoadingInfo({ flag: true, text: '图片加载中...' })
    
    // fetchAnnotionData(currentImage.imageId)

    canvasInstance.current.clear()
    canvasInstance.current.setViewportTransform([1, 0, 0, 1, 0, 0])

    dispatch({
      type: 'UPDATE_CURRENT_SHAPE',
      payload: hitShapeTypes.NONE,
    })

    getImageSize(currentImage.imageUrl).then(res => {
      const { naturalWidth, naturalHeight } = res

      dispatch({
        type: 'UPDATE_CURRENT_IMAGE_SIZE',
        payload: {
          width: naturalWidth,
          height: naturalHeight,
        },
      })
      // 使得图片会在canvas中间
      var delta = new fabric.Point(
        (windowWidth - naturalWidth) / 2,
        (windowHeight - naturalHeight) / 2
      )
      canvasInstance.current.relativePan(delta)
      canvasInstance.current.setBackgroundImage(
        currentImage.imageUrl,
        () => {
          setLoadingInfo({ flag: false, text: '' })
          // variableInit()
          fetchAnnotionData(currentImage.imageId)
          // 渲染已有的标注信息
          // canvasInstance.current.remove(...canvasInstance.current.getObjects())
          // renderBoxMap()
          // 重置修改标志位
          // setChangeSession(false)
          // setClassificationModel('none')
          // setSelectedModels(JSON.parse(localStorage.getItem('selectedModels')) || [])
          // setIsCheckedNone(false)
          canvasInstance.current.renderAll();
        },
        {
          erasable: false,
        }
      )
    })
  }, [currentImage])

  useEffect(() => {
    variableInit()
    canvasInstance.current.remove(...canvasInstance.current.getObjects())
    renderBoxMap(initBoundingBox)
    setChangeSession(false)
    setClassificationModel('none')
    setSelectedModels(JSON.parse(localStorage.getItem('selectedModels')) || [])
    setIsCheckedNone(false)
  }, [initBoundingBox])

  useEffect(() => {
    if (isFreeDraw) {
      startDrawingPathWithType('pencil')
    } else {
      canvasInstance.current.isDrawingMode = false
    }
  }, [isFreeDraw])

  useEffect(() => {
    variableInit()
    // 如果标签改变了，重新设置画笔颜色和标签
    if (isFreeDraw) {
      startDrawingPathWithType('pencil')
    }
  }, [currentShape, currentEntity, currentTraPathWay, currentIntePathWay, updateReady])

  useEffect(() => {
    let currentCanvas = canvasInstance.current
    currentCanvas.discardActiveObject()
    currentCanvas.renderAll()
    // 设置所有object的可选性
    // currentCanvas.forEachObject(function (object) {
    //   object.selectable = currentControlType === 'default'
    //   object.evented = currentControlType === 'default'
    // })
  }, [currentControlType])

  // 设置全局label信息
  const updateLabel = labelSelected => {
    dispatch({
      type: 'UPDATE_CURRENT_ENTITY',
      payload: labelSelected,
    })
  }

  // useEffect(() => {
  //   if (launchRefProcess) {
  //     generateSmartAlPath()
  //     dispatch({
  //       type: 'UPDATE_LAUNCH_REF_PROCESS',
  //       payload: false,
  //     })
  //   }
  // }, [launchRefProcess])

  // 变量重新初始化
  const variableInit = () => {
    const canvas = canvasInstance.current
    // 当前还有未完成的自由路径和多边形
    if (drawingPath) {
      generateFreeLine()
    }
    if (drawingPolygon) {
      generatePolygon(
        canvas,
        polygonPoints,
        tempLineArr,
        drawingObject,
        tempActiveLine,
        entityColorMap[currentEntity],
        currentEntity,
        dispatch
      )
    }

    polygonPoints.current?.forEach(point => canvas.remove(point))
    tempLineArr.current?.forEach(line => canvas.remove(line))
    eiSegPointArr.current?.forEach(point => canvas.remove(point))

    currentEISegPaths.current?.forEach(path => canvas.remove(path))
    canvas.remove(drawingObject.current).remove(tempActiveLine.current)

    tempActiveLine.current = null
    drawingObject.current = null
    polygonPoints.current = []
    eiSegPointArr.current = []
    drawingPolygon.current = false
  }

  // 开启自由绘制模式，设置画笔和橡皮擦大小
  const startDrawingPathWithType = type => {
    // 拖拽模式下不允许绘制
    if (currentControlType === 'drag') return

    const canvas = canvasInstance.current
    canvas.isDrawingMode = true
    canvas.brushMode = type
    if (type === 'pencil') {
      // 自由绘制
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
      canvas.freeDrawingCursor = `url(${getDrawCursor(
        spotSize
      )}) ${spotSize} ${spotSize}, crosshair`
      canvas.freeDrawingBrush.width = spotSize
      canvas.freeDrawingBrush.color = entityColorMap[currentEntity]
    } else if (type === 'eraser') {
      // 让橡皮擦默认为笔触的3倍大
      const actualSpotSize = spotSize * 3
      canvas.freeDrawingBrush = new fabric.EraserBrush(canvas)
      canvas.freeDrawingCursor = `url(${getDrawCursor(
        actualSpotSize
      )}) ${actualSpotSize} ${actualSpotSize}, crosshair`
      canvas.freeDrawingBrush.width = actualSpotSize
    }
  }

  // 编辑自由路径
  const setLineToEdit = () => {
    dispatch({
      type: 'UPDATE_CURRENT_SHAPE',
      payload: hitShapeTypes.MANUALCLOSE,
    })
    setIsEditLine(true)
    const currentObj = canvasInstance.current.getActiveObject()
    dispatch({
      type: 'UPDATE_CURRENT_ENTITY',
      payload: currentObj.label ? currentObj.label : '',
    })

    currentObj.set({
      erasable: true,
    })
    pathGroupArr.current.push(currentObj)
    canvasInstance.current.discardActiveObject().requestRenderAll()
  }

  // 自由绘制完成，处理多条路径和被擦除的点
  const generateFreeLine = () => {
    pathGroupArr.current.forEach(path => canvasInstance.current.remove(path))
    const groupItems = [...pathGroupArr.current]

    let _entity = ''
    if (currentEntity) {
      _entity = currentEntity
    } else {
      // 根据路径颜色尝试反推label
      for (const key in entityColorMap) {
        if (entityColorMap[key] === groupItems[0].stroke) {
          _entity = key
          break
        }
      }
    }

    let newPath = handleMultiPath(groupItems, canvasInstance.current, true)
    if (newPath) {
      newPath.label = _entity
      canvasInstance.current
        .add(newPath)
        .setActiveObject(newPath)
        .remove(drawingObject.current)
        .requestRenderAll()
    }
    // 在boundingBoxMap中删除编辑前的路径
    if (drawingObject.current) {
      dispatch({
        type: 'UPDATE_BOUNDING_BOX_MAP',
        payload: boundingBoxMap.filter(box => box.id !== drawingObject.current.id),
      })
    }
    pathGroupArr.current = []
    drawingObject.current = null
    setDrawingPath(false)
    setIsEditLine(false)
  }

  // 完成EISeg的过程，清除临时变量
  const generateEISegLine = () => {
    setSettingEIPoint(false)
    setIsEditLine(false)
    const canvas = canvasInstance.current
    eiSegPointArr.current?.forEach(point => canvas.remove(point))
    currentEISegPaths.current = []
    eiSegPointArr.current = []
  }

  // 删除某一标注信息
  const deleteBtnClick = () => {
    Modal.confirm({
      title: '确认',
      icon: <ExclamationCircleOutlined />,
      content: '确定删除该标注吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const obj = canvasInstance.current.getActiveObject()
        canvasInstance.current.remove(obj).requestRenderAll()
        // 维护boundingBoxMap数组
        dispatch({
          type: 'UPDATE_BOUNDING_BOX_MAP',
          payload: boundingBoxMap.filter(box => box.id !== obj.id),
        })
        // 维护eiSegPointArr数组
        const pointIndex = eiSegPointArr.current.findIndex(ele => ele.id === obj.id)
        eiSegPointArr.current.splice(pointIndex, 1)
      },
    })
  }

  // 根据智能算法单张推理生成路径（这个放在这里的原因是需要用到这个组件的状态，启动是通过单击标注页面工具栏中的开始推理来启动的，通过redux的launchRefProcess来控制）
  // const generateSmartAlPath = async () => {
  //   currentEISegPaths.current.forEach(path => canvasInstance.current.remove(path))
  //   const fillColor = entityColorMap[currentEntity]

  //   let imgSrc = currentHit.thumbnailImg
  //   if (imgSrc.indexOf('/uploads') !== -1) {
  //     imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  //   }

  //   setLoadingInfo({ flag: true, text: '单张图像推理中...' })
  //   const box = []
  //   const res = await getNewSegImg({
  //     box: box,
  //     imgPath: imgSrc,
  //     modelName: currentModelInference,
  //     projectId: projectDetails.id,
  //   })
  //   setLoadingInfo({ flag: false, text: '' })
  //   console.log(res)
  //   if (!res.err && res.data?.length) {
  //     const grabPaths = res.data
  //     grabPaths.forEach((pathPoints, index) => {
  //       const points = pathPoints.points
  //       const rect = drawRectangle({
  //         beginPoint: { x: points[0][0] * 2, y: points[0][1] * 2 },
  //         endPoint: { x: points[2][0] * 2, y: points[2][1] * 2 },
  //         color: fillColor,
  //         label: [currentEntity],
  //       })
  //       canvasInstance.current.add(rect)
  //     })
  //   }
  // }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Spin spinning={loadingInfo.flag} tip={loadingInfo.text}>
        <canvas
          id="canvas"
          width={windowWidth}
          height={windowHeight}
          // style={{ border: '1px solid #eee' }}
        />
        {currentActiveObj && <div
          id="deleteBtn"
          style={{
            position: 'absolute',
            left: position.left,
            top: `${position.top + 5}px`,
            display: position.display,
          }}
        >
          <div className={styles.ActiveObjCard}>
            <div className={styles.ActiveObjCardHeader}>
              <div className={styles.ActiveObjCardHeaderShape}>
                <span style={{backgroundColor: currentActiveObj.color}} className={styles.ActiveObjCardHeaderColor}>
                </span>
                <span>{hitShapeTypeLabels[currentActiveObj.shape]}</span>
              </div>
              <div className={styles.ActiveObjCardOperate}>
                <div className={styles.ActiveObjCardEdit}
                    title='编辑标注信息'
                    onClick={()=>{setIsTagInfModalOpen(true)}}>
                      <VIcon type="icon-edit" style={{ fontSize: '16px' }} />
                </div>
                <div className={styles.ActiveObjCardDelete}
                    title='删除标注区域'
                    onClick={deleteBtnClick}>
                  <VIcon type="icon-delete" style={{ fontSize: '16px' }} />
                </div>
              </div>
            </div>
            {currentActiveObj?.tagInfo && (
              <div className={styles.ActiveObjCardTagInfo}>{currentActiveObj.tagInfo}</div>
            )}
            <div>
              <div>宽度：{(currentActiveObj.width).toFixed(2)}px</div>
              <div>长度：{(currentActiveObj.height).toFixed(2)}px</div>
            </div>
          </div>
        </div>}
        <Modal title="标注信息" 
              open={isTagInfoModalOpen} 
              onOk={handleTagInfoModalOk} 
              onCancel={()=>{setIsTagInfModalOpen(false)}} 
              destroyOnClose
              okText="确定"
              cancelText="取消">
          <TextArea placeholder="请输入100字以内标注内容" 
                    showCount 
                    maxLength={100} 
                    onChange={handelInfoValueChange}
                    {...(currentActiveObj?.tagInfo ? { defaultValue: currentActiveObj.tagInfo } : {})}/>
        </Modal>
        <div className={styles.statusBar}>
          <Space size={25}>
            <span><b>标注状态：</b>{currentControlType === contorlTypes.DRAG ? '预览' : '绘制'}</span>
            {currentControlType === contorlTypes.DEFAULT && (
              <span><b>标注类别：</b>{currentEntity ? <Tag color={entityColorMap[currentEntity]}>{currentEntity}</Tag> : <Tag color="#000000">未选择</Tag>}</span>
            )}
            {currentControlType === contorlTypes.DEFAULT && (
              <span><b>标注形状：</b>{currentShape ? currentShape : '未选择'}</span>
            )}
            <span><b>标注文件：</b>{currentAnnotion? currentAnnotion.annotationName : '新建文件'}</span>
          </Space>
        </div>
      </Spin>
    </div>
  )
}

export default CanvasAnnotator

// TopRightWIndow 暂时没有用到
{/* {currentEntity &&
      (currentShape === hitShapeTypes.MANUALCLOSE ||
        (currentShape === hitShapeTypes.TRAPATH &&
          [traPathGenerateWay.CANNY, traPathGenerateWay.THRESHOLD].includes(
            currentTraPathWay
          )) ||
        (currentShape === hitShapeTypes.INTEPATH &&
          [
            intePathGenerateWay.HQSAMSEG,
            intePathGenerateWay.SAMSEG,
            intePathGenerateWay.SemSAMSEG,
            intePathGenerateWay.EISEG,
          ].includes(currentIntePathWay))) && (
        <div className={styles.drawingFreeMode}>
          <div className={styles.sizeControl}>
            <TopRightWidget
              spotSize={spotSize}
              drawingFree={startDrawingPathWithType}
              setSpotSize={setSpotSize}
              setBrushMode={setBrushMode}
            />
          </div>
          {(isEditLine || drawingPath || settingEIPoint) && (
            <Tooltip title="finish this object">
              <Button
                type="primary"
                onClick={() => {
                  if (isEditLine || drawingPath) generateFreeLine()
                  if (settingEIPoint) generateEISegLine()
                }}
                style={{ marginTop: '10px' }}
              >
                {isEditLine ? '结束修改' : drawingPath ? '结束绘制' : '结束交互'}
              </Button>
            </Tooltip>
          )}
        </div>
      )} */}

// activateObj的操作，已换新
{/* <div
      id="deleteBtn"
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        display: position.display,
      }}
    >
      <img
        src="/delete.svg"
        alt="删除"
        onClick={deleteBtnClick}
        style={{ width: 24, height: 24, cursor: 'pointer' }}
      />

      {position.type === 'path' && (
        <div className={styles.editIcon} onClick={setLineToEdit}>
          <EditOutlined />
        </div>
      )}
    </div> */}