// 临时测试用projectId: ff8081818dfe6c76018e227861da0027

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'

import { hitShapeTypes, contorlTypes, SERVER_WS } from '@/constants'
import { Empty,message,Modal,Spin,Divider,Popover,Button,Progress,Form,Input } from 'antd'
import { HomeOutlined, LeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import useDidUpdateEffect from '@/hooks/useDidUpdateEffect'
import useQuery from '@/hooks/useQuery'
import { searchGroup } from '@/request/actions/group'
import { searchImage, fetchImageTileInfo } from '@/request/actions/image'
import { createAnnotation, searchAnnotation, updateAnnotation } from '@/request/actions/annotation'
import { searchProject } from '@/request/actions/project'
import { getTaskList } from '@/request/actions/task'
import { getCurrentResult, handleKeyDown, renderModelInfer } from './help'
import styles from './PathoTaggerSpace.module.scss'
import { RightBar, CanvasAnnotator, DoneTopBar, SliceList, AnnotionList } from './components'
import { VButton, VIcon } from '@/components'
import { Stomp, Client } from '@stomp/stompjs';
import { getToken } from '@/helpers/dthelper'

const { TextArea } = Input;

const UpdateDoneModal = ({ open, onCreate, onCancel, title, okText, annotion}) => {
  const [form] = Form.useForm();
  const userDetail = window.sessionStorage.getItem('userDetail');
  const username = userDetail ? JSON.parse(userDetail).username : null;

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="取消"
      onCancel={onCancel}
      destroyOnClose
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onCreate(values);
            form.resetFields();
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          annotationName: annotion?.annotationName ? annotion.annotationName : 'annotion',
          annotatedBy: annotion?.annotatedBy ? annotion.annotatedBy : username,
          description: annotion?.description ? annotion.description : ''
        }}
      >
        <Form.Item
          name="annotationName"
          label="标注文件名称"
          rules={[
            {
              required: true,
              message: '请输入标注文件名称!',
            },
          ]}
        >
          <Input placeholder="请输入标注文件名称"/>
        </Form.Item>
        <Form.Item
          label="标注用户"
          name="annotatedBy"
        >
          <Input placeholder="请输入标注用户名称"/>
        </Form.Item>
        <Form.Item 
          name="description" 
          label="标注文件描述（可选）">
          <TextArea placeholder="请输入标注文件描述"/>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const PathoTaggerSpace = () => {
  let queryInfo = useQuery()
  const dispatch = useDispatch()
  let history = useHistory()
  const {
    projectDetails, //项目详情
    currentGroupImages, // 当前组的图像
    pathoImgInfo, // 病理图片信息
    currentImage, //当前标记项
    currentCanvas, //当前画布canvas
    classifyInfo, //当前标记项的classification分类信息
    currentImgSize, //当前标记图片的大小
    currentViewer,  
    currentAnnotion,  // 当前标记
    currentGroup,  // 当前组
    customEntities, // 自定义类别
    pathoViewSize, //当前标记图片的视窗大小
  } = useSelector(
    // @ts-ignore
    state => state.project
  )
  // @ts-ignore
  let { projectId } = useParams()
  const currentProjectPid = projectId
  const [projectHitsFetchEnd, setProjectHitsFetchEnd] = useState(false) // 项目标记信息获取完成标记
  const [loading, setLoading] = useState(false) // 加载状态
  const [changeSession, setChangeSession] = useState(false) // 是否有未保存的标记信息
  // const [isEdit, setIsEdit] = useState(false) // 是否是编辑状态 用于判断是否显示保存按钮 保存按钮只有在编辑状态下显示 且只有在notDone状态下显示 且只有在notDone状态下点击保存按钮才会保存 保存后状态变为done 且不再显示保存按钮 且不再是编辑状态 且不再显示编辑按钮 且不再显示标记信息
  const [modelInferList, setModelInferList] = useState([]) // 模型推理结果列表

  const [selectedModels, setSelectedModels] = useState([]) // 选择的模型
  const [isCheckedNone, setIsCheckedNone] = useState(false) // 是否选择了无
  const [filterValue, setFilterValue] = useState({
    status: '',
    model: '',
  }) // 过滤条件

  const [isUpdateDoneModalOpen, setIsUpdateDoneModalOpen] = useState(false)

  const [showTagBox, setShowTagBox] = useState(true)
  const [showSliceList, setShowSliceList] = useState(false)
  const [showMoreList, setShowMoreList] = useState(false)
  const [showSliceInfoBox, setShowSliceInfoBox] = useState(false)
  const [showAnnotionList, setShowAnnotionList] = useState(false)

  const [searchValue, setSearchValue] = useState('')  //搜索框
  const [currentPage, setCurrentPage] = useState(1)   //控制当前页数
  const [currentPageSize, setCurrentPageSize] = useState(8)   //每页显示数据集个数

  const [progress, setProgress] = useState(0);  //数据集转化进度

  const currentInferPaths = useRef([]) // 当前的模型推理结果，临时存储，每次返回时都要先清空上一次的所有路径

  const [updateReady, setUpdateReady] = useState(1)

  //获取所有需要的项目信息
  const fetchData = async (currentImageId, currentGroupId) => {
    if (!filterValue.status) return
    if(currentProjectPid) {
      setLoading(true)

      // 获取数据集详情
      const projectRes = await searchProject(currentProjectPid)
      if(!projectRes.data){
        Modal.error({
          title: '提示',
          content: '您的登录已过期，请重新登陆',
          onOk: () => {
            dispatch({
              type: 'UPDATE_USER_LOGIN',
              payload: false,
            })
            window.location.href = "/#/entryPage";
            window.sessionStorage.clear()
          }
        })
        return
      }
      
      dispatch({
        type: 'UPDATE_PROJECT_DETAIL',
        payload: projectRes.data.content[0],
      })

      // 处理标签信息
      dispatch({
        type: 'UPDATE_PROJECDT_ENTITY',
        payload: JSON.parse(projectRes.data.content[0].categories)
      })

      // 获取当前页分组
      const page = currentPage - 1
      const size = currentPageSize
      const projectGroupsRes= await searchGroup(currentProjectPid,null,null,null,page,size)
      dispatch({
        type: 'UPDATE_CURRENT_PROJECT_GROUPS',
        payload: projectGroupsRes.data.content,
      })
      const totalpages = Math.floor(projectGroupsRes.data.totalElements / currentPageSize) + 1
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_LENGTH',
        payload: totalpages,
      })

      // 获取当前分组详情
      let groupRes
      if(currentGroupId){
        const _groupRes = await searchGroup(undefined, currentGroupId)
        groupRes = _groupRes.data.content[0]
      }else{
        groupRes = projectGroupsRes.data.content[0]
      }
      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: groupRes,
      })

      // 获取当前分组下的所有图像
      const groupImageRes = await searchImage(groupRes.imageGroupId)
      const formatImages = groupImageRes.data.content
      // const formatImages = groupImageRes.data.content.map(item => ({
      //   ...item,
      //   imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
      //   imageUrl: `/uploads/${projectId}/${item.imageName}/deepzoom/imgs/10/0_0.jpeg`
      // }))
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: formatImages
      })

      // 获取当前图像
      let imageRes
      if(currentImageId){
        imageRes = formatImages.find(image => image.imageId === Number(currentImageId))
      }else{
        imageRes = formatImages? formatImages[0] : null
      }

      dispatch({
        type: 'UPDATE_CURRENT_IMAGE',
        payload: { ...imageRes }
      })

      //获取病理图信息
      try{
        const pathoImageInfo = await fetchImageTileInfo(projectId,imageRes.imageName)
        dispatch({
          type: 'UPDATE_PATHOIMGINFO',
          payload: {...pathoImageInfo},
        })
      }catch (error) {
        dispatch({
          type: 'UPDATE_PATHOIMGINFO',
          payload: {
            url: '',
            overlap: '',
            tileSize: '',
            format: '',
            size: {
              width: 0,
              height: 0,
            },
          }
        })
      }

      setProjectHitsFetchEnd(true)

      // 设置标注页面初始状态
      dispatch({
        type: 'UPDATE_CURRENT_CONTROL_TYPE',
        payload: 'drag',
      })

      setLoading(false)
    }
  }

  const refreshImage = async () => {
    const image = currentImage
    image.status = 2

    dispatch({
      type: 'UPDATE_CURRENT_IMAGE',
      payload: {...image},
    })

    const _image = currentGroupImages.find(p => p.imageId === currentImage.imageId);
    if (_image) {
      _image.status = 2;
    }

    const pathoImageInfo = await fetchImageTileInfo(projectId, image.imageName)
    dispatch({
        type: 'UPDATE_PATHOIMGINFO',
        payload: pathoImageInfo,
    })
  }

  const fetchMetaDataXML = async (image) => {
    try{
      const pathoImageInfo = await fetchImageTileInfo(projectId, image.imageName)
      dispatch({
        type: 'UPDATE_PATHOIMGINFO',
        payload: pathoImageInfo,
      })
    }catch (error) {
      console.log(error)
    }
  }

  useDidUpdateEffect(() => {
    if(pathoImgInfo.url === ''){
      fetchMetaDataXML(currentImage)
    }
  },[progress])

  useEffect(() => {
    if(currentImage?.status === 0 || currentImage?.status === 1){
      setProgress(0)
      const userToken = getToken()

      const stompClient = Stomp.over(function () {
        return new WebSocket((`${SERVER_WS}task-progress?token=${encodeURIComponent(userToken)}`))
      })

      // stompClient.debug = () => {}   //让控制台不输出多余的调试信息

      let subscription;
      
      const taskId = `medlabel_dev_image_convert_${currentImage.imageId}`

      // 连接到 WebSocket 服务器
      stompClient.connect({}, frame => {
        // 订阅特定任务的进度
        subscription = stompClient.subscribe(`/topic/task_progress/${taskId}`, message => {
          const data = JSON.parse(message.body);
          console.log(data)
          setProgress(Math.round(data.progress * 100))
          if(data.result !== ''){
            refreshImage()
          }
        });
      }, error => {
        console.error('WebSocket connection error:', error);
      });

      // 清理函数
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
        if (stompClient) {
          stompClient.disconnect();
        }
      }
    }
  }, [currentImage])

  // const fetchData = async () => {
  //   if (!filterValue.status) return

  //   if (currentProjectPid) {
  //     setLoading(true)
  //     // 获取项目基本信息
  //     const detailRes = await fetchProjectDetail(currentProjectPid)

  //     await dispatch({
  //       type: 'UPDATE_PROJECT_DETAIL',
  //       payload: detailRes.data,
  //     })

  //     var hitsData = await fetchPathoProjectHits(currentProjectPid, {
  //       model: 'human-annotation',
  //       hitStatus: 'notDone',
  //       hitResultStatus: 'notDone',
  //     })
  //     // 临时修改为按照done重新获取，后面要修改这个接口的后端，如果status是‘any’就无论是done还是notDone都能获取
  //     if (hitsData.data.hits.length === 0) {
  //       hitsData = await fetchPathoProjectHits(currentProjectPid, {
  //         model: 'human-annotation',
  //         hitStatus: 'done',
  //         hitResultStatus: 'done',
  //       })
  //     }
  //     hitsData = hitsData.data.hits

  //     setProjectHitsFetchEnd(true)

  //     let _boundingBoxMap
  //     if (hitsData && hitsData[0] && hitsData[0].hitResults && hitsData[0].hitResults.length > 0) {
  //       if (typeof hitsData[0].hitResults[0].result == 'string') {
  //         _boundingBoxMap = JSON.parse(hitsData[0].hitResults[0].result)
  //       } else {
  //         _boundingBoxMap = hitsData[0].hitResults[0].result
  //       }
  //       await dispatch({
  //         type: 'UPDATE_BOUNDING_BOX_MAP',
  //         payload: _boundingBoxMap,
  //       })
  //     }

  //     dispatch({
  //       type: 'UPDATE_PROJECT_HITS',
  //       // payload: getHits(hitsData, filterValue),
  //       payload: hitsData,
  //     })

  //     // 获取病理图信息
  //     let pathoImageInfo = await getPathoImgInfo(currentProjectPid)

  //     pathoImageInfo = {
  //       url: `${hitsData[0]?.data}/images/`,
  //       overlap: pathoImageInfo.data.Overlap,
  //       tileSize: pathoImageInfo.data.TileSize,
  //       format: pathoImageInfo.data.Format.toLowerCase(),
  //       size: {
  //         width: pathoImageInfo.data.Size.Width,
  //         height: pathoImageInfo.data.Size.Height,
  //       },
  //     }

  //     dispatch({
  //       type: 'UPDATE_PATHOIMGINFO',
  //       payload: pathoImageInfo,
  //     })

  //     // 设置标注页面初始状态
  //     dispatch({
  //       type: 'UPDATE_CURRENT_CONTROL_TYPE',
  //       payload: 'drag',
  //     })

  //     if (filterValue.status === 'done' && !isEdit) {
  //       dispatch({
  //         type: 'UPDATE_CURRENT_ENTITY',
  //         payload: '',
  //       })
  //     }

  //     // 获取该数据集模型信息
  //     fetchInferModel(currentProjectPid)

  //     setLoading(false)
  //   }
  // }

  // const fetchInferModel = async pid => {
  //   const taskRes = await getTaskList()
  //   if (!taskRes.err) {
  //     const newTaskList = Object.keys(taskRes.data).map(item => ({
  //       ...taskRes.data[item],
  //     }))
  //     const filteredList = newTaskList.filter(
  //       item => item.projectId === pid && item.Status === '推理完成'
  //     )
  //     const modelNamesSet = new Set(filteredList.map(item => item.modelName))
  //     const modelNames = Array.from(modelNamesSet)
  //     setModelInferList(modelNames)
  //   }
  // }

  const fetchGroupData = async() => {
    if(!loading){
      const page = currentPage - 1
      const size = currentPageSize
  
      // 获取项目当前分页的组
      const projectGroupsRes= await searchGroup(currentProjectPid,null,searchValue,null,page,size)
      dispatch({
        type: 'UPDATE_CURRENT_PROJECT_GROUPS',
        payload: projectGroupsRes.data.content,
      })
    }
  }

  //切换搜索词时，页数重置为1
  useDidUpdateEffect(() => {
    if (currentPage !== 1) setCurrentPage(1)
    else fetchGroupData()
  }, [searchValue])

  useDidUpdateEffect(() => {
    fetchGroupData()
  }, [currentPage, currentPageSize])

  useEffect(() => {
    if(showSliceList){
      setShowTagBox(false)
      setShowMoreList(false)
      setShowSliceInfoBox(false)
      setShowAnnotionList(false)
    }
  },[showSliceList])

  useEffect(() => {
    if(showTagBox){
      setShowSliceList(false)
      setShowMoreList(false)
      setShowSliceInfoBox(false)
      setShowAnnotionList(false)
    }else{
      dispatch({
        type: 'UPDATE_CURRENT_CONTROL_TYPE',
        payload: contorlTypes.DRAG,
      })
      dispatch({
        type: 'UPDATE_CURRENT_SHAPE',
        payload: hitShapeTypes.NONE,
      })
    }
  },[showTagBox])

  useEffect(() => {
    if(showMoreList){
      setShowTagBox(false)
      setShowSliceList(false)
      setShowSliceInfoBox(false)
      setShowAnnotionList(false)
    }
  },[showMoreList])

  useEffect(() => {
    if(showSliceInfoBox){
      setShowTagBox(false)
      setShowSliceList(false)
      setShowMoreList(false)
      setShowAnnotionList(false)
    }
  },[showSliceInfoBox])

  useEffect(() => {
    if(showAnnotionList){
      setShowTagBox(false)
      setShowSliceList(false)
      setShowMoreList(false)
      setShowSliceInfoBox(false)
    }
  },[showAnnotionList])


  useEffect(() => {
    const onKeyDown = event => handleKeyDown(event, currentCanvas, dispatch)
    if (currentCanvas) document.addEventListener('keydown', onKeyDown)
    return () => {
      // 销毁事件监听
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [currentCanvas])

  // 路由的query参数变化时重新获取参数
  useEffect(() => {
    const { status = '', model = '' } = queryInfo
    setFilterValue({
      status: status.toString(),
      model: model.toString(),
    })
  }, [queryInfo])

  useEffect(() => {
    const initimageId = window.sessionStorage.getItem('tagInitImageId')
    const initGroupId = window.sessionStorage.getItem('tagInitGroupId')
    // window.sessionStorage.removeItem('tagInitImageId')
    // window.sessionStorage.removeItem('tagInitGroupId')

    fetchData(initimageId, initGroupId) // 页面新进入时，获取数据
    return () => {
      //  清除reduxproject状态
      dispatch({
        type: 'CLEAR_PROJECT_STATE',
      })
    }
  }, [filterValue])

  const handleChangeHitStatus = async action => {
    // const result = getCurrentResult(currentCanvas)

    // // const _model =filterValue['status'] === 'done' ? currentHit.hitResults[0].model : filterValue['model']

    // const _model = isEdit ? 'human-annotation' : filterValue['model']

    // let _hitResid = -1
    // const projectHit = projectHits[0]
    // if (projectHit.hitResults && projectHit.hitResults[0]) _hitResid = projectHit.hitResults[0].id

    // const postData = {
    //   hitResId: _hitResid,
    //   hitId: projectHit.id,
    //   pid: projectDetails.id,
    //   status: '',
    //   result: result,
    //   predLabel: JSON.stringify(classifyInfo),
    //   model: _model,
    // }
    // let res
    switch (action) {
      // case 'saveTempHit':
      //   postData.status = 'notDone'
      //   res = await updateHitStatus(postData)
      //   break
      case 'saveToDone':
        // 保存标注信息并to done
        if(currentImage.status === 0 || currentImage.status === 1 || currentImage.status === 3){
          message.info("当前图像尚未转化结束，不可保存标注！")
          break
        }
        setIsUpdateDoneModalOpen(true)
        break
      // case 'logResult':
      //   // console.log('result: ', result)
      //   res = { err: false }
      //   break
    }
    // if (res && !res.err) {
    //   // message.success('operate success!')
    //   if (action !== 'logResult') {
    //     setChangeSession(false)
    //     if (action !== 'saveToDone') {
    //       setIsEdit(false)
    //     }
    //   }
    // } else {
    //   // message.error(res.data)
    // }
  }

  // useEffect(() => {
  //   if (projectHits && projectHits.length > 0) {
  //     getInferRes()
  //   }
  // }, [selectedModels])

  // const getInferRes = async () => {
  //   const postData = {
  //     hitId: projectHits[0].id,
  //     modelList: JSON.stringify(selectedModels),
  //     taskType: projectDetails.task_type,
  //   }
  //   const inferResult = await getModelInfer(postData)

  //   const arrays = inferResult.data.result.map(str => JSON.parse(str))
  //   const mergedArray = [].concat(...arrays)
  //   const filteredArray = mergedArray.filter(item => item !== null)
  //   renderModelInfer(filteredArray, currentInferPaths)
  // }

  return (
    <Spin spinning={loading}>
      {projectHitsFetchEnd && currentGroupImages.length === 0 && !currentImage && (
        <div className={styles.emptyPage}>
          <div style={{width: '100%', height: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Empty description={ <span>当前分组下暂无数据</span>} imageStyle={{height: 200, width:400}}>
              <Button type="primary" onClick={()=>{setShowSliceList(true)}}>切换分组</Button>
            </Empty>
          </div>
          {/* <DoneTopBar filterValue={filterValue} /> */}
          {/* {filterValue['status'] === 'done' && (
            <Empty
              style={{ marginTop: '200px' }}
              description={<h2 className={styles.noItems}> 还没有GT标注数据 </h2>}
            />
          )}
          {filterValue['status'] === 'notDone' && (
            <Empty
              style={{ marginTop: '50px' }}
              description={
                <h2 className={styles.noItems}>
                  此项目已经标注完成，请到查看已标注页面进行查看或再次修改
                </h2>
              }
            />
          )}
          {filterValue['status'] === 'al' && (
            <Empty
              style={{ marginTop: '50px' }}
              description={<h2 className={styles.noItems}> 模型推理数据已全部确认 </h2>}
            />
          )} */}
        </div>
      )}

      {projectHitsFetchEnd && currentImage && (
        <div className={styles.container}>
          {showTagBox && (pathoImgInfo?.url !== '') &&
            <RightBar
              setShowTagBox={setShowTagBox}
              modelName={filterValue.model} // 当前模型名称
              space={filterValue.status === 'notDone'} // 是否是标注状态
              isDone={filterValue.status === 'done'}
              saveRow={handleChangeHitStatus}
              setUpdateReady={setUpdateReady}
              updateReady={updateReady}
              // setIsEdit={setIsEdit}
            />}
          {showSliceList && (
            <SliceList
              changeSession={changeSession}
              setShowSliceList={setShowSliceList}
              setSearchValue={setSearchValue}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              setCurrentPageSize={setCurrentPageSize}
            />
          )}
          {showAnnotionList && (
            <AnnotionList
              changeSession={changeSession}
              setShowAnnotionList={setShowAnnotionList}
              setShowTagBox={setShowTagBox}
              currentProjectPid={currentProjectPid}
            />
          )}
          <UpdateDoneModal 
            open={isUpdateDoneModalOpen}
            onCreate={async(values) => {
              const {annotationName, annotatedBy, description} = values
              const annotationRes = await searchAnnotation(currentImage.imageId)
              const allAnnotations = annotationRes.data.content
              const matchedAnnotation = allAnnotations.find(anno => anno.annotationName === annotationName)

              if((currentAnnotion && matchedAnnotation && matchedAnnotation.length !== 0 && matchedAnnotation.annotationId != currentAnnotion.annotationId)||(!currentAnnotion && matchedAnnotation && matchedAnnotation.length !== 0)){
                message.error("标注文件名称已存在，请重新命名！")
                return
              }

              const result = getCurrentResult(currentCanvas)
              const entities = customEntities

              const annotationResult = {
                imageId: currentImage.imageId,
                projectId: projectDetails.projectId,
                hitResults: result,
                customCategories: entities
              }

              const queryData = {
                annotationName: annotationName,
                description: description,
                annotatedBy: annotatedBy,
                annotationResult: JSON.stringify(annotationResult)
              }

              let res
              if(currentAnnotion){
                queryData.annotationId = currentAnnotion.annotationId
                res = await updateAnnotation([queryData])
              }else{
                queryData.imageId = currentImage.imageId
                res = await createAnnotation([queryData])
              }

              if (!res.err) {
                message.success('操作成功')
                localStorage.setItem("lastEditImageId", currentImage.imageId)
                setChangeSession(false)
                // 保存数据结果时, 传入当前所在图像的索引值
                // fetchData(currentImage.imageId, currentGroup.imageGroupId)
              } else {
                message.error(res || '操作失败')
              }
              setIsUpdateDoneModalOpen(false)
            }}
            onCancel={()=>{setIsUpdateDoneModalOpen(false)}}
            title={currentAnnotion ? "更新标注文件" : "新增标注文件"}
            okText={currentAnnotion ? "更新" : "新增"}
            annotion={currentAnnotion}
          />
          <div className={styles.viewContainer}>
            {pathoImgInfo.url !== '' && (
              <CanvasAnnotator
                setChangeSession={setChangeSession}
                // setIsEdit={setIsEdit}
                space={filterValue.status === 'notDone'}
                updateReady={updateReady}
              />
            )}
            {/* {projectHits.length !== 0 &&
              pathoImgInfo.url !== '' &&
              modelInferList.length !== 0 &&
              filterValue.status === 'notDone' &&
              (projectDetails.task_type.indexOf('IMAGE_SEGMENTATION') !== -1 ||
                projectDetails.task_type.indexOf('IMAGE_DETECTION') !== -1) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 100,
                    right: '1%',
                    width: '150px',
                    padding: '8px',
                    border: '1px solid black',
                    backgroundColor: 'white',
                  }}
                >
                  <p style={{ margin: '0' }}>模型推理结果</p>
                  <Divider style={{ margin: '5px 0' }} />
                  {modelInferList.map(item => (
                    <Checkbox
                      onChange={e => {
                        if (e.target.checked) {
                          setIsCheckedNone(false)
                          setSelectedModels(prevItems => [...prevItems, item])
                        } else {
                          setSelectedModels(prevItems =>
                            prevItems.filter(selectedItem => selectedItem !== item)
                          )
                        }
                      }}
                      checked={selectedModels.includes(item)}
                      style={{ marginLeft: '0', marginRight: '8px' }}
                    >
                      {item}
                    </Checkbox>
                  ))}
                  <Checkbox
                    onChange={e => {
                      if (e.target.checked) {
                        setIsCheckedNone(true)
                        setSelectedModels([])
                      } else {
                        setIsCheckedNone(false)
                      }
                    }}
                    checked={isCheckedNone}
                    style={{ marginLeft: '0', marginRight: '8px' }}
                  >
                    无
                  </Checkbox>
                </div>
              )} */}
          </div>
        </div>
      )}

      {projectHitsFetchEnd && currentImage && (
        <>
          {pathoImgInfo.url !== '' && (
            <>
              <Popover
                  content={<div style={{width: '250px', backgroundColor: '#272b33', padding:'10px', color: '#fff'}}>
                    <p><b>切片信息 </b></p>
                    <Divider style={{ marginTop: '0', marginBottom: '5px', backgroundColor: '#354052' }} />
                    <p style={{ wordWrap: 'break-word', marginBottom: '4px' }}>
                      <b>文件名: </b>
                      {currentImage?.imageUrl?.substring(currentImage.imageUrl.lastIndexOf('/') + 1)}
                    </p>
                    <p style={{ marginBottom: '4px' }}>
                      <b>图片宽高: </b>
                      {pathoImgInfo?.size?.width} x {pathoImgInfo?.size?.height}
                    </p>
                    <p style={{ marginBottom: '4px' }}>
                      <b>视窗内图片大小: </b>
                      {pathoViewSize.width} x {pathoViewSize.height}
                    </p>
                  </div>}
                  trigger="click"
                  color="#272b33"
                  overlayClassName={styles.morePop}
                  open={showSliceInfoBox}
                  placement="right"
                  onOpenChange={(newOpen)=>{setShowSliceInfoBox(newOpen)}}
                >
                  <div className={styles.sliceInfo}>
                    <div onClick={()=>{setShowSliceInfoBox(!showSliceInfoBox)}} 
                          title='切片信息' className={styles.sliceInfoButton} 
                        style={{backgroundColor: `${showSliceInfoBox ? 'rgba(37, 176, 229, .7)' : 'rgba(40, 49, 66, .6)'}`}}>
                      <VIcon type="icon-binglixinxi" style={{ fontSize: '28px', marginTop:'10px' }}/>
                    </div>
                  </div>
              </Popover>
              {(pathoImgInfo?.url !== '') && (   // 转化中或转化成功都可以进行标注
                <div className={styles.biaozhu}>
                  <div onClick={()=>{setShowTagBox(!showTagBox)}} 
                        title='标注' className={styles.biaozhuButton} 
                      style={{backgroundColor: `${showTagBox ? 'rgba(37, 176, 229, .7)' : 'rgba(40, 49, 66, .6)'}`}}>
                    <VIcon type="icon-biaozhu" style={{ fontSize: '28px', marginTop:'8px' }}/>
                  </div>
                </div>
              )}

              {(pathoImgInfo?.url !== '') && (
                <div className={styles.annotionList}>
                  <div onClick={()=>{setShowAnnotionList(!showAnnotionList)}} 
                        title='切换标注文件' className={styles.annotionListButton} 
                      style={{backgroundColor: `${showAnnotionList ? 'rgba(37, 176, 229, .7)' : 'rgba(40, 49, 66, .6)'}`}}>
                    <VIcon type="icon-folder" style={{ fontSize: '28px', marginTop:'8px' }}/>
                  </div>
                </div>
              )}

            </>
          )}
          <div className={styles.sliceList}>
            <div onClick={()=>{setShowSliceList(!showSliceList)}} 
                  title='切片列表' className={styles.sliceListButton}
                style={{backgroundColor: `${showSliceList ? 'rgba(37, 176, 229, .7)' : 'rgba(40, 49, 66, .6)'}`}}>
              <VIcon type="icon-list" style={{ fontSize: '28px', marginTop:'10px' }}/>
            </div>
          </div>
          <Popover
            content={<div style={{display:'flex'}}>
              <div onClick={() => {
                  const projectId = localStorage.getItem('currentProject')
                  history.push('/userHome/projects/' + projectId)
                }}
                title='返回上一页'
                className={styles.moreListIcon}
                style={{borderTopLeftRadius: '5px', borderBottomLeftRadius: '5px'}}>
                <VIcon type="icon-pre" style={{ fontSize: '18px'}}/>
              </div>
              <div onClick={() => history.push('/userHome/my-projects')}
                  title='返回主界面'
                  className={styles.moreListIcon}>
                <VIcon type="icon-home" style={{ fontSize: '18px'}}/>
              </div>
              {currentViewer && (
                <div onClick={() => {currentViewer.setFullScreen(true)}}
                    title='全屏'
                    className={styles.moreListIcon}
                    style={{borderTopRightRadius: '5px', borderBottomRightRadius: '5px'}}>
                  <VIcon type="icon-fullscreen" style={{ fontSize: '18px'}}/>
                </div>
              )}
            </div>}
            trigger="click"
            overlayClassName={styles.morePop}
            open={showMoreList}
            color="#272b33"
            placement="right"
            onOpenChange={(newOpen)=>{setShowMoreList(newOpen)}}
          >
            <div className={styles.moreList}>
              <div onClick={()=>{setShowMoreList(!showMoreList)}} 
                   title='更多功能' className={styles.moreListButton}
                  style={{backgroundColor: `${showMoreList ? 'rgba(37, 176, 229, .7)' : 'rgba(40, 49, 66, .6)'}`}}>
                <VIcon type="icon-more" style={{ fontSize: '28px', marginTop:'10px' }}/>
              </div>
            </div>
          </Popover>
        </>
      )}
      {(currentImage?.status === 0 || currentImage?.status === 1) && (
        <div className={styles.convertProgress}>
          <div style={{color:'#fff', fontWeight:'bold'}}>
            <span>转化进度：</span>
            <Progress percent={progress} style={{width: '400px'}}/>
          </div>
        </div>
      )}
    </Spin>
  )
}

export default PathoTaggerSpace
