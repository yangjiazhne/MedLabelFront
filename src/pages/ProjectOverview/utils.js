/*
 * @Author: Azhou
 * @Date: 2021-07-06 09:33:14
 * @LastEditors: Azhou
 * @LastEditTime: 2021-09-24 09:35:03
 */
import { Modal, message } from 'antd'
import streamSaver from 'streamsaver'
import store from '@/redux/store'
import '@/lib/fabric/fabric'
import '@/lib/zip/zip-stream'
import { hexToRgba } from '@/helpers/Utils'
// import { fetchProjectHits, fetchPathoProjectHits } from '@/request/actions/project'
import { saveAs } from 'file-saver'
import { imgUploadPre } from '@/constants'

// @ts-ignore
const fabric = window.fabric

// 资源下载
export const downloadFile = async type => {
  if (!type) return

  const { project } = store.getState()
  const { projectDetails } = project
  let hitsRes = {}
  // 获取项目标记信息
  // if (projectDetails.imageType === 'mrxs') {
  //   hitsRes = await fetchPathoProjectHits(projectDetails.id, {
  //     model: 'human-annotation',
  //     hitStatus: 'done',
  //     hitResultStatus: 'done',
  //   })
  // } else {
  //   hitsRes = await fetchProjectHits(projectDetails.id, {
  //     status: 'done',
  //     start: 0,
  //     count: projectDetails.totalHits,
  //   })
  // }
  const hits = hitsRes.data.hits
  // 状态为done的标记项
  if (!hits?.length) {
    Modal.info({
      title: '注意',
      content: '没有完成的标记项，无法下载',
    })
    return
  }
  // 存在服务器uploads文件夹中的标记项
  const isUploadHits = hits.filter(v => v.data.indexOf('/uploads') !== -1)
  if (!isUploadHits?.length) {
    Modal.info({
      title: '注意',
      content: '没有上传过的标记项，无法下载',
    })
    return
  }
  // 转换hit result
  const finalDownloadHits = isUploadHits.map(item => {
    const resultArr = item.hitResults[0]?.result
    return { ...item, finalHitResults: resultArr }
  })

  switch (type) {
    // 以zip格式下载标记信息及原图
    case 'zip':
      if(projectDetails.imageType === 'mrxs'){
        downloadMrxsByStream(finalDownloadHits)
      }else{
        downloadByStream(finalDownloadHits)
      }
      break
    // 以JSON格式下载标记信息
    case 'JSON':
      if(projectDetails.imageType === 'mrxs'){
        downloadMrxsWithJSON(finalDownloadHits)
      }else{
        downlaodWithJSON(finalDownloadHits)
      }
      break
  }
}

const downloadMrxsWithJSON = finalDownloadHits => {
  const { project } = store.getState()
  const { pathoImgInfo } = project
  const scale = pathoImgInfo.size.width / 1000
  console.log(scale)

  const jsonInfo = finalDownloadHits.map(hit => {
    let splitData = hit.data.split(imgUploadPre)[1].split('/')
    let fileName = splitData[splitData.length - 1]
    if (fileName.includes('___')) fileName = fileName.split('___')[1]
    if (fileName.includes('.thumbnail')) fileName = fileName.split('.thumbnail')[0]

    scalePoints(hit, scale);

    return {
      dataUrl: hit.data.split(imgUploadPre)[1],
      fileName: fileName,
      hitResults: hit.hitResults,
    }
  })

  let jsonFileName = 'tagInfo.json'

  let fileToSave = new Blob([JSON.stringify(jsonInfo, null, 4)], {
    type: 'application/json',
  })

  saveAs(fileToSave, jsonFileName)
}

const downlaodWithJSON = finalDownloadHits => {
  const jsonInfo = finalDownloadHits.map(hit => {
    let splitData = hit.data.split(imgUploadPre)[1].split('/')
    let fileName = splitData[splitData.length - 1]
    if (fileName.includes('___')) fileName = fileName.split('___')[1]
    if (fileName.includes('.thumbnail')) fileName = fileName.split('.thumbnail')[0]
    return {
      dataUrl: hit.data.split(imgUploadPre)[1],
      fileName: fileName,
      hitResults: hit.hitResults,
    }
  })
  console.log(jsonInfo)
  let jsonFileName = 'tagInfo.json'

  let fileToSave = new Blob([JSON.stringify(jsonInfo, null, 4)], {
    type: 'application/json',
  })

  saveAs(fileToSave, jsonFileName)
}

