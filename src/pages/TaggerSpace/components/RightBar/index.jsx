/*
 * @Author: Azhou
 * @Date: 2021-06-21 15:11:53
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:49:54
 */
import React, { useState, useEffect, useRef } from 'react'
import { getModelList } from '@/request/actions/task'
import { getInferResult } from '@/request/actions/tagger'
import { convertPointsToPath } from '@/pages/TaggerSpace/components/CanvasAnnotator/fabricObjAddEvent'
import { useDispatch, useSelector } from 'react-redux'
import { controls, iconBtns, shapes, desTra, desInte, desInfer } from './config'
import { renderModelInfer } from './help'
import styles from './index.module.scss'
import { getToken } from '@/helpers/dthelper'
import { Select, Tag, Input, Modal, Divider, Button, Popover, Checkbox, Drawer, Form, message} from 'antd'
import { ExclamationCircleOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
import { hitShapeTypes, traPathGenerateWay, intePathGenerateWay, taskTypes, contorlTypes, hitShapeTypeLabels } from '@/constants'
import { arraysEqualIgnoreOrder, DOC_ENTITY_COLORS } from '@/helpers/Utils'
import { VButton, VIcon } from '@/components'
import Draggable from 'react-draggable'; 
import { HexColorPicker } from "react-colorful";

const { Option } = Select

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

const RightBar = ({ containerRef, setShowTagBox, space, isDone, isCls, saveTagAndNextRow, saveRow, setUpdateReady, updateReady, modelName }) => {
  const {
    currentIndex,
    projectHits,
    projectDetails,
    projectEntities,
    customEntities,
    entityColorMap,
    classifyInfo,
    boundingBoxMap,
    currentCanvas,
    currentEntity,
    currentShape,
    currentTraPathWay,
    currentIntePathWay,
    currentControlType,
    currentModelInfo,
    currentModelInference,
    currentActiveObj,
    isMutiTag
  } = useSelector(
    // @ts-ignore
    state => state.project
  )
  const dispatch = useDispatch()
  const { TextArea } = Input;

  const [modelList, setModelList] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [taginfoValue, setTaginfoValue] = useState('')
  const [isTagInfoModalOpen, setIsTagInfModalOpen] = useState(false);
  const [isEntityCreateModalOpen, setIsEntityCreateModalOpen] = useState(false)
  const [algorithmDesc, setAlgorithmDesc] = useState('')
  const [customColor, setCustomColor] = useState('#fff')

  const [bounds, setBounds] = useState({
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  });
  const draggleRef = useRef(null);

  const onStart = (_event, uiData) => {
    // 获取目标容器的边界
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = draggleRef.current?.getBoundingClientRect();

    if (!containerRect || !targetRect) {
      return;
    }
    setBounds({
      left: containerRect.left - targetRect.left + uiData.x,
      right: containerRect.right - targetRect.right + uiData.x,
      top: containerRect.top - targetRect.top + uiData.y,
      bottom: containerRect.bottom - targetRect.bottom + uiData.y,
    });
  };

  const showDrawer = type => {
    setAlgorithmDesc(type)
  }
  const onCloseDrawer = () => {
    setAlgorithmDesc('')
  }

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
    } 
  }

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
  // }, [])

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
        currentCanvas.remove(...currentCanvas.getObjects())
        currentCanvas.renderAll()
      },
    })
  }

  const showReDoModal = () => {
    if (projectDetails.task_type.indexOf('IMAGE_CLASSIFICATION') !== -1) {
      dispatch({
        type: 'UPDATE_ISEDIT',
        payload: true,
      })
    } else if (
      projectDetails.task_type.indexOf('IMAGE_SEGMENTATION') !== -1 ||
      projectDetails.task_type.indexOf('IMAGE_DETECTION') !== -1
    ) {
      Modal.confirm({
        title: '提示',
        icon: <ExclamationCircleOutlined />,
        content: '是否在已有标注结果的基础上修改标注信息？',
        okText: '是',
        cancelText: '否',
        onOk() {
          dispatch({
            type: 'UPDATE_ISEDIT',
            payload: true,
          })
        },
        onCancel() {
          if (boundingBoxMap.length > 0) {
            dispatch({
              type: 'UPDATE_BOUNDING_BOX_MAP',
              payload: [],
            })
          }
          currentCanvas.remove(...currentCanvas.getObjects())
          currentCanvas.renderAll()
          dispatch({
            type: 'UPDATE_ISEDIT',
            payload: true,
          })
        },
      })
    }
    dispatch({
      type: 'UPDATE_CURRENT_ENTITY',
      payload: projectEntities[0],
    })
  }

  const handleControlTypeChange = control => {
    dispatch({
      type: 'UPDATE_CURRENT_CONTROL_TYPE',
      payload: control.value,
    })
  }

  const tagRender = props => {
    const { label, closable, onClose } = props
    const onPreventMouseDown = event => {
      event.preventDefault()
      event.stopPropagation()
    }
    return (
      <Tag
        color={entityColorMap[label]}
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    )
  }

  const BtnCtrlRender = ({ icon, label, title, onClick, active }) => {
    return (
      <div
        style={{ backgroundColor: active ? '#2185d0' : 'grey', width: '60px' }}
        onClick={onClick}
        className={styles.btnCtrlWrap}
        title={title}
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

  // const renderInferResult = async currentModelInference => {
  //   console.log('尚未完成')
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
    // const classRes = await getNewSegImg({
    //   box: box,
    //   imgPath: imgSrc,
    //   modelName: 'SegmentAnything',
    //   projectId: projectDetails.id,
    //   interactive: false,
    // })
    // dispatch({
    //  type: 'UPDATE_CURRENT_CLASSIFY_INFO',
    //  payload: {
    //    ...classifyInfo,
    //   label: classRes.label,
    //  },
    // })
    console.log('尚未完成2')
  }

  return (
    <div>
      <Draggable handle={`.${styles.tagHeader}`}
          bounds={bounds}
          onStart={(event, uiData) => onStart(event, uiData)}>
        <div className={styles.rightBar}  ref={draggleRef}>
          <div className={styles.innerContainer}>
            {/* {projectDetails.task_type.indexOf('IMAGE_CLASSIFICATION') !== -1 && (
              <div className={styles.partContainer}>
                <div className={styles.tagHeader}>
                  <p className={styles.partTitle}>分类</p>
                  <CloseOutlined onClick={()=>{setShowTagBox(false)}} style={{ fontSize: '20px' }}/>
                </div>
                {space && (
                  <div className={styles.tagContainer}>
                    <div className={styles.drawContainer}>
                      <div className={styles.shapeHeader}>
                        <p className={styles.shapeTitle}>选择标签</p>
                      </div>
                      <Select
                        // mode="multiple"
                        showArrow
                        tagRender={tagRender}
                        value={classifyInfo.label ? classifyInfo.label : ''}
                        onChange={value =>
                          dispatch({
                            type: 'UPDATE_CURRENT_CLASSIFY_INFO',
                            payload: {
                              ...classifyInfo,
                              label: value,
                            },
                          })
                        }
                        disabled={!space}
                        style={{ width: '100%' }}
                        placeholder="Multiple choose label"
                        options={Object.keys(entityColorMap).map(item => ({ label: item, value: item }))}
                      />
                      <div className={styles.shapeHeader}>
                        <p className={styles.shapeTitle}>智能算法推理</p>
                      </div>
                      <div
                        style={{
                          backgroundColor:
                            currentShape === hitShapeTypes.MODELINFERENCE ? '#25b0e5' : '#56677d',
                        }}
                        className={styles.pathBtnWrap}
                      >
                        <Select
                          value={currentModelInference}
                          bordered={false}
                          style={{ color: '#fff', width: '110px' }}
                          onChange={value => {
                            dispatch({
                              type: 'UPDATE_CURRENT_MODEL_INFERENCE',
                              payload: value,
                            })
                            dispatch({
                              type: 'UPDATE_CURRENT_SHAPE',
                              payload: hitShapeTypes.MODELINFERENCE,
                            })
                          }}
                        >
                          {modelList.map(key => (
                            <Option value={key.modelName} key={key.modelName}>
                              {key.modelName}
                            </Option>
                          ))}
                        </Select>
                        <div
                          className={styles.pathDesc}
                          onClick={() =>
                            dispatch({
                              type: 'UPDATE_CURRENT_SHAPE',
                              payload: hitShapeTypes.MODELINFERENCE,
                            })
                          }
                        >
                          <VIcon type="icon-ManagePaths" style={{ marginRight: '5px' }} />
                          分类算法
                        </div>
                      </div>
                      {currentShape === hitShapeTypes.MODELINFERENCE && (
                        <Button
                          style={{ width: '70px', marginTop: '5px', padding: '0' }}
                          onClick={getInferclass}
                        >
                          开始推理
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {!space && (
                  <div style={{ marginTop: '15px', marginBottom: '15px' }}>
                    <span className={styles.subTitle}>推理结果:</span>
                    <span style={{ textAlign: 'center', fontSize: '18px', marginLeft: '10px' }}>
                      {classifyInfo.label ? classifyInfo.label : ''}
                    </span>
                  </div>
                )}
              </div>
            )} */}
            {true && (
              <div className={styles.partContainer}>
                <div className={styles.tagHeader}>
                  <p className={styles.partTitle}>检测与分割</p>
                  <CloseOutlined onClick={()=>{setShowTagBox(false)}} style={{ fontSize: '20px' }}/>
                </div>
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
                          // 获取 entityColorMap 的长度
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

                  {space && <Divider style={{ marginTop: '10px', marginBottom: '0', backgroundColor: '#354052' }} />}

                  {space && (
                    <div className={styles.drawContainer}>
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
                              if(shape.value === currentShape){
                                dispatch({
                                  type: 'UPDATE_CURRENT_CONTROL_TYPE',
                                  payload: contorlTypes.DRAG,
                                })
                                dispatch({
                                  type: 'UPDATE_CURRENT_SHAPE',
                                  payload: hitShapeTypes.NONE,
                                })
                              }else{
                                dispatch({
                                  type: 'UPDATE_CURRENT_SHAPE',
                                  payload: shape.value,
                                })
                                dispatch({
                                  type: 'UPDATE_CURRENT_CONTROL_TYPE',
                                  payload: contorlTypes.DEFAULT,
                                })
                              }
                            }}
                          />
                        ))}
                      </div>

                      {/* <div className={styles.algoTagHeader}>
                        <p className={styles.algoTagTitle}>传统算法标注</p>
                        <Button size='small' type="link" onClick={() => showDrawer('传统算法标注')} style={{fontSize: '11px'}}>点击查看算法说明</Button>
                      </div>

                      <div
                        style={{
                          backgroundColor: currentShape === hitShapeTypes.TRAPATH ? '#25b0e5' : '#56677d',
                        }}
                        className={styles.pathBtnWrap}
                      >
                        <Select
                          value={currentTraPathWay}
                          bordered={false}
                          style={{ color: '#fff', width: '110px' }}
                          onChange={value => {
                            dispatch({
                              type: 'UPDATE_CURRENT_TRAPATHWAY',
                              payload: value,
                            })
                            dispatch({
                              type: 'UPDATE_CURRENT_SHAPE',
                              payload: hitShapeTypes.TRAPATH,
                            })
                          }}
                        >
                          {Object.keys(traPathGenerateWay).map(key => (
                            <Option value={traPathGenerateWay[key]} key={key}>
                              {traPathGenerateWay[key]}
                            </Option>
                          ))}
                        </Select>
                        <div
                          className={styles.pathDesc}
                          onClick={() => {
                            dispatch({
                              type: 'UPDATE_CURRENT_SHAPE',
                              payload: hitShapeTypes.TRAPATH,
                            })
                          }}
                        >
                          <VIcon type="icon-ManagePaths" style={{ marginRight: '5px' }} />
                          分割算法
                        </div>
                      </div>

                      <div>
                        <div className={styles.algoTagHeader}>
                          <p className={styles.algoTagTitle}>交互式算法标注</p>
                          <Button size='small' type="link" onClick={() => showDrawer('交互式算法标注')} style={{fontSize: '11px'}}>点击查看算法说明</Button>
                        </div>
                        <div
                          style={{
                            backgroundColor: currentShape === hitShapeTypes.INTEPATH ? '#25b0e5' : '#56677d',
                          }}
                          className={styles.pathBtnWrap}
                        >
                          <Select
                            value={currentIntePathWay}
                            bordered={false}
                            style={{ color: '#fff', width: '110px' }}
                            onChange={value => {
                              dispatch({
                                type: 'UPDATE_CURRENT_INTEPATHWAY',
                                payload: value,
                              })
                              dispatch({
                                type: 'UPDATE_CURRENT_SHAPE',
                                payload: hitShapeTypes.INTEPATH,
                              })
                            }}
                          >
                            {Object.keys(intePathGenerateWay).map(key => (
                              <Option value={intePathGenerateWay[key]} key={key}>
                                {intePathGenerateWay[key]}
                              </Option>
                            ))}
                          </Select>
                          <div
                            className={styles.pathDesc}
                            onClick={() => {
                              dispatch({
                                type: 'UPDATE_CURRENT_SHAPE',
                                payload: hitShapeTypes.INTEPATH,
                              })
                            }}
                          >
                            <VIcon type="icon-ManagePaths" style={{ marginRight: '5px' }} />
                            分割算法
                          </div>
                        </div>
                      </div>

                      <div>
                        {modelList?.length > 0 && (
                          <div>
                            <div className={styles.algoTagHeader}>
                              <p className={styles.algoTagTitle}>智能算法标注</p>
                              <Button size='small' type="link" onClick={() => showDrawer('智能算法自动标注')} style={{fontSize: '11px'}}>点击查看算法说明</Button>
                            </div>
                            <div
                              style={{
                                backgroundColor:
                                  currentShape === hitShapeTypes.MODELINFERENCE ? '#25b0e5' : '#56677d',
                              }}
                              className={styles.pathBtnWrap}
                            >
                              <Select
                                value={currentModelInference}
                                bordered={false}
                                style={{ color: '#fff', width: '110px' }}
                                onChange={value => {
                                  dispatch({
                                    type: 'UPDATE_CURRENT_MODEL_INFERENCE',
                                    payload: value,
                                  })
                                  dispatch({
                                    type: 'UPDATE_CURRENT_SHAPE',
                                    payload: hitShapeTypes.MODELINFERENCE,
                                  })
                                }}
                              >
                                {modelList?.map(key => (
                                  <Option key={key.modelName} value={key.modelName} type={key.type}>
                                    {key.modelName}
                                  </Option>
                                ))}
                              </Select>
                              <div
                                className={styles.pathDesc}
                                onClick={() => {
                                  dispatch({
                                    type: 'UPDATE_CURRENT_SHAPE',
                                    payload: hitShapeTypes.MODELINFERENCE,
                                  })
                                }}
                              >
                                <VIcon type="icon-ManagePaths" style={{ marginRight: '5px' }} />
                                {
                                  <div>
                                    {
                                      taskTypes[
                                        modelList?.find(
                                          model => model.modelName === currentModelInference
                                        )?.type
                                      ]?.label
                                    }
                                    算法
                                  </div>
                                }
                              </div>
                            </div>

                            {currentShape === hitShapeTypes.MODELINFERENCE && (
                              //<span style={{color: 'red'}}>*点击图片，进行单张推理</span>
                              <Button
                                style={{ marginTop: '5px' }}
                                type="primary"
                                onClick={() => {
                                  dispatch({
                                    type: 'UPDATE_LAUNCH_REF_PROCESS',
                                    payload: true,
                                  })
                                }}
                              >
                                开始推理
                              </Button>
                            )}
                          </div>
                        )}
                      </div> */}
                    </div>
                  )}
                </div>

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
            )}
            <Modal title="标注信息" 
                  open={isTagInfoModalOpen} 
                  onOk={handleTagInfoModalOk} 
                  onCancel={()=>{setIsTagInfModalOpen(false)}} 
                  destroyOnClose
                  okText="确定"
                  cancelText="取消">
              <TextArea placeholder="请输入100字以内标注内容" 
                        showCount 
                        maxLength={100} 
                        onChange={handelInfoValueChange}
                        {...(currentActiveObj?.tagInfo ? { defaultValue: currentActiveObj.tagInfo } : {})}/>
            </Modal>
            <Drawer
              title={algorithmDesc}
              placement="right"
              width={700}
              bodyStyle={{ marginBottom: '20px' }}
              onClose={onCloseDrawer}
              open={algorithmDesc}
            >
              {algorithmDesc === '传统算法标注' && desTra()}
              {algorithmDesc === '交互式算法标注' && desInte()}
              {algorithmDesc === '智能算法自动标注' && desInfer(modelList)}
            </Drawer>
            <div className={styles.iconBtnWrap}>
              {iconBtns(
                clearAllObjects,
                saveRow,
                currentIndex,
                projectHits,
                saveTagAndNextRow,
                showReDoModal,
                space,
                isDone,
                isCls,
                setUpdateReady,
                updateReady
              ).map((btn, index) => {
                if (btn.show)
                  return (
                    <div
                      key={index}
                      style={{ width: btn.width !== '' ? btn.width : '100px', marginBottom: '10px', textAlign: 'center' }}
                    >
                      <VButton color={btn.color} onClick={btn.onClick} disabled={btn.disabled} style={{ width: '100px', padding: '0' }}>
                        {btn.title}
                      </VButton>
                    </div>
                  )
              })}
            </div>
          </div>
        </div>    
      </Draggable>
    </div>
  )
}

export default RightBar
