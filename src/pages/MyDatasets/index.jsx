import React, { useEffect, useState } from 'react'
import styles from './index.module.scss'
import { Button, Empty, message, Modal, Spin, Input, Select, ConfigProvider, Pagination, Form, Checkbox, Divider } from 'antd'
import { ExclamationCircleOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { VButton } from '@/components'
import { useHistory } from 'react-router-dom'
import { handleError } from '@/helpers/Utils'
import { searchProject, deleteProject, createProject } from '@/request/actions/project'
import { searchImageType } from '@/request/actions/imageType'
import SingleProject from './SingleProject'
import { useSelector, useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import type { PaginationProps } from 'antd'
import zhCN from 'antd/lib/locale/zh_CN'
import useDidUpdateEffect from '@/hooks/useDidUpdateEffect'
import { saveAs } from 'file-saver'
import { imgUploadPre, hitShapeTypes } from '@/constants'
import JSZip from 'jszip'
import Banner from '@/assets/banner2.jpg'
import { getStrWithLen } from '@/helpers/Utils'
import { downloadAnnotationByProject } from '@/request/actions/annotation'
import { GroupSizeContext } from 'antd/lib/button/button-group'
import { fetchImageSize } from '@/request/actions/image'

const CheckboxGroup = Checkbox.Group;

const ProjectCreateModal = ({ open, onCreate, onCancel, title, okText, AllImageType}) => {
  const [form] = Form.useForm();
  const [imageType, setImageType] = useState(1)

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
            onCreate(values, imageType);
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
        initialValues={{ imageType: 1 }}
      >
        <Form.Item
          label="数据集名称"
          name="project_name"
          rules={[
            {
              required: true,
              message: '必须填写数据集名称',
            },
          ]}
        >
          <Input placeholder="请输入数据集名称" />
        </Form.Item>
        <Form.Item
          label="标签"
          name="tagsList"
          rules={[
            {
              required: true,
              message: '必须填写标签',
            },
          ]}
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="请添加标签, 以英文','划分, 支持复制"
            tokenSeparators={[',']}
          />
        </Form.Item>
        <Form.Item
          label="图片类型"
          name="imageType"
          rules={[
            {
              required: true,
              message: '必须选择图片类型',
            },
          ]}
        >
          <Select
            style={{ width: '100%' }}
            options={AllImageType}
            onChange={(value) => setImageType(value)}
          ></Select>
        </Form.Item>
        <Form.Item
          label="数据集简介"
          name="instructions"
          rules={[
            {
              required: true,
              message: '必须填写数据集简介',
            },
          ]}
        >
          <Input.TextArea
            rows={5}
            placeholder="医学图像矩形框选数据集，包含病灶或器官的矩形框标注，用于医学图像中的病灶检测和器官识别。"
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const DownloadDataModal = ({open, onOk, onCancel, title, okText, projects}) => {
  const [checkedList, setCheckedList] = useState([])
  const [indeterminate, setIndeterminate] = useState(false)
  const [checkAll, setCheckAll] = useState(false)
  const onChange = (list) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < projects.length);
    setCheckAll(list.length === projects.length);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? projects.map(p => p.projectId) : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="取消"
      onCancel={()=>{
        onCancel()
        setCheckedList([])
        setIndeterminate(false)
        setCheckAll(false)
      }}
      destroyOnClose
      okButtonProps={{ disabled: (checkedList.length === 0) }}
      onOk={()=>{
          setCheckedList([])
          setIndeterminate(false)
          setCheckAll(false)
          message.info("正在下载中，请稍等...")
          onOk(checkedList)
      }}
    >
      <div style={{ boxShadow: '0 0 15px #ededed', borderRadius: '4px'}}>
      <div style={{ padding: '10px'}}>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
              全部选中
          </Checkbox>
          <Divider style={{ marginTop: '5px', marginBottom: '5px'}} />
          <div style={{maxHeight: '250px', overflowY: 'auto', width: '100%'}}>
              <CheckboxGroup value={checkedList} onChange={onChange} style={{width: '100%'}}>
                  {projects?.map(p => {
                      const isChecked = checkedList.includes(p.projectId);
                      return (<div key={p.projectId} 
                                    style={{
                                            marginBottom: '4px',
                                            backgroundColor: isChecked ? '#f0f0f0' : 'transparent',
                                            padding: '4px',
                                            borderRadius: '4px',
                                          }}>
                                  <Checkbox value={p.projectId} style={{alignItems: 'center'}}>
                                      <div style={{display:'flex', alignItems: 'center'}}>
                                          <div>{getStrWithLen(p?.projectName, 50)}</div>
                                      </div>
                                  </Checkbox>
                              </div>)})}
              </CheckboxGroup>
          </div>
      </div>
      </div>
    </Modal>
  )
}


const MyProjects = () =>{ 
  const dispatch = useDispatch()
  const history = useHistory()
  const { t } = useTranslation()

  const { currentUserProjects, currentUserProjectsLength } = useSelector(
    // @ts-ignore
    state => state.user
  )

  // 创建数据集相关
  const [AllImageType, setAllImageType] = useState()
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)

  const fetchData = async () => {
    const imageTypeRes = await searchImageType()

    const transformedImageTypeRes = imageTypeRes.data.map(type => {
      // 将 JSON 格式的字符串转换为数组
      const extensionsArray = JSON.parse(type.imageExtensions);

      const extensionsString = extensionsArray.map(ext => `.${ext}`).join(', ');

      return {
        label: `${type.imageTypeName}(${extensionsString})`,
        value: type.imageTypeId
      };
    });

    setAllImageType(transformedImageTypeRes)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const [loading, setLoading] = useState(false)
  //控制当前页数
  const [currentPage, setCurrentPage] = useState(1)
  //每页显示数据集个数
  const [currentPageSize, setCurrentPageSize] = useState(10)
  //当前模糊搜索的关键词
  const [key, setKey] = useState('')
  // 数据集类别筛选
  const [imageTypeFilter, setImageTypeFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')

  // Button 搜索
  function handleSearch () {
    refreshData()
  }

  // 回车搜索
  const allSearch = async (e) => {
    if(loading) return
    if (e.keyCode === 13){
        refreshData()
    }
  }

  const onChange: PaginationProps['onChange'] = pageNumber => {
    setCurrentPage(pageNumber)
  }

  // 切换页数
  useDidUpdateEffect(() => {
    if(currentPage<0) return
    refreshData(currentPage)
  }, [currentPage])

  // 切换页面大小
  useEffect(() => {
    refreshData()
  }, [currentPageSize])

  const refreshData = async (notResetPage) => {
    setLoading(true)
    
    if (currentPage !== 1 && !notResetPage) setCurrentPage(1)   // 非切换页数获取数据集的时候将页数重置为1
    const page = currentPage - 1
    const size = currentPageSize
    let projectName = undefined
    if (key.trim() !== '') projectName = key.trim()
    // if (imageTypeFilter !== 'all') queryData.imageType = imageTypeFilter
    // if (taskTypeFilter !== 'all') queryData.taskType = taskTypeFilter

    // 查询数据集
    const res = await searchProject(undefined, projectName, page, size)

    if(Number(res.code) === 401){
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
   
    setLoading(false)

    if (!res.err) {
      dispatch({
        type: 'UPDATE_CURRENT_USER_PROJECTS',
        payload: res.data.content,
      })
      dispatch({
        type: 'UPDATE_CURRENT_USER_PROJECTS_LENGTH',
        payload: res.data.totalElements,
      })
    } 
  }

  const deleteProjectModals = projectId => {
    Modal.confirm({
      title: '确认',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除该数据集吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        const res = await deleteProject(projectId)
        if (!res.err) {
          message.success('数据集删除成功')
          refreshData()
        } else {
          handleError(res.data)
        }
      },
    })
  }

  const [downloadProject, setDownloadProject] = useState([])
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)

  const zip = new JSZip()
  const quickDownload = async (projectList) => {
    setLoading(true)
    const annotationRes = await downloadAnnotationByProject(projectList) 
    if (!annotationRes.err) {
      const results = annotationRes.data

      const transformedData = {};

      for (const [key, value] of Object.entries(results)) {
        const [projectId, projectName] = key.split('&&&'); // 获取项目名称
        const curProject = downloadProject.find(p => Number(p.projectId) === Number(projectId));
        
        const projectData = []; // 存放当前项目的组数据
    
        for (const [groupKey, groupValue] of Object.entries(value)) {
            const groupName = groupKey.split('&&&')[1];
            const groupData = [];
    
            for (const [imageKey, annotations] of Object.entries(groupValue)) {
                const [imageOriginUrl, imageHash] = imageKey.split('&&&')
                const imageName = imageOriginUrl.split('/').pop(); // 获取图片名称
                let imageUrl = `uploads/${projectId}/${imageHash}.png`
                let scale = 1
                if (curProject.imageType.imageTypeId === 3) {
                    imageUrl = imageOriginUrl
                    const imageSize = await fetchImageSize(projectId, imageHash);
                    scale = imageSize.width / 1000;
                }
                
                const annotationDetails = annotations.map(annotation => {
                  const parsedResult = JSON.parse(annotation.annotationResult);
                  let hitResults = parsedResult.hitResults
                  if(curProject.imageType.imageTypeId === 3 ){
                    scaleAnnotations(hitResults, scale) 
                  }
                  return {
                    annotationName: annotation.annotationName,
                    annotationResult: hitResults,
                    customCategories: parsedResult.customCategories
                  };
                });
            
                // 仅在annotations不为空时添加
                if (annotationDetails.length > 0) {
                    groupData.push({
                        imageName,
                        imageUrl,
                        annotations: annotationDetails
                    });
                }
            }
    
            // 仅在groupData不为空时添加
            if (groupData.length > 0) {
                projectData.push({
                    [groupName]: groupData
                });
            }
        }
    
        // 仅在projectData不为空时添加
        if (projectData.length > 0) {
            transformedData[projectName] = projectData;
        }
      }


      for (const [projectName, jsonInfo] of Object.entries(transformedData)){
        let jsonFileName = projectName + '.json'
        let fileToSave = new Blob([JSON.stringify(jsonInfo, null, 4)], {
          type: 'application/json',
        })
        zip.file(jsonFileName, fileToSave, {blob: true})
      }

      zip.generateAsync({ type: "blob" }).then(blob => {
        saveAs(blob, "tagInfo.zip")
      });
    }
    setLoading(false)
  }

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

  return (
    <Spin spinning={loading}>
      <div style={{width: '100%'}}>
        <div className={styles.titleWrap} style={{background: `transparent url(${Banner}) center center no-repeat`, backgroundSize: 'cover'}}>
          <p style={{fontSize: '40px', fontWeight:'bolder', color:'#fff', marginBottom:'0'}}>简单易用的标注工具，提升数据标注效率</p>
          <p style={{fontSize: '40px', fontWeight:'bolder', color:'#fff', marginBottom:'20px'}}>助力医学数据标注，轻松生成高质量结果</p>
          <div style={{ paddingTop: '6px', marginLeft: 'auto', width: '100%', display: 'flex', justifyContent: 'center'}}>
            <Input
                value={key}
                style={{width: '40%', height: '60px'}}
                prefix={<SearchOutlined style={{color: '#5cc1bb', fontSize: '20px'}}/>} 
                placeholder={t('keyword')}
                size="large"
                onChange={e => setKey(e.target.value)}
                onKeyUp={allSearch}/>
            {/* <Select
                size="large"
                className={styles.customSelect}
                style={{width: '10%'}}
                defaultValue="all"
                onChange={value => {
                  setImageTypeFilter(value)
                }}
            >
                <Select.Option value="all">所有数据类别</Select.Option>
                <Select.Option value="normal">自然图片</Select.Option>
                <Select.Option value="dicom">dicom图片</Select.Option>
                <Select.Option value="mrxs">病理图片</Select.Option>
            </Select>
            <Select
                size="large"
                className={styles.customSelect}
                style={{width: '10%', height: '60px'}}
                defaultValue="all"
                onChange={value => {
                  setTaskTypeFilter(value)
                }}
            >
                <Select.Option value="all">所有任务类别</Select.Option>
                <Select.Option value="IMAGE_CLASSIFICATION">分类</Select.Option>
                <Select.Option value="IMAGE_DETECTION_IMAGE_SEGMENTATION">分割与检测</Select.Option>
            </Select> */}
            <Button type="primary" onClick={handleSearch} size="large" disabled={loading}
                    style={{marginLeft: '10px', height: '60px', width: '120px', backgroundColor:'#2cad2c', borderColor: 'green', fontSize:'20px'}}>搜索</Button>
          </div>
          {/* <SearchBar setKeyWord={setKeyWord} setImageTypeFilter={setImageTypeFilter} setTaskTypeFilter={setTaskTypeFilter}></SearchBar> */}
        </div>
        <div style={{padding: '30px 60px', flex: 1, minHeight:'88vh'}}>
          <div style={{ width: '95%', display: 'flex', alignItems: 'center'}}>
            <div style={{ paddingTop: '6px', marginLeft: 'auto', marginBottom: '20px' }}>
              <VButton
                size="small"
                color="#308014"
                onClick={() => setIsCreateProjectModalOpen(true)}
                icon={<PlusOutlined />}
              >
                {t('New')}
              </VButton>
              <VButton
                  size="small"
                  color="#308014"
                  onClick={async()=>{
                    const res = await searchProject()
                    setDownloadProject(res.data.content)
                    setDownloadModalOpen(true)
                  }}
                  style={{marginLeft: '10px'}}
              >
                {"批量下载"}
              </VButton>
              <DownloadDataModal
                open={downloadModalOpen}
                onOk={(projectList)=>{
                  setDownloadModalOpen(false)
                  quickDownload(projectList)
                }}
                onCancel={()=>{setDownloadModalOpen(false)}}
                title={"批量下载"}
                okText={"下载"}
                projects={downloadProject}
              />
            </div>
          </div>
          {currentUserProjects?.length > 0 ? (
            <>
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {currentUserProjects.map((project, index) => (
                  <SingleProject key={index} deleteProject={deleteProjectModals} projectDetails={project} keyword={key} page={currentPage} size={currentPageSize}/>
                ))}
              </div>
              <ConfigProvider locale={zhCN}>
                <Pagination
                  current={currentPage}
                  showQuickJumper
                  showSizeChanger
                  onShowSizeChange={(current, size) => {
                    setCurrentPage(current)
                    setCurrentPageSize(size)
                  }}
                  pageSizeOptions={['10', '20', '30', '40', '50']} // 修改这里
                  defaultCurrent={1}
                  defaultPageSize={10}
                  total={currentUserProjectsLength}
                  onChange={onChange}
                  style={{
                    alignSelf: 'center',
                    width: '100%',
                    justifyContent: 'center',
                    display: 'flex',
                  }}
                />
              </ConfigProvider>
            </>
          ) : (
            <Empty
              style={{ marginTop: '50px' }}
              description={<h2 className={styles.noItems}>数据集列表为空</h2>}
            >
              <Button type="primary" onClick={() => setIsCreateProjectModalOpen(true)}>
                请创建一个数据集
              </Button>
            </Empty>
          )}
        </div>
        <ProjectCreateModal 
          open={isCreateProjectModalOpen}
          onCreate={async (values, imageType) => {
              const projectRes = await searchProject()
              const allProjects = projectRes.data.content
              const matchingProject = allProjects.find(p => p.projectName === values.project_name)
              
              if(matchingProject && matchingProject.length !== 0){
                Modal.error({
                  title: '该数据集名称已存在！',
                  content: '请更换一个数据集名称',
                });
                return
              }

              const res = await createProject([{
                projectName: values.project_name,
                projectDescription: values.instructions,
                imageTypeId: imageType,
                categories: values.tagsList
              }])

              setIsCreateProjectModalOpen(false);
              if (!res.err) {
                message.success('创建成功')
                setCurrentPage(-1)  // currentPage = 1 的时候渲染数据
                setCurrentPage(1)
              } else {
                message.error(res || '创建失败')
              }
          }}
          onCancel={()=>{setIsCreateProjectModalOpen(false)}}
          title={"创建数据集"}
          okText={"创建"}
          AllImageType={AllImageType}
        />
      </div>    
    </Spin>
  )
}

export default MyProjects