const downloadMrxsByStream = async imgList => {
  const imgsPromise = mrxsToBlob(imgList)

  Promise.all(imgsPromise).then(files => {
    let fileOptions = []
    files.forEach((file, index) => {
      fileOptions.push({
        name: `label/${index}_${file.labelFileName}`,
        content: file.labelBlobContent,
      })
      fileOptions.push({
        name: `json/${index}_${file.jsonFileName}`,
        content: file.jsonBlobContent,
      })
    })
    writerAsZip('photo', fileOptions)
      .then(() => {
        console.log('下载成功')
        // TODO 下载成功 继续做你想做的事情吧
      })
      .catch(err => {
        // TODO 下载失败
      })
  })
}

// streamSaver 保存zip，zip大小无限制
const downloadByStream = async imgList => {
  const imgsPromise = imageToBlob(imgList)

  Promise.all(imgsPromise).then(files => {
    let fileOptions = []
    files.forEach((file, index) => {
      fileOptions.push({
        name: `image/${index}_${file.imgFileName}`,
        content: file.imgBlobContent,
      })
      fileOptions.push({
        name: `label/${index}_${file.labelFileName}`,
        content: file.labelBlobContent,
      })
      fileOptions.push({
        name: `json/${index}_${file.jsonFileName}`,
        content: file.jsonBlobContent,
      })
    })
    writerAsZip('photo', fileOptions)
      .then(() => {
        console.log('下载成功')
        // TODO 下载成功 继续做你想做的事情吧
      })
      .catch(err => {
        // TODO 下载失败
      })
  })
}

const drawObjectToCtx = (resultArr, width, height) => {
  const { project } = store.getState()
  const { entityColorMap, projectDetails } = project
  return new Promise(resolve => {
    const canvas = new fabric.Canvas('canvas', {
      backgroundColor: '#000000',
      width,
      height,
    })

    let fBoxes = resultArr.map((box, index) => {
      const color = entityColorMap[box.label[0]]
      switch (box.type) {
                case 'circle':
          return new fabric.Circle({
            left: box.points[0][0],
            top: box.points[0][1],
            stroke: color,
            fill: color,
            radius: projectDetails.imageType === 'mrxs' ? box.radius : 1,
            scaleY: 1,
            scaleX: 1,
            strokeWidth: 1,
            erasable: false,
          })
        case 'rect':
          return new fabric.Rect({
            left: box.points[0][0],
            top: box.points[0][1],
            width: box.points[2][0] - box.points[0][0],
            height: box.points[2][1] - box.points[0][1],
            fill: undefined,
            stroke: color,
            strokeWidth: projectDetails.imageType === 'mrxs' ? box.strokeWidth : 1,
          })
        case 'polygon':
          return new fabric.Polygon(
            box.points.map(point => ({ x: point[0], y: point[1] })),
            {
              stroke: color,
              strokeWidth: projectDetails.imageType === 'mrxs' ? box.strokeWidth : 1,
              fill: color,
            }
          )
        case 'path':
          return new fabric.Path(box.points, {
            fill: color,
            strokeWidth: projectDetails.imageType === 'mrxs' ? box.strokeWidth : 1,
            stroke: color,
          })
        case 'asm_path':
          return new fabric.Path(box.path, {
            fill: color,
            strokeWidth: projectDetails.imageType === 'mrxs' ? box.strokeWidth : 1,
            stroke: color,
          })
      }
    })

    fabric.util.enlivenObjects(fBoxes, function (objects) {
      var origRenderOnAddRemove = canvas.renderOnAddRemove
      canvas.renderOnAddRemove = false

      objects.forEach(function (o) {
        canvas.add(o)
      })

      canvas.renderOnAddRemove = origRenderOnAddRemove
      canvas.renderAll()
      // canvas.getElement().toBlob(function (blob) {
      //   resolve(blob)
      // })
      const dataURL = canvas.toCanvasElement(1, {
        width: canvas.width,
        height: canvas.height,
        left: 0,
        top: 0,
      })
      resolve(dataURL)
    })
  })
}

/**
 * 将多个文件写进压缩包
 * @param zipName zip文件名，不带文件后缀名
 * @param fileOptions 文件配置集合，数据格式 [{name: '文件名，可以带路径', content: '文件内容'}]
 * @returns 返回promise对象
 */
const writerAsZip = (zipName, fileOptions) => {
  return new Promise((resolve, reject) => {
    const fileStream = streamSaver.createWriteStream(`${zipName}.zip`)
    const files = fileOptions.map(fileOption => {
      return {
        name: `${fileOption.name}`,
        stream: () => fileOption.content.stream(),
      }
    })
    // @ts-ignore
    const readableZipStream = new window.ZIP({
      start(ctrl) {
        files.forEach(file => ctrl.enqueue(file))
        ctrl.close()
      },
    })
    if (window.WritableStream && readableZipStream.pipeTo) {
      return readableZipStream.pipeTo(fileStream).then(resolve, reject)
    }

    reject()
  })
}

