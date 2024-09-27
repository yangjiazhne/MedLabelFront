/*
 * @Author: Azhou
 * @Date: 2021-06-21 15:11:53
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:49:54
 */
import React, { useState, useEffect, useRef } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { getModelList } from '@/request/actions/task'
import { useDispatch, useSelector } from 'react-redux'
import { getInferResult, getPathoSegRef } from '@/request/actions/tagger'
import { controls, iconBtns, shapes, desTra, desInte, desInfer, segAlgos } from './config'
import { renderModelInfer } from './help'
import styles from './index.module.scss'
import { Select, Tag, Input, Modal, Divider, Button, Popover, Checkbox, Drawer, Form, message} from 'antd'
import { ExclamationCircleOutlined, CloseOutlined, PlusOutlined  } from '@ant-design/icons'
import { hitShapeTypes, contorlTypes, hitShapeTypeLabels, intePathGenerateWay, taskTypes } from '@/constants'
import { arraysEqualIgnoreOrder, DOC_ENTITY_COLORS } from '@/helpers/Utils'
import { VButton, VIcon } from '@/components'
import Draggable from 'react-draggable'; 
import { HexColorPicker } from "react-colorful";
const { Option } = Select
import OpenSeadragon from '@/lib/openseadragon-fabricjs-overlay/openseadragon-fabricjs-overlay'

