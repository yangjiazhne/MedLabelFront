import { traPathGenerateWay, intePathGenerateWay, hitShapeTypes } from '@/constants'
import { Radio, Slider, Button } from 'antd'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import '@/lib/fabric/fabric'
import store from '@/redux/store'
import { hexToRgba } from '@/helpers/Utils'
import { getSAMSegImg, getPathoSegImg } from '@/request/actions/tagger'
// @ts-ignore
const fabric = window.fabric

const TopRightWidget = ({ canvas, drawingFree, spotSize, setSpotSize, setLoadingInfo }) => {
  const dispatch = useDispatch()
  const [brushMode, setBrushMode] = useState('pencil') // pencil / eraser
  const {
    currentIntePathWay,
    currentTraPathWay,
    currentShape,
    segPositive,
    threshold,
    cannyThreshold,
    pathoImgInfo,
    SAMMode,
  } = useSelector(
    // @ts-ignore
    state => state.project
  )

  if (currentShape === hitShapeTypes.INTEPATH && currentIntePathWay === intePathGenerateWay.EISEG)
    return (
      <Radio.Group
        value={segPositive}
        size="small"
        onChange={() =>
          dispatch({
            type: 'UPDATE_SEGPOSITIVE',
            payload: !segPositive,
          })
        }
      >
        <Radio.Button value={true}>positive</Radio.Button>
        <Radio.Button value={false}>negative</Radio.Button>
      </Radio.Group>
    )

  if (
    currentShape === hitShapeTypes.INTEPATH &&
    currentIntePathWay === intePathGenerateWay.SAMSEG
  ) {
    return (
      <div>
        <div>
          <Radio.Group
            value={SAMMode}
            size="small"
            onChange={e => {
              dispatch({
                type: 'UPDATE_SAMMODE',
                payload: e.target.value,
              })
            }}
          >
            <Radio.Button value={'point'} style={{ width: '70px', textAlign: 'center' }}>
              点
            </Radio.Button>
            <Radio.Button value={'box'} style={{ width: '70px', textAlign: 'center' }}>
              框
            </Radio.Button>
          </Radio.Group>
        </div>
        <div>
          {SAMMode === 'point' && (
            <Radio.Group
              value={segPositive}
              size="small"
              style={{ marginTop: '10px' }}
              onChange={() =>
                dispatch({
                  type: 'UPDATE_SEGPOSITIVE',
                  payload: !segPositive,
                })
              }
            >
              <Radio.Button value={true} style={{ width: '70px', textAlign: 'center' }}>
                positive
              </Radio.Button>
              <Radio.Button value={false} style={{ width: '70px', textAlign: 'center' }}>
                negative
              </Radio.Button>
            </Radio.Group>
          )}
        </div>
        {/* <div>
                    {SAMMode==='box' &&(
                        <Button onClick={() => generateSAMRectSegPath(setLoadingInfo, canvas, pathoImgInfo)} size="small" style={{left:'60px'}}>开始分割</Button>
                    )}
                </div> */}
      </div>
    )
  }
  if (currentShape === hitShapeTypes.MANUALCLOSE || currentShape === hitShapeTypes.MANUAL)
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Radio.Group
          value={brushMode}
          size="small"
          onChange={e => {
            setBrushMode(e.target.value)
            drawingFree(e.target.value)
          }}
        >
          <Radio.Button value="pencil">画笔</Radio.Button>
          <Radio.Button value="eraser">擦除</Radio.Button>
        </Radio.Group>
        {/* <Slider
                    style={{ marginLeft: '5px', width: '150px' }}
                    value={spotSize}
                    step={0.1}
                    onChange={setSpotSize}
                    min={0.1}
                    max={15}
                /> */}
      </div>
    )

  if (currentShape === hitShapeTypes.TRAPATH && currentTraPathWay === traPathGenerateWay.THRESHOLD)
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          阈值：
          <Slider
            style={{ marginLeft: '5px', width: '150px' }}
            value={threshold[0]}
            onChange={value =>
              dispatch({
                type: 'UPDATE_THRESHOLD',
                payload: [value, threshold[1]],
              })
            }
            min={0}
            max={255}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          最大值：
          <Slider
            style={{ marginLeft: '5px', width: '150px' }}
            value={threshold[1]}
            onChange={value =>
              dispatch({
                type: 'UPDATE_THRESHOLD',
                payload: [threshold[0], value],
              })
            }
            min={0}
            max={255}
          />
        </div>
      </>
    )
  if (currentShape === hitShapeTypes.TRAPATH && currentTraPathWay === traPathGenerateWay.CANNY)
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        阈值：
        <Slider
          style={{ width: '150px' }}
          min={0}
          max={255}
          range
          defaultValue={cannyThreshold}
          onChange={value =>
            dispatch({
              type: 'UPDATE_CANNYTHRESHOLD',
              payload: value,
            })
          }
        />
      </div>
    )
}

const generateSAMRectSegPath = async (setLoadingInfo, canvas, pathoImgInfo) => {
  console.log('SAM 框选')
  const matrix = fabric.util.invertTransform(canvas.viewportTransform)
  const _leftTopPoint = fabric.util.transformPoint({ x: 0, y: 0 }, matrix)
  const leftTopPoint = convertCanvasToImagePoint(_leftTopPoint, pathoImgInfo.size.width, 1000)
  const { project } = store.getState()
  const {
    projectDetails,
    currentHit,
    currentCanvas,
    projectHits,
    entityColorMap,
    currentEntity,
    pathoViewSize,
  } = project
  const fillColor = entityColorMap[currentEntity]
  let imgSrc = '/nfs3/yuxiaotian/HCC_data/HCC/4/201134349.mrxs'
  // if (imgSrc.indexOf('/uploads') !== -1) {
  //   imgSrc = '/uploads' + imgSrc.split('/uploads')[1]
  // }
  const region = [
    leftTopPoint.x,
    leftTopPoint.y,
    Number(pathoViewSize.width),
    Number(pathoViewSize.height),
  ]
  const box = [[5, 5, parseInt(pathoViewSize.width) - 5, parseInt(pathoViewSize.height) - 5]]
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

const convertImageToCanvas = (point, imageWidth, canvasScale) => {
  let _point = point
  _point[0] = (point[0] * imageWidth) / canvasScale
  _point[1] = (point[1] * imageWidth) / canvasScale
  return _point
}

const convertCanvasToImagePoint = (point, imageWidth, canvasScale) => {
  let _point = point
  console.log(_point)
  _point.x = _point.x / canvasScale
  _point.y = _point.y / canvasScale
  console.log(_point)

  _point.x = _point.x * imageWidth
  _point.y = _point.y * imageWidth
  console.log(_point)
  return _point
}

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

export default TopRightWidget
