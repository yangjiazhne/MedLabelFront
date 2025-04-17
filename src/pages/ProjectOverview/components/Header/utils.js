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
import { saveAs } from 'file-saver'
import { imgUploadPre, hitShapeTypes } from '@/constants'
import { downloadAnnotationByGroup } from '@/request/actions/annotation'
import { fetchImageSize, searchImage } from '@/request/actions/image'

// @ts-ignore
const fabric = window.fabric

// 资源下载
export const downloadFile = async (type, groupList) => {
  if (!type) return

  const { project } = store.getState()
  const { projectDetails } = project
  const annotationRes = await downloadAnnotationByGroup(groupList)

  const hitsResult = annotationRes.data
  // 存在服务器uploads文件夹中的标记项
  const resultExists = hasAnnotationResult(hitsResult);
  if (!resultExists && type!=='URL') {
    Modal.info({
      title: '注意',
      content: '没有完成的标记项，无法下载',
    })
    return
  }

  const transformedData = {};
  for (const [groupKey, images] of Object.entries(hitsResult)) {
    const groupName = groupKey.split('&&&')[1];
    transformedData[groupName] = [];

    for (const [imageKey, annotations] of Object.entries(images)) {
        const [imageOriginUrl, imageId] = imageKey.split('&&&');
        const imageName = imageOriginUrl.split('/').pop(); // 获取图片名称
        const imageUrl = `uploads/${projectDetails.projectId}/${imageId}.png`
        const annotationResults = annotations.map(annotation => ({
            annotationName: annotation.annotationName,
            annotationResult: JSON.parse(annotation.annotationResult).hitResults,
            customCategories: JSON.parse(annotation.annotationResult).customCategories
        }));

        if (annotationResults.length > 0) {
          transformedData[groupName].push({
              imageName: imageName,
              imageUrl: imageUrl,
              imageHash: imageId,
              annotations: annotationResults
          });
        }
    }
  }

  switch (type) {
    // 以zip格式下载标记信息及原图
    case 'ZIP':
      if(projectDetails.imageType.imageTypeId === 3){
        downloadMrxsByStreamNew(transformedData)
      }else{
        downloadByStreamNew(transformedData)
      }
      break
    // 以JSON格式下载标记信息
    case 'JSON':
      if(projectDetails.imageType.imageTypeId === 3){
        downloadMrxsWithJSON(transformedData)
      }else{
        downlaodWithJSON(transformedData)
      }
      break
    case 'URL':
      downlaodURLWithJSON(projectDetails.projectId, groupList)
      break
  }
}

const downlaodURLWithJSON = async(pId, groupList) => {
  const allResults = [];
  for (let i = 0; i < groupList.length; i++) {
    const result = await searchImage(groupList[i]);
    const dataRes = result.data.content
    // 提取dataRes 中的每个数据的 imageUrl，合并为一个列表
    const imageUrls = dataRes.map(item => `uploads/${pId}/${item.imageName}.png`);

    allResults.push({
      groupId: groupList[i],
      imageUrls,
    });
  }

  let jsonFileName = "imageUrl.json"  
  
  let fileToSave = new Blob([JSON.stringify(allResults, null, 4)], {
    type: 'application/json',
  })

  saveAs(fileToSave, jsonFileName)
}

const downloadMrxsWithJSON = async(finalDownloadHits) => {
  const { project } = store.getState()
  const { projectDetails } = project

  for (const group in finalDownloadHits) {
    for (const image of finalDownloadHits[group]) {
      const imageSize = await fetchImageSize(projectDetails.projectId, image.imageHash);
      const scale = imageSize.width / 1000;

      for (const annotation of image.annotations) {
        scaleAnnotations(annotation.annotationResult, scale);
      }
    }
  }

  let jsonFileName = `${projectDetails.projectName}.json`

  let fileToSave = new Blob([JSON.stringify(finalDownloadHits, null, 4)], {
    type: 'application/json',
  })

  saveAs(fileToSave, jsonFileName)
}

const downlaodWithJSON = finalDownloadHits => {
  const { project } = store.getState()
  const { projectDetails } = project

  let jsonFileName = `${projectDetails.projectName}.json`

  let fileToSave = new Blob([JSON.stringify(finalDownloadHits, null, 4)], {
    type: 'application/json',
  })

  saveAs(fileToSave, jsonFileName)
}