const EntityCreateModal = ({ open, onCreate, onCancel, title, okText, customColor, setCustomColor}) => {
  const [form] = Form.useForm()
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  const handleColorPickerOpenChange = (newOpen) => {
    setColorPickerOpen(newOpen);
  };

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
            onCreate(values, customColor);
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
      >
        <Form.Item
          name="name"
          label="类别名称"
          rules={[
            {
              required: true,
              message: '请输入类别名称!',
            },
          ]}
        >
          <Input placeholder="请输入类别名称"/>
        </Form.Item>
        <Form.Item
          label="颜色"
          name="color"
        >
          <div style={{display: 'flex'}}>
            <Tag color={customColor} style={{width: '110px', height: '35px', marginRight: '30px'}}></Tag>
            <Popover
              content={<HexColorPicker color={customColor} onChange={setCustomColor}/>}
              trigger="click"
              placement="bottomLeft"
              open={colorPickerOpen}
              zIndex = {9999}
              onOpenChange={handleColorPickerOpenChange}
            >
              <div style={{borderRadius: '2px', boxShadow: '0 0 5px #e9e9e9', padding: '5px 15px', cursor: 'pointer'}}>
                  <VIcon type="icon-tiaosepan" style={{ marginRight: '5px' }} />其它颜色
              </div>
            </Popover>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const RightBar = ({ setShowTagBox, space, isDone, saveRow, setUpdateReady, updateReady, modelName }) => {
  const {
    projectHits, // 项目图片信息
    projectDetails, // 项目详情
    entities, //
    customEntities,
    entityColorMap,
    boundingBoxMap,
    currentCanvas,
    currentEntity,
    currentShape,
    currentIntePathWay,
    currentControlType,
    currentModelInference,
    currentActiveObj,
    currentViewer,
    isMutiTag
  } = useSelector(
    // @ts-ignore
    state => state.project
  )
  const dispatch = useDispatch()
  const history = useHistory()
  const { TextArea } = Input;
  const [modelList, setModelList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [taginfoValue, setTaginfoValue] = useState('')
  const [customColor, setCustomColor] = useState('#fff')
  const [isTagInfoModalOpen, setIsTagInfModalOpen] = useState(false);
  const [isEntityCreateModalOpen, setIsEntityCreateModalOpen] = useState(false)
  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef(null);
  const onStart = (_event, uiData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect();
    if (!targetRect) {
      return;
    }
    setBounds({
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    });
  };

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

  const onChangeMutiTag = (e) => {
    dispatch({
      type: 'UPDATE_ISMUTITAG',
      payload: e.target.checked,
    })
  }

  const selectObjectById = (id) => {
    // 查找具有指定 id 的对象
    const targetObject = currentCanvas.getObjects().find(obj => obj.id === id);
    // 如果找到了对象，则将其设置为选中状态
    if (targetObject) {
      // 取消选中所有对象
      currentCanvas.discardActiveObject();
      // 设置当前对象为选中状态
      currentCanvas.setActiveObject(targetObject);
      // 重新渲染画布
      currentCanvas.renderAll();

      const centerX = targetObject.left + targetObject.width / 2;
      const centerY = targetObject.top + targetObject.height / 2;

      const normalizedX = centerX / 1000;
      const normalizedY = centerY / 1000;

      currentViewer.viewport.panTo(new OpenSeadragon.Point(normalizedX, normalizedY));
    } 
  }

  const [algorithmDesc, setAlgorithmDesc] = useState('')
  const showDrawer = type => {
    setAlgorithmDesc(type)
  }
  const onCloseDrawer = () => {
    setAlgorithmDesc('')
  }

  // 这里是获取模型列表的函数，暂时先不加入推理任务，前端先放在这里
  // const fetchModelList = async () => {
  //   const res = await getModelList()
  //   if (!res.err) {
  //     const allModelList = res.data.data
  //     const tags = JSON.parse(projectDetails.taskRules).tags.split(',')
  //     // 筛选符合条件的model
  //     const availableModelList = allModelList.filter(model => {
  //       return (
  //         taskTypes[model.type].value === projectDetails.task_type &&
  //         arraysEqualIgnoreOrder(tags, model.labels)
  //       )
  //     })
  //     setModelList(availableModelList)
  //     if (availableModelList.length > 0) {
  //       dispatch({
  //         type: 'UPDATE_CURRENT_MODEL_INFERENCE',
  //         payload: availableModelList[0].modelName,
  //       })
  //     }
  //   }
  // }

  // useEffect(() => {
  //   fetchModelList()
  // }, [projectDetails])

  const clearAllObjects = () => {
    Modal.confirm({
      title: '提示',
      icon: <ExclamationCircleOutlined />,
      content: '是否清除所有标注信息?',
      okText: '是',
      cancelText: '否',
      onOk: () => {
        if (boundingBoxMap.length > 0) {
          dispatch({
            type: 'UPDATE_BOUNDING_BOX_MAP',
            payload: [],
          })
        }
        // 先清除画布上的标注，再重新渲染
        currentCanvas.remove(...currentCanvas.getObjects())
        currentCanvas.renderAll()
      },
    })
  }

  const reDoObjects = () => {
    Modal.confirm({
      title: '提示',
      icon: <ExclamationCircleOutlined />,
      content: '请确认修改GT标注信息',
      okText: '是',
      cancelText: '否',
      onOk() {
        // setIsEdit(true)
      },
      onCancel() {
        // if (boundingBoxMap.length > 0) {
        //   dispatch({
        //     type: 'UPDATE_BOUNDING_BOX_MAP',
        //     payload: [],
        //   })
        // }
        // currentCanvas.remove(...currentCanvas.getObjects())
        // currentCanvas.renderAll()
        // setIsEdit(true)
      },
    })
  }

  const showReDoModal = () => {
    if (projectDetails.task_type.indexOf('IMAGE_CLASSIFICATION') !== -1) {
      // setIsEdit(true)
    } else if (
      projectDetails.task_type.indexOf('IMAGE_SEGMENTATION') !== -1 ||
      projectDetails.task_type.indexOf('IMAGE_DETECTION') !== -1
    ) {
      reDoObjects()
    }
    dispatch({
      type: 'UPDATE_CURRENT_ENTITY',
      payload: entities[0],
    })
  }
  // 更新控制方式
  const handleControlTypeChange = control => {
    dispatch({
      type: 'UPDATE_CURRENT_CONTROL_TYPE',
      payload: control.value,
    })
  }

  // const tagRender = props => {
  //   const { label, closable, onClose } = props
  //   const onPreventMouseDown = event => {
  //     event.preventDefault()
  //     event.stopPropagation()
  //   }
  //   return (
  //     <Tag
  //       color={entityColorMap[label]}
  //       onMouseDown={onPreventMouseDown}
  //       closable={closable}
  //       onClose={onClose}
  //       style={{ marginRight: 3 }}
  //     >
  //       {label}
  //     </Tag>
  //   )
  // }

  // 控制功能按钮生成方法
  const BtnCtrlRender = ({ icon, label, onClick, active }) => {
    return (
      <div
        style={{ backgroundColor: active ? '#2185d0' : 'grey', width: '60px' }}
        onClick={onClick}
        className={styles.btnCtrlWrap}
      >
        {icon}
        <span style={{ marginTop: '3px', fontSize: '10px' }}>{label}</span>
      </div>
    )
  }

  // 绘制功能按钮生成方法
  const BtnDrawRender = ({ icon, label, title, onClick, active }) => {
    return (
      <div
        style={{ backgroundColor: active ? '#25b0e5' : '#56677d', width: '40px' }}
        onClick={onClick}
        className={styles.btnDrawWrap}
        title={title}
      >
        {icon}
        <span style={{ marginTop: '3px', fontSize: '10px' }}>{label}</span>
      </div>
    )
  }

    // 交互式算法标注按钮生成方法
    const SegBtnDrawRender = ({ label, title, onClick, active }) => {
      return (
        <div
          style={{ backgroundColor: active ? '#25b0e5' : '#56677d', height: '30px', width: '70px' }}
          onClick={onClick}
          className={styles.btnDrawWrap}
          title={title}
        >
          <span style={{ fontSize: '14px' }}>{label}</span>
        </div>
      )
    }

  // 有关推理结果显示和选择的方法，目前没有完成
  // const renderInferResult = async () => {
  //   Modal.confirm({
  //     title: '提示',
  //     icon: <ExclamationCircleOutlined />,
  //     content: '病理图整图推理所需时间较长（40分钟左右），推理任务进度以任务形式展示，是否继续？',
  //     okText: '是',
  //     cancelText: '否',
  //     onOk: async () => {
  //       // 这里需要做成假的，首先要构造一个任务，显示一个假进度条
  //       const { uid, token } = getUidToken()
  //       const data = {
  //         uid: uid,
  //         modelName: currentModelInference,
  //         datasetName: projectDetails.name,
  //         projectId: projectDetails.id,
  //         tasktype:
  //           taskTypes[modelList?.find(model => model.modelName === currentModelInference)?.type]
  //             ?.label,
  //       }
  //       const res = await getPathoSegRef(data)
  //       if (res.err) {
  //         message.error('推理任务创建失败: ' + res.data)
  //       } else {
  //         message.success('推理任务创建成功')
  //         Modal.confirm({
  //           title: '提示',
  //           icon: <ExclamationCircleOutlined />,
  //           content: '推理任务创建成功，是否前往任务中心查看任务进度？',
  //           okText: '是',
  //           cancelText: '否',
  //           onOk: () => {
  //             history.push(`/userHome/task-list`)
  //           },
  //         })
  //       }
  //     },
  //   })
  // }

  const deleteActiveObj = () => {
    Modal.confirm({
      title: '确认',
      icon: <ExclamationCircleOutlined />,
      content: '确定删除该标注吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        currentCanvas.remove(currentActiveObj).requestRenderAll()
        // 维护boundingBoxMap数组
        dispatch({
          type: 'UPDATE_BOUNDING_BOX_MAP',
          payload: boundingBoxMap.filter(box => box.id !== currentActiveObj.id),
        })
      },
    })
  }

  const getInferclass = () => {
    //dispatch({
    //  type: 'UPDATE_CURRENT_CLASSIFY_INFO',
    //  payload: {
    //    ...classifyInfo,
    //   label: classRes.label,
    //  },
    //})
    console.log('尚未完成')
  }

  return (
    <>
      <Draggable handle={`.${styles.tagHeader}`}
                bounds={bounds}
                onStart={(event, uiData) => onStart(event, uiData)}>
        <div className={styles.rightBar} ref={draggleRef}>
          <div className={styles.innerContainer}>
            <div className={styles.tagHeader}>
              <p className={styles.partTitle}>标注</p>
              <CloseOutlined onClick={()=>{setShowTagBox(false)}} style={{ fontSize: '20px' }}/>
            </div>
            <div className={styles.partContainer}>
              <div className={styles.tagContainer}>
                <div className={styles.selectEntity}>
                  <div className={styles.entityHeader}>
                    <p className={styles.subTitle}>{space ? '选择类别' : '类别列表'}</p>
                    <Input
                      value={searchQuery}
                      style={{width: '65%', fontSize:'12px'}}
                      size="small"
                      onChange={event => setSearchQuery(event.target.value)}
                      placeholder="搜索类别标签"
                      allowClear
                    />
                  </div>
                  <div className={styles.entityWrap}>
                    {Object.keys(entityColorMap).map((item, index) => {
                      if (
                        searchQuery.length === 0 ||
                        item.toUpperCase().includes(searchQuery.toUpperCase())
                      )
                        return (
                          <div
                            className={styles.entityItemWrap}
                            onClick={() => {
                              if (space) {
                                dispatch({
                                  type: 'UPDATE_CURRENT_ENTITY',
                                  payload: currentEntity !== item ? item : '',
                                })
                              }
                            }}
                            tabIndex={index}
                            key={item}
                            id={item}
                            style={{
                              backgroundColor: `${currentEntity === item ? '#25b0e5' : '#56677d'}`,
                            }}
                          >
                            <Tag
                              color={entityColorMap[item]}
                              style={{ marginLeft: '5px', marginRight: '5px', lineHeight: '18px', padding: '0 5px' }}
                            >
                              {item}
                            </Tag>
                          </div>
                        )
                    })}
                    <div
                      className={styles.entityItemWrap}
                      onClick={() => {
                        setIsEntityCreateModalOpen(true)
                        const mapLength = Object.keys(entityColorMap).length;
                        setCustomColor(DOC_ENTITY_COLORS[mapLength])
                      }}
                      style={{
                        backgroundColor: '#56677d',
                      }}
                    >
                      <Tag
                        color='#56677d'
                        style={{ marginLeft: '5px', marginRight: '5px', lineHeight: '18px', padding: '0 5px' }}
                      >
                        <PlusOutlined style={{color: '#fff'}}/>
                      </Tag>
                    </div>
                  </div>
                </div>
                <EntityCreateModal 
                  open={isEntityCreateModalOpen}
                  onCreate={(values, color) => {
                    const entityExists = Object.values(entityColorMap).includes(values.name)
                    if(entityExists){
                      message.error("当前类别已存在，请更换一个类别！")
                      return
                    }

                    const colorExists = Object.values(entityColorMap).includes(color)
                    if(colorExists){
                      message.error("当前颜色已存在，请更换一个颜色！")
                      return
                    }

                    const newEntity = {
                      id: customEntities.length,
                      entity: values.name,
                      color: color
                    }

                    const newCustomEntities = [
                      ...customEntities,
                      newEntity
                    ]

                    dispatch({
                      type: 'UPDATE_CUSTOM_ENTITY',
                      payload: newCustomEntities,
                    })         
                    
                    message.success("添加成功！")
                    setIsEntityCreateModalOpen(false)

                  }}
                  onCancel={()=>{setIsEntityCreateModalOpen(false)}}
                  title={"添加类别信息"}
                  okText={"完成"}
                  customColor={customColor}
                  setCustomColor={setCustomColor}
                />
                <Divider style={{ marginTop: '10px', marginBottom: '0', backgroundColor: '#354052' }} />
                <div className={styles.shapeHeader}>
                  <p className={styles.shapeTitle}>手工标注</p>
                  <Checkbox checked={isMutiTag} onChange={onChangeMutiTag} style={{color: isMutiTag ? 'rgb(33, 133, 208)' : 'inherit', fontSize: '12px'}}>多次标注</Checkbox>
                </div>
                <div className={styles.iconBtnWrap}>
                  {shapes.map((shape, index) => (
                    <BtnDrawRender
                      key={index}
                      active={currentShape === shape.value}
                      icon={shape.icon}
                      label={shape.label}
                      title={shape.title}
                      onClick={() => {
                        dispatch({
                          type: 'UPDATE_CURRENT_SHAPE',
                          payload: shape.value,
                        })
                        dispatch({
                          type: 'UPDATE_CURRENT_CONTROL_TYPE',
                          payload: contorlTypes.DEFAULT,
                        })
                      }}
                    />
                  ))}
                </div>
                {space && <Divider style={{ marginTop: '10px', marginBottom: '0' }} />}
                {/* {space && (
                  <>
                    <div>
                      <div className={styles.algoTagHeader}>
                        <p className={styles.algoTagTitle}>交互式算法标注</p>
                        <Button size='small' type="link" onClick={() => showDrawer('交互式算法标注')} style={{fontSize: '11px'}}>点击查看算法说明</Button>
                      </div>
                      <div className={styles.iconBtnWrap}>
                        {segAlgos.map((algorithm, index) => (
                          <SegBtnDrawRender
                            key={index}
                            active={currentShape === algorithm.value && currentIntePathWay === algorithm.algo }
                            label={algorithm.label}
                            title={algorithm.title}
                            onClick={() => {
                              dispatch({
                                type: 'UPDATE_CURRENT_INTEPATHWAY',
                                payload: algorithm.algo,
                              })
                              dispatch({
                                type: 'UPDATE_CURRENT_SHAPE',
                                payload: algorithm.value,
                              })
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )} */}
              </div>
              <Drawer
                title={algorithmDesc}
                placement="right"
                width={700}
                bodyStyle={{ marginBottom: '20px' }}
                onClose={onCloseDrawer}
                open={algorithmDesc!==''}
              >
                {algorithmDesc === '传统算法标注' && desTra()}
                {algorithmDesc === '交互式算法标注' && desInte()}
                {algorithmDesc === '智能算法自动标注' && desInfer(modelList)}
              </Drawer>
              <Divider style={{ marginTop: '10px', marginBottom: '0' }} />
              <div className={styles.taggerList}>
                <p className={styles.taggerListTitle}>标注列表</p>
                <ul className={styles.taggerWrap}>
                  {currentCanvas?.getObjects().map((annotation, index) => (
                    <li key={annotation.id} className={styles.taggerWrapItem}
                      style={{
                        backgroundColor: `${currentActiveObj?.id === annotation.id ? '#6c809a' : '#56677d'}`,
                      }}
                      onClick={()=>{selectObjectById(annotation.id)}}>
                      <p className={styles.taggerWrapItemContent}>
                        <div>
                          <span style={{marginRight: '20px'}}>{index + 1}</span>
                          <span>{hitShapeTypeLabels[annotation.shape]}</span>
                        </div>
                        <span className={styles.taggerWrapItemColor} style={{backgroundColor: annotation.color}}></span>
                      </p>
                      {currentActiveObj?.id === annotation.id && annotation.tagInfo &&
                      <div className={styles.taggerWrapItemInfo}>{annotation.tagInfo}</div>}
                      {currentActiveObj?.id === annotation.id && <p className={styles.taggerWrapItemOperate}>
                        <span className={styles.taggerWrapItemDelete} onClick={deleteActiveObj}>
                          <VIcon type="icon-shanchu" style={{ fontSize: '16px' }}/>
                        </span>
                        <span className={styles.taggerWrapItemText} onClick={()=>{setIsTagInfModalOpen(true)}}>
                          <VIcon type="icon-wenben" style={{ fontSize: '14px', marginRight:'2px' }}/>
                          备注
                        </span>
                      </p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Modal title="标注信息" 
                  open={isTagInfoModalOpen} 
                  onOk={handleTagInfoModalOk} 
                  onCancel={()=>{setIsTagInfModalOpen(false)}} 
                  destroyOnClose
                  okText="保存"
                  cancelText="取消">
              <TextArea placeholder="请输入100字以内标注内容" 
                        showCount 
                        maxLength={100} 
                        onChange={handelInfoValueChange}
                        {...(currentActiveObj?.tagInfo ? { defaultValue: currentActiveObj.tagInfo } : {})}/>
            </Modal>
            <div className={styles.iconBtnWrap}>
              {iconBtns(clearAllObjects, showReDoModal, saveRow, projectHits, space, isDone, setUpdateReady, updateReady).map(
                (btn, index) => {
                  if (btn.show)
                    return (
                      <div
                        key={index}
                        style={{
                          width: btn.width !== '' ? btn.width : '100px',
                          marginBottom: '10px',
                          textAlign: 'center',
                        }}
                      >
                        <VButton
                          color={btn.color}
                          style={{ width: '100px', padding: '0' }}
                          onClick={() => btn.onClick(history)}
                          disabled={btn.disabled}
                        >
                          {btn.title}
                        </VButton>
                      </div>
                    )
                }
              )}
            </div>
          </div>
        </div>
      </Draggable>
    </>
  )
}

export default RightBar
