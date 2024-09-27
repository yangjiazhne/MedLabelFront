/*
 * @Author: Azhou
 * @Date: 2021-06-15 11:46:11
 * @LastEditors: Azhou
 * @LastEditTime: 2022-11-21 22:26:31
 */
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { Card, Empty, message, Modal, Spin, Tag, Button, Divider, Checkbox, Popover, Radio, Form, Input } from 'antd'
import { HomeOutlined, LeftOutlined } from '@ant-design/icons'
import useQuery from '@/hooks/useQuery'
import { searchProject } from '@/request/actions/project'
import { searchGroup } from '@/request/actions/group'
import { searchImage, fetchImageTileInfo } from '@/request/actions/image'
import { createAnnotation, searchAnnotation, updateAnnotation } from '@/request/actions/annotation'
import { contorlTypes, hitShapeTypes } from '@/constants'
import { getTaskList } from '@/request/actions/task'
import { getCurrentResult, handleKeyDown, renderModelInfer } from './help'
import styles from './TaggerSpace.module.scss'
import { VButton, VIcon } from '@/components'
import { DoneTopBar, ImgSwiper, RightBar, CanvasAnnotator, SliceList, AnnotionList } from './components'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { handleError } from '@/helpers/Utils'
import useDidUpdateEffect from '@/hooks/useDidUpdateEffect'
import store from '@/redux/store'

const { TextArea } = Input;