const getCanvasBlob = canvas => {
  var binStr = atob(canvas.toDataURL('image/png', 1).split(',')[1]),
    len = binStr.length,
    arr = new Uint8Array(len)

  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i)
  }
  return new Blob([arr], { type: 'image/png' })
}

/**
 * 获取病理图的Blob对象
 * @param imgList 图片地址数组
 * @returns 返回promise数组
 */
const mrxsToBlob = imgList => {
  const { project } = store.getState()
  const { projectDetails, pathoImgInfo } = project
  const scale = pathoImgInfo.size.width / 1000
  return imgList.map(img => {
    return new Promise(async (resolve, reject) => {
      const canvasWidth = 1000
      const canvasHeight = (pathoImgInfo.size.height / pathoImgInfo.size.width) * canvasWidth
      const labelImg = await drawObjectToCtx(
        img.finalHitResults,
        canvasWidth,
        canvasHeight
      )
      const labelCanvas = document.createElement('canvas') //准备空画布
      labelCanvas.width = canvasWidth
      labelCanvas.height = canvasHeight
      labelCanvas
        .getContext('2d')
        .drawImage(labelImg, -1, -1, canvasWidth, canvasHeight)
      const taggerName = projectDetails.name.split('.')[0] + '.label.png'
      
      scalePoints(img, scale)

      resolve({
        labelFileName: taggerName,
        labelBlobContent: getCanvasBlob(labelCanvas),
        jsonFileName: projectDetails.name.split('.')[0] + '.json',
        jsonBlobContent: new Blob([JSON.stringify(img.finalHitResults)], { type: 'text/plain' }),
      })
    })
  })
}

/**
 * 获取图片的Blob对象
 * @param imgList 图片地址数组
 * @returns 返回promise数组
 */
const imageToBlob = imgList => {
  return imgList.map(img => {
    return new Promise((resolve, reject) => {
      const imgObj = new Image()
      // 这里的data都是缩略图，转blob时需用原图
      const TAIL = 'thumbnail.jpg'

      imgObj.src = img.data.split(TAIL)[0].slice(0, -1)
      // 需要图片源允许跨域
      imgObj.crossOrigin = 'anonymous'
      imgObj.onload = async () => {
        // 制作标记信息到label
        const labelImg = await drawObjectToCtx(
          img.finalHitResults,
          imgObj.naturalWidth,
          imgObj.naturalHeight
        )
        const labelCanvas = document.createElement('canvas') //准备空画布
        labelCanvas.width = imgObj.naturalWidth
        labelCanvas.height = imgObj.naturalHeight
        labelCanvas
          .getContext('2d')
          .drawImage(labelImg, -1, -1, imgObj.naturalWidth, imgObj.naturalHeight)
        const taggerName = img.fileName.split('.')[0] + '.label.png'

        // 使用canvas获取图片的base64数据，制作原图到image
        const imgCanvas = document.createElement('canvas') //准备空画布
        imgCanvas.width = imgObj.naturalWidth
        imgCanvas.height = imgObj.naturalHeight
        imgCanvas
          .getContext('2d')
          .drawImage(imgObj, 0, 0, imgObj.naturalWidth, imgObj.naturalHeight)
        const imgName = img.fileName.split('.')[0] + '.image.png'

        resolve({
          labelFileName: taggerName,
          labelBlobContent: getCanvasBlob(labelCanvas),
          imgFileName: imgName,
          imgBlobContent: getCanvasBlob(imgCanvas),
          jsonFileName: img.fileName.split('.')[0] + '.json',
          jsonBlobContent: new Blob([JSON.stringify(img.finalHitResults)], { type: 'text/plain' }),
        })
      }
      imgObj.onerror = function () {
        reject('图片加载失败')
      }
    })
  })
}

// 将病理图坐标转化到原图像素
function scalePoints(data, scaleFactor) {
    data.hitResults.forEach(hitResult => {
        hitResult.result.forEach(shape => {
            shape.points = shape.points.map(point => {
                if (Array.isArray(point)) {
                    // polygon, rect, and point
                    return point.map(coord => typeof coord === 'number' ? coord * scaleFactor : coord);
                }
                // path "M", "L", "Q"
                return point.map((coord, index) => {
                    return typeof coord === 'number' ? coord * scaleFactor : coord;
                });
            });
        });
    });
}