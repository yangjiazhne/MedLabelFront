import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Image, Divider, Col, Row, Table, Modal, Input, Form, Dropdown, Checkbox, Empty, ConfigProvider, Pagination, message, Select, Upload, Button, Progress, Space, Tag, Alert, notification  } from 'antd'
import { EllipsisOutlined, RedoOutlined, PlusSquareOutlined, ExportOutlined, MenuOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { imgError, groupOperateItems, singleGroupOperateItems, imageListColumnns } from './config'
import { useHistory, useParams } from 'react-router-dom'
import styles from './index.module.scss'
import { copyToClip, getStrWithLen } from '@/helpers/Utils'
import { VButton } from '@/components'
import zhCN from 'antd/lib/locale/zh_CN'
import { updateGroup, createGroup, deleteGroup, searchGroup} from '@/request/actions/group'
import { updateImage, uploadImage, uploadImageFolder, deleteImage, searchImage } from '@/request/actions/image'
import { uploadJson, uploadJsonFolder } from '@/request/actions/annotation'

const { TextArea } = Input;
const { Dragger } = Upload
const { Search } = Input;
const CheckboxGroup = Checkbox.Group;
const { confirm } = Modal;

// 新建/编辑分组Modal Form
const GroupCreateForm = ({ open, onCreate, onCancel, title, okText, isEdit=false, editGroup}) => {
    const [form] = Form.useForm();
    
    if(isEdit){
        form.setFields([
            { name: 'name', value: editGroup?.imageGroupName },
            { name: 'description', value: editGroup?.description },
        ])
    }
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
              form.resetFields();
              onCreate(values);
            })
            .catch((info) => {
              console.log('Validate Failed:', info);
            });
        }}
      >
        <Form
          form={form}
          layout="vertical"
          name="GroupCreateForm"
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[
              {
                required: true,
                message: '请输入分组名称!',
              },
            ]}
          >
            <Input showCount placeholder="最大长度为20个字符" maxLength={20}/>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea showCount maxLength={100}/>
          </Form.Item>
        </Form>
      </Modal>
    )
}

// 删除分组Modal
const GroupDeleteForm = ({open, onDelete, onCancel, currentProjectGroups}) => {
    const showDeleteConfirm = () => {
      const deleteGroups = currentProjectGroups.filter(group => checkedList.includes(group.imageGroupId));
      confirm({
        title: '确定删除以下分组?',
        icon: <ExclamationCircleOutlined />,
        content: (<div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {deleteGroups.map((item, index) => (
              <div key={index}>{item.imageGroupName}</div>
          ))}
        </div>),
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        async onOk() {
          const resList = await Promise.all(
            checkedList.map(async (groupId) => {
              // 假设 deleteGroup 发送请求并返回一个 Promise
              return await deleteGroup(groupId);
            })
          );

          // 遍历响应，判断是否有任何错误
          const hasError = resList.some(res => res.err)
          onDelete()
          if (!hasError) {
            message.success('删除成功')
          } else {
            message.error('删除失败')
          }
        }
      });
    };
    const [checkedList, setCheckedList] = useState([]);
    const [indeterminate, setIndeterminate] = useState(false);
    const [checkAll, setCheckAll] = useState(false);
    const onChange = (list) => {
      setCheckedList(list);
      setIndeterminate(!!list.length && list.length < currentProjectGroups.length);
      setCheckAll(list.length === currentProjectGroups.length);
    };
    const onCheckAllChange = (e) => {
      setCheckedList(e.target.checked ? currentProjectGroups.map(group => group.imageGroupId) : []);
      setIndeterminate(false);
      setCheckAll(e.target.checked);
    };
    return (
      <Modal
        open={open}
        title="删除分组"
        okText="删除选中"
        cancelText="取消"
        onCancel={onCancel}
        destroyOnClose
        okButtonProps={{ disabled: checkedList.length === 0 }}
        okType="danger"
        onOk={()=>{
            showDeleteConfirm()
        }}
      >
        <div style={{ boxShadow: '0 0 15px #ededed', padding: '10px', borderRadius: '4px' }}>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                全部选中
            </Checkbox>
            <Divider style={{ marginTop: '5px', marginBottom: '5px'}} />
            <div style={{maxHeight: '250px', overflowY: 'auto'}}>
                <CheckboxGroup value={checkedList} onChange={onChange}>
                    {currentProjectGroups.map(group => (
                        <div key={group.imageGroupId} style={{ marginBottom: '4px' }}>
                            <Checkbox value={group.imageGroupId}>{group.imageGroupName}</Checkbox>
                        </div>
                    ))}
                </CheckboxGroup>
            </div>
        </div>
      </Modal>
    )
}