const drawObjectToCtx = (resultArr, customEntityColorMap, width, height) => {
  const { project } = store.getState()
  const { projectEntityColorMap, projectDetails } = project
  return new Promise(resolve => {
    const canvas = new fabric.Canvas('canvas', {
      backgroundColor: '#000000',
      width,
      height,
    })

    let fBoxes = resultArr.map((box, index) => {
      const color = projectEntityColorMap[box.label] || customEntityColorMap[box.label]

      switch (box.shape) {
        case hitShapeTypes.POINT:
          return new fabric.Circle({
            left: box.left,
            top: box.top,
            stroke: color,
            fill: color,
            radius: box.radius,
            scaleY: 1,
            scaleX: 1,
            strokeWidth: 1,
            erasable: false,
          })
        case hitShapeTypes.ELLIPSE:
          return new fabric.Ellipse({
            left: box.left,
            top: box.top,
            stroke: color,
            fill: false,
            rx: box.rx,
            ry: box.ry,
            strokeWidth: projectDetails.imageType.imageTypeId === 3 ? box.strokeWidth : 2,
            erasable: false,
          })
        case hitShapeTypes.RECT:
          return new fabric.Rect({
            left: box.points[0][0],
            top: box.points[0][1],
            width: box.points[2][0] - box.points[0][0],
            height: box.points[2][1] - box.points[0][1],
            fill: false,
            stroke: color,
            strokeWidth: projectDetails.imageType.imageTypeId === 3 ? box.strokeWidth : 2,
          })
        case hitShapeTypes.POLYGON:
        case hitShapeTypes.POLYGONPATH:
          return new fabric.Polygon(
            box.points.map(point => ({ x: point[0], y: point[1] })),
            {
              stroke: color,
              strokeWidth: projectDetails.imageType.imageTypeId === 3 ? box.strokeWidth : 2,
              fill: false,
            }
          )
      }
    })

    fabric.util.enlivenObjects(fBoxes, function (objects) {
      console.log(objects)
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

const mrxsToBlobNew = async (annotationList) => {
  const { project } = store.getState();
  const { projectDetails } = project;

  const results = await Promise.all(
    Object.entries(annotationList).map(async ([groupKey, group]) => {
      return Promise.all(
        group.map(async (img) => {
          const imageSize = await fetchImageSize(projectDetails.projectId, img.imageHash);
          const scale = imageSize.width / 1000;
          const canvasWidth = 1000;
          const canvasHeight = (imageSize.height / imageSize.width) * canvasWidth;

          const labelBlobs = await Promise.all(
            img.annotations.map(async (annotation) => {
              const customEntityColorMap = annotation.customCategories.reduce((acc, item) => {
                acc[item.entity] = item.color;
                return acc;
              }, {});
              const labelImg = await drawObjectToCtx(annotation.annotationResult, customEntityColorMap, canvasWidth, canvasHeight);
              const labelCanvas = document.createElement('canvas');
              labelCanvas.width = canvasWidth;
              labelCanvas.height = canvasHeight;
              labelCanvas.getContext('2d').drawImage(labelImg, -1, -1, canvasWidth, canvasHeight);
              const taggerName = `${annotation.annotationName}_label.png`;

              return {
                labelFileName: taggerName,
                labelBlobContent: await getCanvasBlob(labelCanvas),
              };
            })
          );

          img.annotations.map(annotation => {
            scaleAnnotations(annotation.annotationResult, scale);
          })

          return {
            imgFileName: img.imageName,
            jsonFileName: img.imageName.split('.png')[0] + '.json',
            jsonBlobContent: new Blob([JSON.stringify(img.annotations, null, 4)], { type: 'application/json' }),
            labelBlobs,
            groupName: groupKey,
          };
        })
      );
    })
  );

  return results;
};


const imageToBlobNew = annotationList => {
  return Object.entries(annotationList).map(([groupKey, group]) => {
    return group.map(img => {
      return new Promise(async (resolve, reject) => {
        const imgObj = new Image();
        imgObj.src = img.imageUrl;
        imgObj.crossOrigin = 'anonymous';

        imgObj.onload = async () => {
          const imgCanvas = document.createElement('canvas');
          imgCanvas.width = imgObj.naturalWidth;
          imgCanvas.height = imgObj.naturalHeight;
          imgCanvas.getContext('2d').drawImage(imgObj, 0, 0, imgObj.naturalWidth, imgObj.naturalHeight);
          const imgName = img.imageName.split('.png')[0] + '_image.png';

          const labelBlobs = await Promise.all(img.annotations.map(async (annotation, index) => {
            const customEntityColorMap = annotation.customCategories.reduce((acc, item) => {
              acc[item.entity] = item.color;
              return acc;
            }, {});
            const labelImg = await drawObjectToCtx(annotation.annotationResult, customEntityColorMap, imgObj.naturalWidth, imgObj.naturalHeight);
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = imgObj.naturalWidth;
            labelCanvas.height = imgObj.naturalHeight;
            labelCanvas.getContext('2d').drawImage(labelImg, -1, -1, imgObj.naturalWidth, imgObj.naturalHeight);
            const taggerName = `${annotation.annotationName}_label.png`;

            return {
              labelFileName: taggerName,
              labelBlobContent: await getCanvasBlob(labelCanvas),
            };
          }));

          resolve({
            imgFileName: imgName,
            imgBlobContent: await getCanvasBlob(imgCanvas),
            jsonFileName: img.imageName.split('.png')[0] + '.json',
            jsonBlobContent: new Blob([JSON.stringify(img.annotations, null, 4)], { type: 'application/json' }),
            labelBlobs, // 包含所有labelCanvas的Blob
            groupName: groupKey, // 保存组名称
          });
        };

        imgObj.onerror = () => {
          reject('图片加载失败');
        };
      });
    });
  });
};

const downloadByStreamNew = async (annotationList) => {
  const imgsPromise = await imageToBlobNew(annotationList);
  const files = await Promise.all(imgsPromise.flat()); // 扁平化
  let fileOptions = [];
  files.forEach((file, index) => {
    const groupName = file.groupName; // 获取组名称

    fileOptions.push({
      name: `${groupName}/image/${index}_${file.imgFileName}`,
      content: file.imgBlobContent,
    });
    fileOptions.push({
      name: `${groupName}/json/${index}_${file.jsonFileName}`,
      content: file.jsonBlobContent,
    });
    console.log(file.labelBlobs)
    file.labelBlobs.map((labelBlob) => {
      fileOptions.push({
        name: `${groupName}/label/${index}_${file.imgFileName.slice(0, -10)}/${labelBlob.labelFileName}`,
        content: labelBlob.labelBlobContent,
      });
    });
  })

  writerAsZipNew('photo', fileOptions)
  .then(() => {
    console.log('下载成功');
  })
  .catch(err => {
    console.error('下载失败', err);
  });
};

const downloadMrxsByStreamNew = async annotationList => {
  const imgsPromise = await mrxsToBlobNew(annotationList);
  const files = await Promise.all(imgsPromise.flat()); // 扁平化
  let fileOptions = [];
  files.forEach((file, index) => {
    const groupName = file.groupName; // 获取组名称

    fileOptions.push({
      name: `${groupName}/json/${index}_${file.jsonFileName}`,
      content: file.jsonBlobContent,
    });
    console.log(file.labelBlobs)
    file.labelBlobs.map((labelBlob) => {
      fileOptions.push({
        name: `${groupName}/label/${index}_${file.imgFileName}/${labelBlob.labelFileName}`,
        content: labelBlob.labelBlobContent,
      });
    });
  })

  writerAsZipNew('photo', fileOptions)
  .then(() => {
    console.log('下载成功');
  })
  .catch(err => {
    console.error('下载失败', err);
  });
}


const writerAsZipNew = (zipName, fileOptions) => {
  return new Promise((resolve, reject) => {
    const fileStream = streamSaver.createWriteStream(`${zipName}.zip`);
    const files = fileOptions.map(fileOption => {
      return {
        name: fileOption.name, // 使用传入的文件名
        stream: () => fileOption.content.stream(),
      };
    });

    // @ts-ignore 
    const readableZipStream = new window.ZIP({
      start(ctrl) {
        files.forEach(file => ctrl.enqueue(file));
        ctrl.close();
      },
    });

    if (window.WritableStream && readableZipStream.pipeTo) {
      return readableZipStream.pipeTo(fileStream).then(resolve, reject);
    }

    reject(new Error('WritableStream not supported'));
  });
};

// 将病理图坐标转化到原图像素
const scaleAnnotations = (annotations, scale) => {
  annotations.forEach(annotation => {
    switch (annotation.shape) {
      case hitShapeTypes.RECT:
      case hitShapeTypes.POLYGON:
      case hitShapeTypes.POLYGONPATH:
        annotation.points = annotation.points.map(point => [
          point[0] * scale,
          point[1] * scale,
        ]);
        break;

      case hitShapeTypes.POINT:
        annotation.left *= scale;
        annotation.top *= scale;
        annotation.radius *= scale;
        break;

      case hitShapeTypes.ELLIPSE:
        annotation.left *= scale;
        annotation.top *= scale;
        annotation.rx *= scale;
        annotation.ry *= scale;
        break;

      default:
        break; // 如果没有匹配的形状，保持不变
    }
  });
};

const hasAnnotationResult = (data) => {
  for (const group in data) {
      for (const file in data[group]) {
          const annotations = data[group][file];
          
          // 检查每个注释项是否有 annotationResult
          if (annotations.some(annotation => annotation.annotationResult)) {
              return true; // 存在
          }
      }
  }
  return false; // 不存在
};