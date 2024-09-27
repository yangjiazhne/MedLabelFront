/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:26:37
 */
import { searchProject, deleteProject } from '@/request/actions/project'
import { Button, Descriptions, Modal, Spin, Dropdown, Menu } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router-dom'
import { Header, DataList, RefModelTaskList } from './components'
import { renderProjectDetail } from './config'
import styles from './index.module.scss'
import { VButton } from '@/components'
import { primaryColor } from '@/constants'
import { ExclamationCircleOutlined, UnorderedListOutlined, DeleteOutlined, FormOutlined } from '@ant-design/icons'
import { getOptionsBtn } from './components/Header/config'
import { useTranslation } from 'react-i18next'
import { handleError } from '@/helpers/Utils'
import { searchGroup } from '@/request/actions/group'
import { searchImage, fetchImageTileInfo } from '@/request/actions/image'

import { RefTaskTable } from '@/pages/TaskList/components'
import UploadType from './components/Header/UploadType'
import OpenSeadragon from 'openseadragon'
import { ModelDetail } from '../ModelList'
import { getToken } from '@/helpers/dthelper'
import { useGoToRes } from '../TaskList/components/RefTaskTable'

const ProjectOverview = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const [uploadType, setUploadType] = useState('Raw')
  const [taskList, setTaskList] = useState([])
  const [process, setProcess] = useState(0)
  const [deepZoomStatus, setDeepZoomStatus] = useState(null)
  const [intervalId, setIntervalId] = useState(null)
  const { t } = useTranslation()
  const colorMap = {
    MedCls: 'magenta',
    MedYoLo: 'orange',
    DeepLab: 'geekblue',
    推理完成: 'green',
    待推理: 'gold',
    推理失败: 'red',
  }
  const [open, setOpen] = useState(false)

  const {
    projectDetails, // 项目图片信息
    currentGroupImages,  // 当前组下面的图片
  } = useSelector(
    // @ts-ignore
    state => state.project
  )

  // @ts-ignore
  let { projectId } = useParams()

  const [loading, setLoading] = useState(true)

  //控制当前页数
  const [currentPage, setCurrentPage] = useState(1)
  //每页显示数据集个数
  const [currentPageSize, setCurrentPageSize] = useState(10)
  
  // const deleteProjectModals = () => {
  //   Modal.confirm({
  //     title: '确认',
  //     icon: <ExclamationCircleOutlined />,
  //     content: '确定要删除该数据集吗？',
  //     okText: '确认',
  //     cancelText: '取消',
  //     onOk: async () => {
  //       const res = await deleteProject(projectId)
  //       if (!res.err) {
  //         Modal.success({
  //           title: '删除成功!',
  //           content: '点击确认按钮返回首页',
  //           onOk: () => history.push('/userHome/my-projects'),
  //         })
  //       } else {
  //         handleError(res.data)
  //       }
  //     },
  //   })
  // }

  // const fetchData = async () => {
  //   let intervalId
  //   const currentProjectPid = projectId
  //   localStorage.setItem('currentProject', currentProjectPid)
  //   setLoading(true)

  //   // 获取项目详情
  //   const detailRes = await fetchProjectDetail(currentProjectPid)
  //   console.log('projectDetails', detailRes.data)
  //   dispatch({
  //     type: 'UPDATE_PROJECT_DETAIL',
  //     payload: detailRes.data,
  //   })

  //   const projectModelsRes = await fetchProjectModels(currentProjectPid)
  //   dispatch({
  //     type: 'UPDATE_PROJECT_MODELS',
  //     payload: projectModelsRes.data,
  //   })

  //   // 获取项目标记信息
  //   if (detailRes.data.imageType == 'mrxs') {
  //     const pathoImgInfo = await getPathoImgInfo(currentProjectPid)
  //     // 这里的hits不一定带有result信息，这里不需要result信息
  //     var hitsRes = await fetchPathoProjectHits(currentProjectPid, {
  //       model: 'human-annotation',
  //       hitStatus: 'notDone',
  //       hitResultStatus: 'notDone',
  //     })
  //     // 临时修改为按照done重新获取，后面要修改这个接口的后端，如果status是‘any’就无论是done还是notDone都能获取
  //     if (hitsRes.data.hits.length === 0) {
  //       hitsRes = await fetchPathoProjectHits(currentProjectPid, {
  //         model: 'human-annotation',
  //         hitStatus: 'done',
  //         hitResultStatus: 'done',
  //       })
  //     }

  //     const projectHits = hitsRes.data.hits
  //     dispatch({
  //       type: 'UPDATE_PROJECT_HITS',
  //       payload: projectHits,
  //     })
      
  //     let pathoImageInfo = {
  //       url: `${projectHits[0]?.data}/images/`,
  //       overlap: pathoImgInfo.data.Overlap,
  //       tileSize: pathoImgInfo.data.TileSize,
  //       format: pathoImgInfo.data.Format.toLowerCase(),
  //       size: {
  //         width: pathoImgInfo.data.Size.Width,
  //         height: pathoImgInfo.data.Size.Height,
  //       },
  //     }

  //     dispatch({
  //       type: 'UPDATE_PROJECT_PATHOIMGINFO',
  //       payload: pathoImageInfo,
  //     })

  //     const viewer = OpenSeadragon({
  //       id: detailRes.data.imageType == 'mrxs' ? 'openSeaDragon' : 'backup',
  //       // 装有各种按钮名称的文件夹 images 地址，即库文件中的 images 文件夹
  //       prefixUrl: `${window.location.protocol}//${window.location.host}/openseadragon/images/`,
  //       tileSources: {
  //         Image: {
  //           // 指令集
  //           xmlns: 'http://schemas.microsoft.com/deepzoom/2008',
  //           Url: `${projectHits[0].data}/images/`,
  //           // 相邻图片直接重叠的像素值
  //           Overlap: pathoImgInfo.data.Overlap,
  //           // 每张切片的大小
  //           TileSize: pathoImgInfo.data.TileSize,
  //           Format: pathoImgInfo.data.Format.toLowerCase(),
  //           Size: {
  //             Width: pathoImgInfo.data.Size.Width,
  //             Height: pathoImgInfo.data.Size.Height,
  //           },
  //         },
  //       },
  //       // 是否显示导航控制
  //       showNavigationControl: true,
  //       navigationControlAnchor: 'TOP_LEFT',

  //       // 是否显示导航窗口
  //       showNavigator: true,
  //       autoHideControls: false,
  //       // 以下都是导航配置
  //       navigatorAutoFade: false,
  //       navigatorHeight: '90px',
  //       navigatorWidth: '200px',
  //       navigatorBackground: '#fefefe',
  //       navigatorBorderColor: '#000000',
  //       navigatorDisplayRegionColor: '#FF0000',

  //       minScrollDeltaTime: 30,
  //       zoomPerSecond: 0.1,
  //       // 至少 20% 显示在可视区域内
  //       visibilityRatio: 0.2,
  //       // 是否允许水平拖动
  //       panHorizontal: true,
  //       // 初始化默认放大倍数，按home键也返回该层
  //       defaultZoomLevel: 1,
  //       // 最小允许放大倍数
  //       minZoomLevel: 0.7,
  //       // 最大允许放大倍数
  //       maxZoomLevel: 150,
  //       animationTime: 1, // 设置默认的动画时间为1秒
  //     })
  //   } else if (detailRes.data.imageType == 'dicom' || detailRes.data.imageType == 'normal') {
  //     const hitsRes = await fetchProjectHits(currentProjectPid, {
  //       model: 'human-annotation',
  //       start: 0,
  //       count: detailRes.data.totalHits,
  //     })
  //     dispatch({
  //       type: 'UPDATE_PROJECT_HITS',
  //       payload: hitsRes.data.hits,
  //     })
  //   }

  //   setLoading(false)

  //   // if (detailRes.data.imageType == 'mrxs') {
  //   //   let processRes = getPathoProjectStatus(projectId)
  //   //   processRes.then(res => {
  //   //     setDeepZoomStatus(res.data.status)
  //   //     // 初次启动，查看是否为processing状态，其他状态无需启动轮询
  //   //     if (res.data.status === 'processing') {
  //   //       const intervalId = setInterval(() => {
  //   //         processRes = getPathoProjectStatus(projectId)
  //   //         processRes.then(res => {
  //   //           if (res.data) {
  //   //             setDeepZoomStatus(res.data.status)
  //   //             setProcess((res.data.currentNum / res.data.totalNum) * 100)
  //   //             if (res.data.status === 'done') {
  //   //               Modal.success({
  //   //                 title: '数据集转换成功!',
  //   //                 content: '点击确认刷新页面，或手动刷新页面',
  //   //                 onOk: () => location.reload(),
  //   //               })
  //   //               clearInterval(intervalId)
  //   //               setIntervalId(null)
  //   //             } else if (res.data.status === 'failed') {
  //   //               Modal.error({
  //   //                 title: '数据集转换失败!',
  //   //                 content: '请到数据集编辑界面，尝试重新提交包含病理图地址信息的txt文件',
  //   //               })
  //   //               clearInterval(intervalId)
  //   //               setIntervalId(null)
  //   //             }
  //   //           }
  //   //         })
  //   //       }, 5000)
  //   //       setIntervalId(intervalId)
  //   //     }
  //   //   })
  //   // }
  // }

  const fetchData = async () => {
    const currentProjectPid = projectId
    localStorage.setItem('currentProject', currentProjectPid)

    setLoading(true)

    // 获取项目详情
    const projectRes = await searchProject(projectId = currentProjectPid)

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

    dispatch({
      type: 'UPDATE_PROJECDT_ENTITY',
      payload: JSON.parse(projectRes.data.content[0].categories)
    })


    // 获取项目所有的组
    const projectGroupsRes= await searchGroup(currentProjectPid)
    
    dispatch({
      type: 'UPDATE_CURRENT_PROJECT_GROUPS',
      payload: projectGroupsRes.data.content,
    })


    if(projectGroupsRes.data.content.length > 0){  // 当前数据集下有分组
      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: projectGroupsRes.data.content[0],
      })
      
      // 获取index为0的组下所有的图片信息
      const imageRes = await searchImage(projectGroupsRes.data.content[0].imageGroupId,undefined,undefined,undefined,undefined,currentPage-1,currentPageSize)
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: imageRes.data.content
      })
  
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
        payload: imageRes.data.totalElements
      })
    }else{  // 当前数据集下无分组
      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: null,
      })
      
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: []
      })
  
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
        payload: 0
      })
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  return (
    <Spin spinning={loading}>
      {!loading && (
        <>
          <div style={{height: '70px'}}></div>
          <div style={{ padding: '30px 120px', flex: 1,minHeight:'88vh' }}>
            <Header />
            {/* {projectDetails && <RefModelTaskList projectDetails={projectDetails} />} */}
            <DataList 
              currentPage = {currentPage}
              setCurrentPage = {setCurrentPage}
              currentPageSize = {currentPageSize} 
              setCurrentPageSize = {setCurrentPageSize}
            ></DataList>
            {/* <Descriptions
              bordered
              title={t('datasetDetails')}
              className={styles.container}
              extra={
                <div>
                  <VButton
                    color="purple"
                    icon={<FormOutlined style={{ color: 'white' }} />}
                    onClick={() => history.push(`/userHome/import?id=${projectDetails.id}`)}
                  >
                    {t('edit')}
                  </VButton>
                  <Button
                    style={{ borderColor: 'red', borderRadius: '5px', margin: '0px 5px 0px 5px' }}
                    icon={<DeleteOutlined style={{ color: 'red' }} />}
                    onClick={deleteProject}
                    danger
                    disabled={true}
                  >
                    {t('delete')}
                  </Button>
                  <Dropdown
                    overlay={() => (
                      <Menu>
                        {getOptionsBtn({
                          history,
                          downloadFile,
                          // deleteProject,
                          // projectDetails,
                          // createByMe,
                        }).map((option, index) => (
                          <Menu.Item key={index} icon={option.icon} onClick={option.onClick}>
                            {t(option.title)}
                          </Menu.Item>
                        ))}
                      </Menu>
                    )}
                  >
                    <VButton color={primaryColor}>
                      <UnorderedListOutlined />
                      {t('download')}
                    </VButton>
                  </Dropdown>
                </div>
              }
            >
              {renderProjectDetail(projectDetails, entityColorMap).map((item, index) => (
                <Descriptions.Item key={index} label={t(item.label)} span={item.span}>
                  {item.value === 'private' ||
                  item.value === 'public' ||
                  item.value === 'detection and segmentation task' ||
                  item.value === 'classification task' ||
                  item.value === 'normal' ||
                  item.value === 'dicom' ||
                  item.value === 'mrxs'
                    ? t(item.value)
                    : item.value}
                </Descriptions.Item>
              ))}
            </Descriptions> */}

            {/* {projectDetails.imageType === 'mrxs' && deepZoomStatus === 'processing' && (
              <div className={styles.container}>
                <p style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'bold', fontSize: '16px' }}>
                  {'病理图数据格式转换进度'}
                </p>
                <Progress
                  percent={Number(process.toFixed(2))}
                  style={{ width: '400px', margin: '20px auto' }}
                />
              </div>
            )} */}
            
            {/* {projectDetails.imageType === 'mrxs' && deepZoomStatus === 'failed' && (
              <div className={styles.container}>
                <p style={{ color: red, fontWeight: 'bold', fontSize: '16px' }}>
                  {'病理图数据格式转换失败，需重新加载病理图，请重新提交包含病理图地址信息的txt文件！'}
                </p>
              </div>
            )} */}
            
            {/* <div id="backup"></div>
            {projectDetails.imageType == 'mrxs' && (
              <div className={styles.container}>
                <p style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'bold', fontSize: '16px' }}>
                  超分辨率图
                </p>
                <div
                  id="openSeaDragon"
                  style={{ height: projectDetails.imageType === 'mrxs' ? '400px' : '0px' }}
                ></div>
              </div>
            )} */}
          </div>
        </>
      )}
    </Spin>
  )
}

export default ProjectOverview