// 移动图像Modal
const ImgMoveForm = ({open, onOk, onCancel, projectId, moveImages, projectGroups, group}) => {
    const [checkedList, setCheckedList] = useState([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)
    const [moveGroup, setMoveGroup] = useState(null)
    const onChange = (list) => {
      setCheckedList(list);
      setIndeterminate(!!list.length && list.length < moveImages.length);
      setCheckAll(list.length === moveImages.length);
    };
    const onCheckAllChange = (e) => {
      setCheckedList(e.target.checked ? moveImages.map(hit => hit.imageId) : []);
      setIndeterminate(false);
      setCheckAll(e.target.checked);
    };
    const handleSelectChange = (value) => {
      setMoveGroup(value)
    };
    const options = projectGroups.map(g => ({ label: g.imageGroupName, value: g.imageGroupId, disabled: g.imageGroupId === group?.imageGroupId }));

    return (
      <Modal
        open={open}
        title="移动图像"
        okText="移动"
        cancelText="取消"
        onCancel={()=>{
          onCancel()
          setCheckedList([])
          setIndeterminate(false)
          setCheckAll(false)
          setMoveGroup(null)
        }}
        destroyOnClose
        okButtonProps={{ disabled: (checkedList.length === 0 || !moveGroup) }}
        onOk={async ()=>{
            const data = checkedList.map(image => ({
              imageId: image,
              newImageGroupId: moveGroup
            }));
            const res = await updateImage(data)
            setCheckedList([])
            setIndeterminate(false)
            setCheckAll(false)
            setMoveGroup(null)
            if (!res.err) {
              message.success('修改成功')
              onOk();
            } else {
              message.error(res || '修改失败')
            }
        }}
      >
        <div style={{ boxShadow: '0 0 15px #ededed', borderRadius: '4px'}}>
        <div style={{ padding: '10px'}}>
          移动至
          <Select
            placeholder="选择一个分组"
            style={{ width: 250, marginLeft:'20px' }}
            onChange={handleSelectChange}
            options={options}
          />
        </div>
        <div style={{ padding: '10px'}}>
            <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
                全部选中
            </Checkbox>
            <Divider style={{ marginTop: '5px', marginBottom: '5px'}} />
            <div style={{maxHeight: '250px', overflowY: 'auto', width: '100%'}}>
                <CheckboxGroup value={checkedList} onChange={onChange} style={{width: '100%'}}>
                    {moveImages?.map(hit => {
                        const isChecked = checkedList.includes(hit.imageId);
                        return (<div key={hit.imageId} 
                                      style={{
                                              marginBottom: '4px',
                                              backgroundColor: isChecked ? '#f0f0f0' : 'transparent',
                                              padding: '4px',
                                              borderRadius: '4px',
                                            }}>
                                    <Checkbox value={hit.imageId} style={{alignItems: 'center'}}>
                                        <div style={{display:'flex', alignItems: 'center'}}>
                                            <Image
                                                src={hit.imageUrl}
                                                fallback={imgError}
                                                preview={ false }
                                                style={{ height: '40px', width: '40px', marginLeft: '8px', marginRight: '8px'}}
                                            />
                                            <div>{getStrWithLen(hit?.imageName, 50)}</div>
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

// 上传图像Modal
const ImageUploadForm = ({open, onCreate, onCancel, title, okText, imageType, options}) => {
  const [form] = Form.useForm()
  
  const [txtFile, setTxtFile] = useState(null)

  const beforeUpload = file => {
    setTxtFile(file)
    return false
  }

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
            onCreate(values, txtFile);
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
        name="ImageUploadForm"
      >
        <Form.Item
          label="分组名称"
          name="group"
          rules={[
            {
              required: true,
              message: '必须选择分组',
            },
          ]}
        >
            <Select
              style={{ width: '100%' }}
              options={options}
            ></Select>
        </Form.Item>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ opacity: '0.7', fontSize: '17px' }}>
          {imageType === 1 && (
            <p>
              请上传一个<strong>自然图像</strong>所在路径的文本文件, 文本文件的每行为<strong>图片的绝对路径</strong>或<strong>图片所在文件夹</strong>的绝对路径
            </p>
          )}
          {imageType === 2 && (
            <p>
              请上传一个<strong>数字医学图像</strong>文本文件, 文本文件的每行为<strong>图片的绝对路径</strong>或<strong>图片所在文件夹</strong>的绝对路径
            </p>
          )}
          {imageType === 3 && (
            <p>
              请上传一个<strong>病理图</strong>文本文件, 文本文件的每行为<strong>图片的绝对路径</strong>或<strong>图片所在文件夹</strong>的绝对路径
            </p>
          )}
          </div>
          <Dragger
            beforeUpload={beforeUpload}
            showUploadList={true}
            maxCount={1} 
            accept=".txt"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域</p>
          </Dragger>
        </div>
      </Form>
    </Modal>
  )
}

// 上传JSON Modal
const JsonUploadForm = ({open, onCreate, onCancel, title, okText, options}) => {
  const [form] = Form.useForm()
  
  const [txtJsonFile, setTxtJsonFile] = useState(null)

  const beforeUpload = file => {
    setTxtJsonFile(file)
    return false
  }

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
            onCreate(values, txtJsonFile);
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
        name="ImageUploadForm"
      >
        <Form.Item
          label="分组名称"
          name="group"
          rules={[
            {
              required: true,
              message: '必须选择分组',
            },
          ]}
        >
            <Select
              style={{ width: '100%' }}
              options={options}
            ></Select>
        </Form.Item>
        <div style={{ marginBottom: '15px' }}>
          <Dragger
            beforeUpload={beforeUpload}
            showUploadList={true}
            maxCount={1} 
            accept=".txt"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域</p>
          </Dragger>
        </div>
      </Form>
    </Modal>
  )
}

// 删除图像Modal
const ImageDeleteForm = ({open, onDelete, onCancel, groupImages}) => {
  const showDeleteConfirm = () => {
    const deleteImages = groupImages.filter(image => checkedList.includes(image.imageId));
    confirm({
      title: '确定删除以下分组?',
      icon: <ExclamationCircleOutlined />,
      content: (<div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {deleteImages.map((item, index) => (
            <div key={index}>{item.imageName}</div>
        ))}
      </div>),
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        const res = await deleteImage({imageIds : checkedList})
        onDelete()
        if (!res.err) {
          message.success('删除成功')
          setCheckedList([])
          setIndeterminate(false)
          setCheckAll(false)
        } else {
          message.error('删除失败')
        }
      }
    });
  };
  const [checkedList, setCheckedList] = useState([])
  const [indeterminate, setIndeterminate] = useState(false)
  const [checkAll, setCheckAll] = useState(false)
  const onChange = (list) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < groupImages.length);
    setCheckAll(list.length === groupImages.length);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? groupImages.map(hit => hit.imageId) : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <Modal
      open={open}
      title="删除图像"
      okText="删除选中"
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
        showDeleteConfirm()
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
                    {groupImages?.map(hit => {
                        const isChecked = checkedList.includes(hit.imageId);
                        return (<div key={hit.imageId} 
                                      style={{
                                              marginBottom: '4px',
                                              backgroundColor: isChecked ? '#f0f0f0' : 'transparent',
                                              padding: '4px',
                                              borderRadius: '4px',
                                            }}>
                                    <Checkbox value={hit.imageId} style={{alignItems: 'center'}}>
                                        <div style={{display:'flex', alignItems: 'center'}}>
                                            <Image
                                                src={hit.imageUrl}
                                                fallback={imgError}
                                                preview={ false }
                                                style={{ height: '40px', width: '40px', marginLeft: '8px', marginRight: '8px'}}
                                            />
                                            <div>{getStrWithLen(hit?.imageName, 50)}</div>
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

// 图像转化进度状态Modal
const TaskProgressModal = ({open, onOk, onCancel, taskDetails}) => {
  const columns = [
    {
      title: '分组名称',
      dataIndex: 'imageGroupName',
      key: 'imageGroupName',
      width: '25%',
      align: 'center',
      render: text => <span style={{ fontWeight: 'bold' }}>{text}</span>
    },
    {
      title: '进度',
      dataIndex: 'Progress',
      key: 'progress',
      width: '50%',
      align: 'center',
      render: (text, record) => {
        let percent = ((record.SuccessNum + record.FailedNum) / record.TotalNum) * 100
        if(record.TotalNum === 0) percent = 100
        percent = parseFloat(percent.toFixed(1))
        return (
          <Progress
            percent={percent}
            status={percent < 100 ? 'active' : record.FailedNum > 0 ? 'exception' : 'success'}
          />
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'Status',
      key: 'status',
      width: '25%',
      align: 'center',
      render: (text, record) => {
        return (
          <div>
            <Space>
              <Tag color="green">{record.SuccessNum}创建完成</Tag>
              <Tag color="geekblue">{record.OngoingNum}进行中</Tag>
              <Tag color="red">{record.FailedNum}创建失败</Tag>
            </Space>
          </div>
        )
      },
    },
  ];

  return (<Modal
    open={open}
    title="图像上传进度"
    okText="确定"
    cancelText="取消"
    onCancel={()=>{onCancel()}}
    onOk={()=>{onOk()}}
    width={800}
    style={{maxHeight: '400px', minHeight: '200px'}}
  >
    {!taskDetails || taskDetails.length === 0 ? (
        <Empty style={{ marginTop: '50px' }} description={<h2>任务列表为空</h2>}></Empty>
      ) : (
        <Table columns={columns} dataSource={taskDetails} rowKey={record => record.imageGroupId} pagination={{defaultPageSize: 5}}/>
      )}
  </Modal>)
}

const DataList = ({currentPage, setCurrentPage, currentPageSize, setCurrentPageSize}) => {
    const {
        projectDetails,   //当前数据集详情
        currentProjectGroups,   //当前数据集所有的组
        currentGroup, // 当前组
        currentGroupImages,  //当前组的图片
        currentGroupImageLength  //当前组的图片的数量
      } = useSelector(
        // @ts-ignore
        state => state.project
      )

    const { userDetail } = useSelector(state => state.user)

    const dispatch = useDispatch()
    const history = useHistory()
    // @ts-ignore
    let { projectId } = useParams()

    const lastEditImageId = parseInt(localStorage.getItem("lastEditImageId"))
    const lastViewImageId = parseInt(localStorage.getItem("lastViewImageId"))

    const readFile = async file => {
      return new Promise(function (resolve, reject) {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
  
        reader.onerror = () => {
          reject(reader.error)
        }
  
        reader.readAsText(file)
      })
    }


    // //控制当前页数
    // const [currentPage, setCurrentPage] = useState(1)
    // //每页显示数据集个数
    // const [currentPageSize, setCurrentPageSize] = useState(10)

    // const onChange: PaginationProps['onChange'] = pageNumber => {
    //   setCurrentPage(pageNumber)
    //   refreshImage(pageNumber - 1, currentPageSize)
    // }
    const [isPageSizeChanging, setIsPageSizeChanging] = useState(false);

    const refreshImage = async(page, size) => {
      const imageRes = await searchImage(currentGroup.imageGroupId,undefined,undefined,undefined,undefined,page,size)
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: imageRes.data.content
      })
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
        payload: imageRes.data.totalElements
      })
    }

    const [imageDatas, setImageDatas] = useState(null)  // 用于在table中进行展示
    useEffect(() => {
      if(currentGroupImages?.length > 0){
        const transformedImages = currentGroupImages.map((item, index) => {
          if(projectDetails.imageType.imageTypeName === '病理图'){
            return {
              ...item, // Keep existing properties
              imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
              imageUrl: `/uploads/${projectId}/${item.imageName}/deepzoom/imgs/10/0_0.jpeg`,
              index: (index + 1).toString().padStart(2, '0')
            };
          }else{
            return {
              ...item,
              imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
              imageUrl: `/uploads/${projectId}/thumbnail/${item.imageName}.png`,
              index: (index + 1).toString().padStart(2, '0')
            };            
          }

        })

        setImageDatas(transformedImages);
      }
    },[currentGroupImages])

    // 图像、分组相应的增删改查操作
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false)
    const [editGroup, setEditGroup] = useState(currentGroup)
    const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false)
    const [isMoveImgModalOpen, setIsMoveImgModalOpen] = useState(false)
    const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false)
    const [isUploadJsonModalOpen, setIsUploadJsonModalOpen] = useState(false)
    const [isDeleteImageModalOpen, setIsDeleteImageModalOpen] = useState(false)
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false)

    const [moveImages, setMoveImages] = useState(null)
    const [deleteImages, setDeleteImages] = useState(null)
    const [groupOptions, setGroupOptions] = useState([])
    const [taskDetails, setTaskDetails] = useState(null)
    // 数据集创建任务全部结束 任务列表为空 或 任务全部完成/失败
    const taskDetailsFetchEnd = useMemo(() => {
      return (
        !taskDetails ||
        (taskDetails.length > 0 && taskDetails.filter(task => task.SuccessNum + task.FailedNum < task.TotalNum).length === 0)
      )
    }, [taskDetails])

    // 定时刷新任务详情
    useEffect(() => {
      if (showTaskDetailModal && taskDetails && !taskDetailsFetchEnd) {
        const intervalId = setInterval(async () => {
          let _taskDetails = await fetchTaskDetails()   // 获取当前任务的详情
          setTaskDetails(_taskDetails)
        }, 5000)

        return () => {
          clearInterval(intervalId)
        }
      }
    }, [taskDetailsFetchEnd, showTaskDetailModal])

    // 获取任务详情
    const fetchTaskDetails = async () => {
       
      const result = await searchGroup(projectId)

      const { content, imageStatus } = result.data;

      return content.map((group, index) => {
        const status = imageStatus[index];
        const [notUploaded, ongoing, success, failed, tagged] = status;
        
        return {
          imageGroupId: group.imageGroupId,
          imageGroupName: group.imageGroupName,
          TotalNum: status.reduce((acc, cur) => acc + cur, 0), // 计算总数
          SuccessNum: success + tagged,
          OngoingNum: notUploaded + ongoing,
          FailedNum: failed
        };
      });
    }

    useEffect(() => {
      if(!currentProjectGroups || currentProjectGroups.length === 0) return
      const value = currentProjectGroups?.map(group => ({
        value: group.imageGroupId,
        label: group.imageGroupName
      }));
      setGroupOptions(value)
    }, [currentProjectGroups])

    // 查询分组操作
    const onSearchGroup = async(value) => {
      // 条件查询项目的组
      const projectGroupsRes= await searchGroup(projectId, undefined, value.trim())
      console.log(projectGroupsRes)
      dispatch({
        type: 'UPDATE_CURRENT_PROJECT_GROUPS',
        payload: projectGroupsRes.data.content,
      })
      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: projectGroupsRes.data.content[0],
      })
      
      // 获取index为0的组下所有的图片信息
      setCurrentPage(1)
      if(projectGroupsRes.data.content[0]){
        const imageRes = await searchImage(projectGroupsRes.data.content[0].imageGroupId,undefined,undefined,undefined,undefined,0,currentPageSize)
        dispatch({
          type: 'UPDATE_CURRENT_GROUP_IMAGES',
          payload: imageRes.data.content
        })
        dispatch({
          type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
          payload: imageRes.data.totalElements
        })
      }else{
        dispatch({
          type: 'UPDATE_CURRENT_GROUP_IMAGES',
          payload: []
        })
        dispatch({
          type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
          payload: 0
        })
      }

    }

    // 对分组进行批量删除、增加
    const groupOperate = ({ key }) => {
      if(key === 'delete'){
        setIsDeleteGroupModalOpen(true)
      }
      if(key === 'add'){
        setIsAddGroupModalOpen(true)
      }
    };

    //对单个分组进行编辑、删除
    const singleGroupOperate = (group, key) => {
      if(key === 'edit'){
        setIsEditGroupModalOpen(true)
        setEditGroup(group)
      }
      if(key === 'delete'){
        Modal.confirm({
          title: '确认',
          icon: <ExclamationCircleOutlined />,
          content: '确定要删除该分组吗？',
          okText: '确认',
          cancelText: '取消',
          onOk: async () => {
            const res = await deleteGroup(group.imageGroupId)
            if (!res.err) {
              message.success('数据集删除成功')
              fetchGroupAndImage()
            } 
          },
        })
      }
    };

    const fetchGroupAndImage = async() =>{
      // 获取项目所有的组
      const projectGroupsRes= await searchGroup(projectId)
      console.log(projectGroupsRes)
      dispatch({
        type: 'UPDATE_CURRENT_PROJECT_GROUPS',
        payload: projectGroupsRes.data.content,
      })

      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: projectGroupsRes.data.content[0],
      })
      
      // 获取index为0的组下所有的图片信息
      setCurrentPage(1)
      const imageRes = await searchImage(projectGroupsRes.data.content[0].imageGroupId,undefined,undefined,undefined,undefined,0,currentPageSize)
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: imageRes.data.content
      })
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
        payload: imageRes.data.totalElements
      })

    }

    const openNotification = (placement) => {
      notification.info({
        message: '注意',
        description:
          '请先选择分组，并确保分组内的图像名称不存在重复，且上传的JSON文件与选择分组下的图像一一对应！',
        placement,
        style: {
          zIndex: 1001,
        },
        icon: (
          <ExclamationCircleOutlined
            style={{
              color: '#ffe58f',
            }}
          />
        ),
        duration: 0,
      });
    };

    const switchLastViewOrEdit = async (type) => {
      message.warning("功能正在开发中！")
      return


      let imageId
      if(type === 'view'){
        imageId = parseInt(localStorage.getItem("lastViewImageId"))
      }else if (type === 'edit'){
        imageId = parseInt(localStorage.getItem("lastEditImageId"))
      }

      if(!imageId){
        type === "view" ? message.warning("没有最新查看图像的记录") : message.warning("没有最新编辑的图像记录")
        return
      }

      const res = await searchImage(46, undefined, imageId)

      const imgRes =  res.data.content[0]

      const gId = imgRes.imageGroup.imageGroupId

      const exist = currentProjectGroups.some(group => group.imageGroupId === gId);

      if(!exist){
        type === "view" ? message.warning("最新一次查看的图像不在此数据集内") : message.warning("最新一次编辑的图像不在此数据集内")
        return
      }

      const group = currentProjectGroups.find(g => g.imageGroupId === gId);

      dispatch({
        type: 'UPDATE_CURRENT_GROUP',
        payload: group,
      })

      const imageAllRes = await searchImage(gId)
      const imageAll = imageAllRes.data.content

      //查看当前imageAllRes在第几页
      const index = imageAll.findIndex(i => i.imageId === imageId)

      if (index === -1) { // 确保找到了目标元素
        message.warning("未找到对应图像")
        return
      }

      const imagePage = Math.floor(index / currentPageSize);
      console.log(`当前图片位于第 ${imagePage} 页`);

      setCurrentPage(imagePage+1)
      const imageRes = await searchImage(group.imageGroupId, undefined, undefined, undefined, undefined, imagePage, currentPageSize)
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGES',
        payload: imageRes.data.content
      })
      dispatch({
        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
        payload: imageRes.data.totalElements
      })
      message.success("已为您定位到图像位置")
    }

    return(
        <div className={styles.DataGroupListContainer}>
            <Row>
                <Col span={6}>
                    {/* 分组信息 */}
                    <div className={styles.groupContainer}>
                        {/* 编辑分组 */}
                        <div className={styles.groupHeader}>
                            <div>
                              <Dropdown
                                menu={{
                                  items: groupOperateItems,
                                  onClick: groupOperate
                                }}
                              >
                                <MenuOutlined style={{ color: '#5ab1ff', fontSize: '22px', marginRight: '8px'}}/>
                              </Dropdown>
                              <span style={{color: '#555', fontSize: '20px', fontWeight: 700 }}>{getStrWithLen(projectDetails.projectName,12)}</span>
                            </div>
                            <GroupDeleteForm
                                open={isDeleteGroupModalOpen}
                                onDelete={
                                  ()=>{
                                    setIsDeleteGroupModalOpen(false)
                                    fetchGroupAndImage()
                                  }}
                                onCancel={()=>{setIsDeleteGroupModalOpen(false)}}
                                currentProjectGroups={currentProjectGroups}
                            />
                            <GroupCreateForm 
                                open={isAddGroupModalOpen}
                                onCreate={async (values) => {
                                  const matchingGroup = currentProjectGroups.find(
                                    group => group.imageGroupName === values.name
                                  )
                                  if(matchingGroup){
                                    Modal.error({
                                      title: '该分组名称已存在！',
                                      content: '请更换一个分组名称',
                                    });
                                    return
                                  }
                                  const res = await createGroup({
                                    projectId: projectId,
                                    targetGroups:[
                                      {
                                        name: values.name,
                                        description: values.description
                                      },
                                    ]
                                  })
                                  setIsAddGroupModalOpen(false);
                                  if (!res.err) {
                                    message.success('创建成功')
                                    const projectGroupsRes= await searchGroup(projectId)
                                    dispatch({
                                      type: 'UPDATE_CURRENT_PROJECT_GROUPS',
                                      payload: projectGroupsRes.data.content,
                                    })
                                  } else {
                                    message.error(res || '创建失败')
                                  }
                                }}
                                title={"新建分组"}
                                okText={"创建"}
                                onCancel={()=>{setIsAddGroupModalOpen(false)}}
                                isEdit={false}
                            />
                        </div>
                        <Divider style={{ marginTop: '5px', marginBottom: '10px'}} />
                        <div style={{marginBottom: '10px'}}>
                          <Search
                            placeholder="输入关键词搜索"
                            allowClear
                            enterButton="搜索"
                            size="large"
                            onSearch={onSearchGroup}
                          />
                        </div>
                        {/* 分组导航 */}
                        <div className={styles.groupWrap}>
                            {currentProjectGroups.map((group, index) => (
                                <div className={styles.groupWrapItem} 
                                     key={index}
                                     style={{backgroundColor: `${currentGroup?.imageGroupId === group.imageGroupId ? '#f2f4f7' : '#fff'}` }}>
                                    <div className={styles.groupWrapItemName}
                                          onClick={async ()=>{
                                            dispatch({
                                              type: 'UPDATE_CURRENT_GROUP',
                                              payload: group,
                                            })
                                            setCurrentPage(1)
                                            const imageRes = await searchImage(group.imageGroupId, undefined, undefined, undefined, undefined, 0, currentPageSize)
                                            dispatch({
                                              type: 'UPDATE_CURRENT_GROUP_IMAGES',
                                              payload: imageRes.data.content
                                            })
                                            dispatch({
                                              type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
                                              payload: imageRes.data.totalElements
                                            })
                                          }}
                                        >
                                        {getStrWithLen(group.imageGroupName, 15)}
                                    </div>
                                    <div className={styles.editGroupItem}>
                                      <Dropdown
                                        menu={{
                                          items: singleGroupOperateItems,
                                          onClick: ({ key }) => singleGroupOperate(group, key)
                                        }}
                                      >
                                        <EllipsisOutlined style={{ color: '#1890ff' }} />
                                      </Dropdown>
                                    </div>
                                </div>
                            ))}
                            <GroupCreateForm 
                                open={isEditGroupModalOpen}
                                onCreate={async (values) => {
                                    const matchingGroup = currentProjectGroups.find(
                                      group => group.imageGroupName === values.name
                                    );
                                    if(matchingGroup && matchingGroup.imageGroupId!==editGroup.imageGroupId){
                                      Modal.error({
                                        title: '该分组名称已存在！',
                                        content: '请更换一个分组名称',
                                      });
                                      return
                                    }
                                    const res = await updateGroup({targetGroups: [
                                      {
                                        groupId: editGroup.imageGroupId,
                                        projectId: projectId,
                                        name: values.name,
                                        description: values.description
                                      }]})
                                    setIsEditGroupModalOpen(false);
                                    if (!res.err) {
                                      message.success('修改成功')
                                      // 获取项目所有的组
                                      const projectGroupsRes= await searchGroup(projectId)
                                      dispatch({
                                        type: 'UPDATE_CURRENT_PROJECT_GROUPS',
                                        payload: projectGroupsRes.data.content,
                                      })
                                      const gp = projectGroupsRes.data.content.find(group => group.imageGroupId === currentGroup.imageGroupId)
                                      dispatch({
                                        type: 'UPDATE_CURRENT_GROUP',
                                        payload: gp,
                                      })
                                    } else {
                                      message.error(res || '修改失败')
                                    }
                                  }}
                                onCancel={()=>{setIsEditGroupModalOpen(false)}}
                                title={"编辑组信息"}
                                okText={"完成"}
                                isEdit={true}
                                editGroup={editGroup}
                            />
                        </div>
                    </div>
                </Col>
                <Col span={1}></Col>
                <Col span={17}>
                    {/* 图像展示 */}
                    <div className={styles.dataContainer}>
                        {/* 图像上传 */}
                        <div className={styles.dataHeader}>
                            <div style={{ color: 'rgba(0, 0, 0, 0.85)', fontWeight: 'bold', fontSize: '16px' }}>
                                数据列表
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                              <VButton
                                  color="#69c0ff"
                                  style={{marginRight: '5px'}}
                                  icon={<EditOutlined style={{ color: 'white' }} />}
                                  onClick={() => {switchLastViewOrEdit("edit")}}
                              >
                                最新编辑
                              </VButton>
                              <VButton
                                  color="#85a5ff"
                                  style={{marginRight: '5px'}}
                                  icon={<EyeOutlined style={{ color: 'white' }} />}
                                  onClick={() => {switchLastViewOrEdit("view")}}
                              >
                                最新查看
                              </VButton>
                              <VButton
                                  color="#FFA500"
                                  style={{marginRight: '5px'}}
                                  icon={<RedoOutlined style={{ color: 'white' }} />}
                                  onClick={async() => {
                                    const _taskDetails = await fetchTaskDetails()
                                    setTaskDetails(_taskDetails)  // 该条任务详情信息
                                    console.log(_taskDetails)
                                    setShowTaskDetailModal(true)
                                  }}
                              >
                                上传进度
                              </VButton>
                              <VButton
                                  color="#ff0000"
                                  style={{marginRight: '5px'}}
                                  icon={<DeleteOutlined style={{ color: 'white' }} />}
                                  onClick={async()=>{
                                    if(currentGroupImages.length === 0){
                                      message.error("当前分组下暂无数据！")
                                      return
                                    }
                                    const imageRes = await searchImage(currentGroup.imageGroupId)
                                    const transformedImages = imageRes.data.content.map((item, index) => {
                                      if(projectDetails.imageType.imageTypeName === '病理图'){
                                        return {
                                          ...item, // Keep existing properties
                                          imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
                                          imageUrl: `/uploads/${projectId}/${item.imageName}/deepzoom/imgs/10/0_0.jpeg`,
                                          index: (index + 1).toString().padStart(2, '0')
                                        };
                                      }else{
                                        return {
                                          ...item,
                                          imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
                                          imageUrl: `/uploads/${projectId}/thumbnail/${item.imageName}.png`,
                                          index: (index + 1).toString().padStart(2, '0')
                                        };            
                                      }
                            
                                    })
                                    setDeleteImages(transformedImages)
                                    setIsDeleteImageModalOpen(true)
                                  }}
                              >
                                  删除
                              </VButton>
                              <VButton
                                  color="#1677ff"
                                  style={{marginRight: '5px'}}
                                  icon={<ExportOutlined style={{ color: 'white' }} />}
                                  onClick={async()=>{
                                    if(currentGroupImages.length === 0){
                                      message.error("当前分组下暂无数据！")
                                      return
                                    }
                                    const imageRes = await searchImage(currentGroup.imageGroupId)
                                    const transformedImages = imageRes.data.content.map((item, index) => {
                                      if(projectDetails.imageType.imageTypeName === '病理图'){
                                        return {
                                          ...item, // Keep existing properties
                                          imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
                                          imageUrl: `/uploads/${projectId}/${item.imageName}/deepzoom/imgs/10/0_0.jpeg`,
                                          index: (index + 1).toString().padStart(2, '0')
                                        };
                                      }else{
                                        return {
                                          ...item,
                                          imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
                                          imageUrl: `/uploads/${projectId}/thumbnail/${item.imageName}.png`,
                                          index: (index + 1).toString().padStart(2, '0')
                                        };            
                                      }
                            
                                    })
                                    setMoveImages(transformedImages)
                                    setIsMoveImgModalOpen(true)
                                  }}
                              >
                                  移动
                              </VButton>
                              <VButton
                                  color="#52c41a"
                                  style={{marginRight: '5px'}}
                                  icon={<PlusSquareOutlined style={{ color: 'white' }} />}
                                  onClick={() => {
                                    if(currentProjectGroups.length === 0){
                                      message.error("请先创建一个分组！")
                                      return
                                    }
                                    const value = currentProjectGroups?.map(group => ({
                                      value: group.imageGroupId,
                                      label: group.imageGroupName
                                    }));
                                    setGroupOptions(value)
                                    // history.push(projectDetails.imageType.imageTypeId === 1 ? 
                                    // `/userHome/project-file/${projectId}?type=Raw&imageType=${projectDetails.imageType.imageTypeId}` :
                                    // `/userHome/project-file/${projectId}?type=DcmOrMrxs&imageType=${projectDetails.imageType.imageTypeId}`)
                                    setIsUploadImageModalOpen(true)
                                  }}
                              >
                                  上传图像
                              </VButton>
                              <VButton
                                  color="#009688"
                                  icon={<PlusSquareOutlined style={{ color: 'white' }} />}
                                  onClick={() => {
                                    if(currentGroupImages.length ===0){
                                      message.error("请先上传图像！")
                                      return
                                    }
                                    
                                    const value = currentProjectGroups?.map(group => ({
                                      value: group.imageGroupId,
                                      label: group.imageGroupName
                                    }));
                                    setGroupOptions(value)
                                    setIsUploadJsonModalOpen(true)
                                    openNotification('top')
                                  }}
                              >
                                  上传标注
                              </VButton>
                            </div>
                            <ImgMoveForm 
                                open={isMoveImgModalOpen}
                                onOk={async() => {
                                    setIsMoveImgModalOpen(false);
                                    setCurrentPage(1)
                                    setCurrentPageSize(10)
                                    const imageRes = await searchImage(currentGroup.imageGroupId,undefined,undefined,undefined,undefined,0,10)
                                    dispatch({
                                      type: 'UPDATE_CURRENT_GROUP_IMAGES',
                                      payload: imageRes.data.content
                                    })
                                    dispatch({
                                      type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
                                      payload: imageRes.data.totalElements
                                    })
                                  }}
                                onCancel={()=>{setIsMoveImgModalOpen(false)}}
                                projectId={projectId}
                                moveImages={moveImages}
                                projectGroups={currentProjectGroups}
                                group={currentGroup}
                            />
                            <ImageUploadForm 
                              open={isUploadImageModalOpen}
                              onCreate={async (values, txtFile) => {
                                  const { group } = values
                                  
                                  if (!txtFile) {
                                    message.error('Please choose a txt file')
                                    return
                                  }

                                  const content = await readFile(txtFile)
                                  const lines = content
                                    .split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line !== '')
                                  const total = lines.length
                                  if (total < 1) {
                                    Modal.error({
                                      content: '输入的txt文件中无有效地址',
                                    })
                                    return 0
                                  }

                                  const imageList = [];
                                  const folderList = [];

                                  lines.forEach(path => {
                                    const lastPart = path.substring(path.lastIndexOf('/') + 1);  // 获取最后一个 "/" 之后的部分

                                    // 如果最后的部分包含 "."，则判断为文件（例如图片），否则判断为文件夹
                                    if (lastPart.includes('.')) {
                                      imageList.push(path);  // 这是一个文件（图片）
                                    } else {
                                      folderList.push(path); // 这是一个文件夹
                                    }
                                  });
                                  
                                  if (folderList.length > 0){
                                    try {
                                      const responses = await Promise.all(
                                        folderList.map(line => 
                                          uploadImageFolder({
                                            imageGroupId: group,
                                            imageTypeId: projectDetails.imageType.imageTypeId,
                                            imageFolderUrl: line,
                                          })
                                        )
                                      );
                                    } catch (error) {
                                      message.error("上传失败")
                                    }
                                  }
                            
                                  if (imageList.length > 0){
                                    const res = await uploadImage({
                                      imageGroupId: group,
                                      imageTypeId: projectDetails.imageType.imageTypeId,
                                      imageUrls: imageList
                                    })
                            
                                    if(res.err){
                                      message.error("上传失败")
                                    }
                                  }

                                  setIsUploadImageModalOpen(false);
                                  Modal.success({
                                    content: '数据正在上传中....',
                                    onOk: async() => {
                                      setCurrentPage(1)
                                      setCurrentPageSize(10)
                                      const imageRes = await searchImage(currentGroup.imageGroupId,undefined,undefined,undefined,undefined,0,10)
                                      dispatch({
                                        type: 'UPDATE_CURRENT_GROUP_IMAGES',
                                        payload: imageRes.data.content
                                      })
                                      dispatch({
                                        type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
                                        payload: imageRes.data.totalElements
                                      })
                                      const _taskDetails = await fetchTaskDetails()
                                      setTaskDetails(_taskDetails)  // 该条任务详情信息
                                    },
                                  })
                              }}
                              onCancel={()=>{setIsUploadImageModalOpen(false)}}
                              title={"上传图像"}
                              okText={"上传"}
                              imageType={projectDetails.imageType.imageTypeId}
                              options={groupOptions}
                            />

                            <JsonUploadForm 
                              open={isUploadJsonModalOpen}
                              onCreate={async (values, txtFile) => {
                                  const { group } = values
                                  
                                  if (!txtFile) {
                                    message.error('Please choose a txt file')
                                    return
                                  }

                                  const content = await readFile(txtFile)
                                  const lines = content
                                    .split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line !== '')
                                  const total = lines.length
                                  if (total < 1) {
                                    Modal.error({
                                      content: '输入的txt文件中无有效地址',
                                    })
                                    return 0
                                  }

                                  const jsonList = [];
                                  const folderList = [];

                                  lines.forEach(path => {
                                    const lastPart = path.substring(path.lastIndexOf('/') + 1);  // 获取最后一个 "/" 之后的部分

                                    // 如果最后的部分包含 "."，则判断为文件（例如json），否则判断为文件夹
                                    if (lastPart.includes('.')) {
                                      jsonList.push(path);  // 这是一个文件（json）
                                    } else {
                                      folderList.push(path); // 这是一个文件夹
                                    }
                                  });
                                  
                                  if (folderList.length > 0){
                                    console.log(folderList)
                                    try {
                                      const responses = await Promise.all(
                                        folderList.map(line => 
                                          uploadJsonFolder({
                                            imageGroupId: group,
                                            projectId: projectId,
                                            userName: userDetail.username,
                                            jsonUrls: line,
                                          })
                                        )
                                      );
                                    } catch (error) {
                                      message.error("上传失败")
                                    }
                                  }
                            
                                  if (jsonList.length > 0){
                                    console.log(jsonList)
                                    const res = await uploadJson({
                                      imageGroupId: group,
                                      projectId: projectId,
                                      userName: userDetail.username,
                                      jsonUrls: jsonList
                                    })
                            
                                    if(res.err){
                                      message.error("上传失败")
                                    }
                                  }

                                  setIsUploadJsonModalOpen(false);
                                  message.success("数据正在上传中....")
                              }}
                              onCancel={()=>{setIsUploadJsonModalOpen(false)}}
                              title={"上传标注文件"}
                              okText={"上传"}
                              options={groupOptions}
                            />

                            <ImageDeleteForm
                                open={isDeleteImageModalOpen}
                                onDelete={
                                  async()=>{
                                    setIsDeleteImageModalOpen(false)
                                    setCurrentPage(1)
                                    setCurrentPageSize(10)
                                    const imageRes = await searchImage(currentGroup.imageGroupId,undefined,undefined,undefined,undefined,0,10)
                                    dispatch({
                                      type: 'UPDATE_CURRENT_GROUP_IMAGES',
                                      payload: imageRes.data.content
                                    })
                                    dispatch({
                                      type: 'UPDATE_CURRENT_GROUP_IMAGE_LENGTH',
                                      payload: imageRes.data.totalElements
                                    })
                                  }}
                                onCancel={()=>{setIsDeleteImageModalOpen(false)}}
                                groupImages={deleteImages}
                            />

                            <TaskProgressModal
                              open={showTaskDetailModal}
                              onOk={()=>{setShowTaskDetailModal(false)}}
                              onCancel={()=>{setShowTaskDetailModal(false)}}
                              taskDetails={taskDetails}
                            />
                        </div>
                        <Divider style={{ marginTop: '5px', marginBottom: '10px'}} />
                        {/* 图像列表 */}
                        <div>
                            {currentGroupImages.length !==0 ? (
                              <>
                                {/* <Space wrap>
                                  {currentGroupImages.map(image => (
                                      <HitImage hitDetail={image} projectId={projectId} key={image.imageId} />
                                  ))}
                                </Space> */}
                                <Table
                                  columns={imageListColumnns(projectDetails, currentGroup, history, lastEditImageId, lastViewImageId, currentPage, currentPageSize)}
                                  dataSource={imageDatas}
                                  pagination={false}
                                  onRow={(record) => ({
                                    onClick: () => {
                                      console.log( currentGroup.imageGroupId, record.imageId )
                                      window.sessionStorage.setItem('tagInitGroupId', currentGroup.imageGroupId);
                                      window.sessionStorage.setItem('tagInitImageId', record.imageId);
                                      if (projectDetails.imageType.imageTypeName === '病理图') {
                                        history.push(
                                          `/projects/pathoSpace/${projectDetails.projectId}?status=notDone&model=human-annotation`
                                        );
                                      } else {
                                        history.push(
                                          `/projects/space/${projectDetails.projectId}?status=notDone&model=human-annotation`
                                        );
                                      }
                                    },
                                    style: { cursor: 'pointer' },
                                  })}
                                  // bordered
                                />
                                <ConfigProvider locale={zhCN}>
                                  <Pagination
                                    current={currentPage}
                                    pageSize={currentPageSize}
                                    showQuickJumper
                                    showSizeChanger
                                    onShowSizeChange={(current, size) => {
                                      // setIsPageSizeChanging(true)
                                      localStorage.setItem('pageSize', size.toString());
                                      setCurrentPageSize(size)
                                      setCurrentPage(1)
                                      refreshImage(0, size)
                                      // 异步延迟恢复状态，确保 onChange 不被触发
                                      // setTimeout(() => {
                                      //   setIsPageSizeChanging(false);
                                      // }, 0);
                                    }}
                                    pageSizeOptions={['10', '20', '30', '40', '50']}
                                    // defaultCurrent={1}
                                    // defaultPageSize={parseInt(localStorage.getItem('pageSize')) || 10}
                                    total={currentGroupImageLength}
                                    onChange={pageNumber => {
                                      if(pageNumber === currentPage){
                                        return
                                      }
                                      setCurrentPage(pageNumber)
                                      refreshImage(pageNumber - 1, currentPageSize)
                                    }}
                                    style={{
                                      alignSelf: 'center',
                                      width: '100%',
                                      justifyContent: 'center',
                                      display: 'flex',
                                      marginTop: '20px'
                                    }}
                                  />
                                </ConfigProvider>
                              </>
                            ):(
                              <Empty
                                style={{ marginTop: '50px' }}
                                description={<h2 className={styles.noItems}>数据列表为空</h2>}
                              >
                              </Empty>
                            )}

                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default DataList