const UpdateDoneModal = ({ open, onCreate, onCancel, title, okText, annotion}) => {
  
  const { project } = store.getState()
  const { currentAnnotion } = project
  const [form] = Form.useForm();
  const userDetail = window.sessionStorage.getItem('userDetail');
  const username = userDetail ? JSON.parse(userDetail).username : null;

  useEffect(() => {
    form.setFieldsValue({
      annotationName: currentAnnotion?.annotationName || 'annotion',
      annotatedBy: currentAnnotion?.annotatedBy || username,
      description: currentAnnotion?.description || ''
    });
  }, [currentAnnotion, form, username]);

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
          .then(async(values) => {
            await onCreate(values);
            form.setFieldsValue({
              annotationName: currentAnnotion?.annotationName || 'annotion',
              annotatedBy: currentAnnotion?.annotatedBy || username,
              description: currentAnnotion?.description || ''
            });
            // form.resetFields();
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
        // initialValues={{
        //   annotationName: currentAnnotion?.annotationName ? currentAnnotion.annotationName : 'annotion',
        //   annotatedBy: currentAnnotion?.annotatedBy ? currentAnnotion.annotatedBy : username,
        //   description: currentAnnotion?.description ? currentAnnotion.description : ''
        // }}
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

const TaggerSpaceNew = () => {
  let queryInfo = useQuery()
  const dispatch = useDispatch()
  let history = useHistory()
  const {
    currentAnnotion,
    projectDetails,
    currentIndex,
    customEntities,
    currentCanvas,
    currentImage,
    currentGroup,
    currentGroupImages,
    classifyInfo,
    currentImgSize,
    annotion
    // isEdit,
  } = useSelector(
    // @ts-ignore
    state => state.project
  )

  const { userDetail } = useSelector(
    // @ts-ignore
    state => state.user
  )

  // @ts-ignore
  let { projectId } = useParams()
  const currentProjectPid = projectId

  const [isUpdateDoneModalOpen, setIsUpdateDoneModalOpen] = useState(false)
  
  // 组件的显示与隐藏
  const [showTagBox, setShowTagBox] = useState(true)
  const [showSliceList, setShowSliceList] = useState(false)
  const [showMoreList, setShowMoreList] = useState(false)
  const [showSliceInfoBox, setShowSliceInfoBox] = useState(false)
  const [showAnnotionList, setShowAnnotionList] = useState(false)

  const containerRef = useRef(null);  //用于标注框的父容器

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

  // 分组的搜索 + 分页显示
  const [searchValue, setSearchValue] = useState('')  //搜索框
  const [currentPage, setCurrentPage] = useState(1)   //控制当前页数
  const [currentPageSize, setCurrentPageSize] = useState(8)   //每页显示分组个数

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

  const [loading, setLoading] = useState(true)
  const [changeSession, setChangeSession] = useState(false)
  const [modelInferList, setModelInferList] = useState([])
  const [classificationModel, setClassificationModel] = useState('none')
  const [selectedModels, setSelectedModels] = useState(
    JSON.parse(localStorage.getItem('selectedModels')) || []
  )
  const [isCheckedNone, setIsCheckedNone] = useState(false)
  const [filterValue, setFilterValue] = useState({
    status: '',
    model: '',
  })
  const isFirstRender = useRef(true)

  const currentInferPaths = useRef([]) // 当前的模型推理结果，临时存储，每次返回时都要先清空上一次的所有路径

  const [updateReady, setUpdateReady] = useState(1)

  // 通过单击图像进入标注页面时/保存标注数据后，会携带图像id和组id
  const fetchData = async (currentImageId, currentGroupId) => {

    if(currentProjectPid) {
      setLoading(true)

      // 获取数据集详情
      const projectRes = await searchProject(currentProjectPid)
      
      if(Number(projectRes.code) === 401){
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
      const formatImages = groupImageRes.data.content.map(item => ({
        ...item,
        imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
        imageUrl: `/uploads/${projectId}/${item.imageName}.png`
      }))
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: formatImages
      })

      // 获取当前图像
      let imageRes = null
      if(currentImageId){
        imageRes = formatImages.find(image => image.imageId === Number(currentImageId))
      }else{
        imageRes = formatImages? formatImages[0] : null
      }

      if(imageRes){
        dispatch({
          type: 'UPDATE_CURRENT_IMAGE',
          payload: { ...imageRes }
        })
      }

      setLoading(false)

    }
  }

  const updateImage = (image) => {
    dispatch({
      type: 'UPDATE_CURRENT_IMAGE',
      payload: null
    })

    dispatch({
      type: 'UPDATE_CURRENT_IMAGE',
      payload: image
    })
  }

  // const _fetchData = async currentHitIndex => {
  //   if (!filterValue.status) return
  //   if (currentProjectPid) {
  //     setLoading(true)
  //     // 获取项目详情
  //     const detailRes = await fetchProjectDetail(currentProjectPid)
  //     dispatch({
  //       type: 'UPDATE_PROJECT_DETAIL',
  //       payload: detailRes.data,
  //     })
      
  //     let fv = {}

  //     if (filterValue.status === 'notDone') {
  //       fv = {model: 'human-annotation'}
  //     } else {
  //       fv = filterValue
  //     }

  //     // 获取项目标记信息
  //     const { hits: hitsData = [] } = (
  //       await fetchProjectHits(currentProjectPid, {
  //         ...fv,
  //         start: 0,
  //         count: detailRes.data.totalHits,
  //       })
  //     ).data

  //     dispatch({
  //       type: 'UPDATE_PROJECT_HITS',
  //       // payload: getHits(hitsData, filterValue),
  //       payload: hitsData,
  //     })

  //     if (filterValue.status !== 'notDone' && !isEdit) {
  //       dispatch({
  //         type: 'UPDATE_CURRENT_ENTITY',
  //         payload: '',
  //       })
  //     }

  //     //普通图像标注页码初始状态为绘制
  //     dispatch({
  //       type: 'UPDATE_CURRENT_CONTROL_TYPE',
  //       payload: 'default',
  //     })

  //     // 更新当前hit索引时会同步更新【currentIndex,currentHit,boundingBoxMap,classifyInfo,】
  //     dispatch({
  //       type: 'UPDATE_CURRENT_HIT_INDEX',
  //       payload: currentHitIndex || 0,
  //     })

  //     fetchInferModel(currentProjectPid)

  //     setLoading(false)
  //   }
  // }

  const fetchInferModel = async pid => {
    const taskRes = await getTaskList()
    if (!taskRes.err) {
      const newTaskList = Object.keys(taskRes.data).map(item => ({
        ...taskRes.data[item],
      }))
      const filteredList = newTaskList.filter(
        item => item.projectId === pid && item.Status === '推理完成'
      )
      const modelNamesSet = new Set(filteredList.map(item => item.modelName))
      const modelNames = Array.from(modelNamesSet)
      setModelInferList(modelNames)
    }
  }

  useEffect(() => {
    const onKeyDown = event => handleKeyDown(event, currentCanvas, dispatch)
    if (currentCanvas) document.addEventListener('keydown', onKeyDown)
    return () => {
      // 销毁事件监听
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [currentCanvas])

  // useEffect(() => {
  //   return () => {
  //     // 清空当前标记信息
  //     // dispatch({
  //     //   type: 'UPDATE_CURRENT_HIT_INDEX',
  //     //   payload: -1,
  //     // })
  //     // dispatch({
  //     //   type: 'UPDATE_ISEDIT',
  //     //   payload: false,
  //     // })
  //   }
  // }, [])

  // 路由的query参数变化时重新获取参数
  useEffect(() => {
    const { status = '', model = '' } = queryInfo
    setFilterValue({
      ...filterValue,
      status: status.toString(),
      model: model.toString(),
    })
  }, [queryInfo])

  useDidUpdateEffect(() => {
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
    // // const _model = filterValue['status']==='done'?currentHit.hitResults[0].model:filterValue["model"]
    // const _model = isEdit ? 'human-annotation' : filterValue['model']

    // let _hitResid = -1
    // if (currentImage.hitResults && currentImage.hitResults[0]) _hitResid = currentImage.hitResults[0].id
    // const postData = {
    //   hitResId: _hitResid,
    //   hitId: currentImage.id,
    //   pid: projectDetails.id,
    //   status: '',
    //   result,
    //   predLabel: JSON.stringify(classifyInfo),
    //   model: _model,
    // }

    switch (action) {
      // case 'savePartialHit':
      // postData.status = 'notDone'
      // res = await updateHitStatus(postData)
      // break
      case 'saveToDone':
        // 保存标注信息并to done
        setIsUpdateDoneModalOpen(true)
        break
      // case 'logResult':
      //   // console.log('result: ', result)
      //   res = { err: false }
      //   break
    }
    // if (res && !res.err) {
    //   message.success('operate success!')
    //   if (action !== 'logResult') {
    //     setChangeSession(false)
    //     // dispatch({
    //     //   type: 'UPDATE_ISEDIT',
    //     //   payload: false,
    //     // })
    //     // 保存数据结果时, 传入当前所在图像的索引值
    //     fetchData(currentImage.imageId, currentGroup.groupId)
    //   }
    // } else {
    //   message.error('operate fail!')
    // }
  }

  // useEffect(() => {
  //   localStorage.setItem('selectedModels', JSON.stringify(selectedModels))
  //   if (isFirstRender.current) {
  //     isFirstRender.current = false
  //     return
  //   }
  //   if(modelInferList.length !== 0)
  //     getInferRes()
  // }, [selectedModels])

  // const getInferRes = async () => {
  //   if (!currentHit) return <div></div>
  //   const postData = {
  //     hitId: currentHit.id,
  //     modelList: JSON.stringify(selectedModels),
  //     taskType: projectDetails.task_type,
  //   }
  //   const inferResult = await getModelInfer(postData)

  //   if (projectDetails.task_type.indexOf('IMAGE_CLASSIFICATION') !== -1) {
  //     let _label = ''
  //     if (inferResult.data.result[0]) {
  //       _label = JSON.parse(inferResult.data.result[0]).label
  //     }
  //     dispatch({
  //       type: 'UPDATE_CURRENT_CLASSIFY_INFO',
  //       payload: {
  //         ...classifyInfo,
  //         label: _label,
  //       },
  //     })
  //   } else if (
  //     projectDetails.task_type.indexOf('IMAGE_SEGMENTATION') !== -1 ||
  //     projectDetails.task_type.indexOf('IMAGE_DETECTION') !== -1
  //   ) {
  //     const arrays = inferResult.data.result.map(str => JSON.parse(str))
  //     const mergedArray = [].concat(...arrays)
  //     const filteredArray = mergedArray.filter(item => item !== null)
  //     renderModelInfer(filteredArray, currentInferPaths)
  //   }
  // }

  return (
    <Spin spinning={loading}>
      <div style={{ width: '100%', display: 'flex', overflow:'hidden' }}>
        <div className={styles.leftContainer}>
          {currentImage && <ImgSwiper changeSession={changeSession} />}
        </div>
        
        <div className={styles.container} ref={containerRef} style={{height: !currentImage?'700px':'auto'}}>
          {currentGroupImages.length === 0 && (
            <Empty
              style={{ marginTop: '50px' }}
              description={<h2 className={styles.noItems}> 当前分组暂无数据，请选择数据 </h2>}
            />
          )}
          {currentImage && (
            <CanvasAnnotator
              setChangeSession={setChangeSession}
              space={filterValue.status === 'notDone'}
              setClassificationModel={setClassificationModel}
              setSelectedModels={setSelectedModels}
              setIsCheckedNone={setIsCheckedNone}
              updateReady={updateReady}
            />
          )}

          {currentImage && showTagBox && (
            <RightBar
              containerRef={containerRef}
              setShowTagBox={setShowTagBox}
              modelName={filterValue.model}
              space={filterValue.status === 'notDone'}
              isDone={filterValue.status === 'done'}
              isCls={projectDetails.task_type === 'IMAGE_CLASSIFICATION'}
              saveRow={handleChangeHitStatus}
              setUpdateReady={setUpdateReady}
              updateReady={updateReady}
              // saveTagAndNextRow={() => handleNextRow('next')}
            />
          )}
          {showAnnotionList && (
            <AnnotionList
              changeSession={changeSession}
              containerRef={containerRef}
              setShowAnnotionList={setShowAnnotionList}
              setShowTagBox={setShowTagBox}
            />
          )}
          {showSliceList && (
              <SliceList
                changeSession={changeSession}
                containerRef={containerRef}
                setShowSliceList={setShowSliceList}
                setSearchValue={setSearchValue}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
          )}
          {/* 保存标注信息 */}
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
                setChangeSession(false)
                setIsUpdateDoneModalOpen(false)
                // 保存数据结果时, 传入当前所在图像的索引值
                fetchData(currentImage.imageId, currentGroup.groupId)
                // updateImage(currentImage)
              } else {
                message.error(res || '操作失败')
              }
            }}
            onCancel={()=>{setIsUpdateDoneModalOpen(false)}}
            title={currentAnnotion ? "更新标注文件" : "新增标注文件"}
            okText={currentAnnotion ? "更新" : "新增"}
            annotion={currentAnnotion}
          />
        </div>
        <div className={styles.rightContainer}>
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
            </div>}
            trigger="click"
            overlayClassName={styles.morePop}
            open={showMoreList}
            color="#272b33"
            placement="left"
            onOpenChange={(newOpen)=>{setShowMoreList(newOpen)}}
          >
            <div className={styles.moreList}>
              <div onClick={()=>{setShowMoreList(!showMoreList)}} 
                  title='更多功能' className={styles.moreListButton}
                  style={{backgroundColor: `${showMoreList ? 'rgba(37, 176, 229, .7)' : '#616161'}`}}>
                <VIcon type="icon-more" style={{ fontSize: '28px', marginTop:'10px' }}/>
              </div>
            </div>
          </Popover>
          {currentImage && (
            <Popover
              content={<div style={{width: '250px', backgroundColor: '#272b33', padding:'10px', color: '#fff'}}>
                <p><b>标注对象简介 </b></p>
                <Divider style={{ marginTop: '0', marginBottom: '5px', backgroundColor: '#354052' }} />
                <p style={{ wordWrap: 'break-word', marginBottom: '4px' }}>
                  <b>文件名: </b>
                  {currentImage.imageName}
                </p>
                <p style={{ marginBottom: '4px' }}>
                  <b>图片宽高: </b>
                  {currentImgSize.width}*{currentImgSize.height}
                </p>
                {filterValue['status'] === 'al' && (
                  <p style={{ marginBottom: '4px' }}>
                    <b>推理模型：</b>
                    {filterValue['model']}
                  </p>
                )}
              </div>}
              trigger="click"
              color="#272b33"
              overlayClassName={styles.morePop}
              open={showSliceInfoBox}
              placement="left"
              onOpenChange={(newOpen)=>{setShowSliceInfoBox(newOpen)}}
            >
              <div className={styles.sliceInfo}>
                <div onClick={()=>{setShowSliceInfoBox(!showSliceInfoBox)}} 
                      title='切片信息' className={styles.sliceInfoButton} 
                    style={{backgroundColor: `${showSliceInfoBox ? 'rgba(37, 176, 229, .7)' : '#616161'}`}}>
                  <VIcon type="icon-binglixinxi" style={{ fontSize: '28px', marginTop:'10px' }}/>
                </div>
              </div>
            </Popover>
          )}
          <div className={styles.sliceList}>
            <div onClick={()=>{setShowSliceList(!showSliceList)}} 
                  title='切片列表' className={styles.sliceListButton}
                style={{backgroundColor: `${showSliceList ? 'rgba(37, 176, 229, .7)' : '#616161'}`}}>
              <VIcon type="icon-list" style={{ fontSize: '28px', marginTop:'10px' }}/>
            </div>
          </div>
          {currentImage && (
            <div className={styles.biaozhu}>
              <div onClick={()=>{setShowTagBox(!showTagBox)}} 
                    title='标注' className={styles.biaozhuButton} 
                  style={{backgroundColor: `${showTagBox ? 'rgba(37, 176, 229, .7)' : '#616161'}`}}>
                <VIcon type="icon-biaozhu" style={{ fontSize: '28px', marginTop:'8px' }}/>
              </div>
            </div>
          )}
          {currentImage && (
            <div className={styles.annotionList}>
              <div onClick={()=>{setShowAnnotionList(!showAnnotionList)}} 
                    title='切换标注文件' className={styles.annotionListButton} 
                  style={{backgroundColor: `${showAnnotionList ? 'rgba(37, 176, 229, .7)' : '#616161'}`}}>
                <VIcon type="icon-folder" style={{ fontSize: '28px', marginTop:'8px' }}/>
              </div>
            </div>
          )}
        </div>
      </div>
    </Spin>
  )
}

export default TaggerSpaceNew

// 之前有的但是现在没有用到
{/* {!currentGroupImages && filterValue['status'] === 'done' && (
          <Empty
            style={{ marginTop: '50px' }}
            description={<h2 className={styles.noItems}> 还没有已标注数据 </h2>}
          />
        )}
        {!currentGroupImages && filterValue['status'] === 'notDone' && (
          <Empty
            style={{ marginTop: '50px' }}
            description={<h2 className={styles.noItems}> 数据已全部标注完成 </h2>}
          />
        )}
        {!currentGroupImages && filterValue['status'] === 'al' && (
          <Empty
            style={{ marginTop: '50px' }}
            description={<h2 className={styles.noItems}> 模型推理数据已全部确认 </h2>}
          />
        )} */}
// 模型推理相关的HTML，先放在这里
{/* {modelInferList.length !== 0 &&
  filterValue.status === 'notDone' &&
  (projectDetails.task_type.indexOf('IMAGE_SEGMENTATION') !== -1 ||
    projectDetails.task_type.indexOf('IMAGE_DETECTION') !== -1) && (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: '2%',
        width: '150px',
        padding: '8px',
        border: '1px solid #f5f9fa',
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
  )}

{modelInferList.length !== 0 &&
  filterValue.status === 'notDone' &&
  projectDetails.task_type.indexOf('IMAGE_CLASSIFICATION') !== -1 && (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: '2%',
        width: '150px',
        padding: '8px',
        border: '2px solid #f5f9fa',
      }}
    >
      <p style={{ margin: '0' }}>模型推理结果</p>
      <Divider style={{ margin: '5px 0' }} />
      <Radio.Group
        onChange={e => {
          setClassificationModel(e.target.value)
          if (e.target.value !== 'none') {
            setSelectedModels([e.target.value])
          } else {
            setSelectedModels([])
          }
        }}
        value={classificationModel}
      >
        {modelInferList.map(item => (
          <Radio value={item} style={{ marginLeft: '0', marginRight: '8px' }}>
            {item}
          </Radio>
        ))}
        <Radio value={'none'} style={{ marginLeft: '0', marginRight: '8px' }}>
          无
        </Radio>
      </Radio.Group>
    </div>
  )} */}
  