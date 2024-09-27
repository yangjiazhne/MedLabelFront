import store from '@/redux/store'
import '@/lib/fabric/fabric'
import { hitShapeTypes } from '@/constants'
import { hexToRgba } from '@/helpers/Utils'
// @ts-ignore
const fabric = window.fabric

export const renderModelInfer = (inferRes) => {
    if(inferRes.length === 0) return
    const { project } = store.getState()
    const { projectDetails, currentHit, currentCanvas, entityColorMap, currentEntity } = project

    inferRes?.map((box, index)=>{
      box.label = box.label || null
      const color = entityColorMap[box.label] || '#000000'
      const id = box.id

      switch(box.shape){
        case hitShapeTypes.RECT:{
          const _rect = new fabric.Rect({
            id: id || Date.now(),
            left: box.points[0][0],
            top: box.points[0][1],
            width: box.points[2][0] - box.points[0][0],
            height: box.points[2][1] - box.points[0][1],
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
          currentCanvas.add(_path)
          break
        }
      }
    })

}