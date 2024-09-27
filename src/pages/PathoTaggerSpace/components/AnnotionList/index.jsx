import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CloseOutlined, ExclamationCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import styles from './index.module.scss'
import {Divider, Button, Popover, Input, Modal, message } from 'antd'
import Draggable from 'react-draggable'; 
const { Search } = Input;
import useDidUpdateEffect from '@/hooks/useDidUpdateEffect'
import { deleteAnnotation } from '@/request/actions/annotation'
import { getStrWithLen } from '@/helpers/Utils'
import { searchImage, fetchImageTileInfo } from '@/request/actions/image'

const AnnotionList = ({changeSession, setShowAnnotionList, setShowTagBox, currentProjectPid}) => {
    const {
        annotion, // 图像的所有标注文件
        currentAnnotion,  // 当前标注文件
        currentImage,  // 当前图像
        pathoImageInfo
       } = useSelector(
        // @ts-ignore
        state => state.project
      )
    const dispatch = useDispatch()

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

    const clearAll = () => {
        const _change = () => {
            dispatch({
                type: 'UPDATE_CURRENT_ANNOTION',
                payload: null,
              })
            dispatch({
                type: 'UPDATE_INIT_BOUNDING_BOX',
                payload: []
            })
            dispatch({
                type: 'UPDATE_CUSTOM_ENTITY',
                payload: [],
            })
            setShowAnnotionList(false)
            setShowTagBox(true)
        }

        if (changeSession) {
            Modal.confirm({
                title: 'Confirm',
                icon: <ExclamationCircleOutlined />,
                content: '当前画布还有标注信息未保存，确定继续操作吗？',
                okText: '确认',
                cancelText: '取消',
                onOk: _change,
            })
        } else _change()
    }

    const changeAnnotion = (annotion) => {
        const _change = () => {
            // 更换当前annotion
            dispatch({
                type: 'UPDATE_CURRENT_ANNOTION',
                payload: annotion,
            })

            // 切换boundingBox
            const res = JSON.parse(annotion.annotationResult)
        
            if(res.hitResults){
                dispatch({
                    type: 'UPDATE_INIT_BOUNDING_BOX',
                    payload: res.hitResults,
                })
            }else{
                dispatch({
                    type: 'UPDATE_INIT_BOUNDING_BOX',
                    payload: [],
                })
            }
        
            if(res.customCategories){
                dispatch({
                    type: 'UPDATE_CUSTOM_ENTITY',
                    payload: res.customCategories,
                })
            }
        }

        if (changeSession) {
            Modal.confirm({
                title: 'Confirm',
                icon: <ExclamationCircleOutlined />,
                content: '当前画布还有标注信息未保存，确定继续操作吗？',
                okText: '确认',
                cancelText: '取消',
                onOk: _change,
            })
        } else _change()
    }

    const deleteAnnotationModal = async(annotation, image, pathoInfo) => {
        Modal.confirm({
            title: '确认',
            icon: <ExclamationCircleOutlined />,
            content: '确定要删除该标注文件吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                const res = await deleteAnnotation(annotation.annotationId)
                if (!res.err) {
                    message.success('标注文件删除成功')
                    dispatch({
                        type: 'UPDATE_CURRENT_IMAGE',
                        payload: {...image}
                    })
                    const pathoImageInfo = await fetchImageTileInfo(currentProjectPid,image.imageName)
                    dispatch({
                        type: 'UPDATE_PATHOIMGINFO',
                        payload: {...pathoImageInfo},
                    })
                } else {
                    message.success('标注文件删除失败')
                }
            },
        })
    }

    const [searchValue, setSearchValue] = useState('')

    const onSearch = (value) => {
        setSearchValue(value.trim())
    }

    return (
        <>
            <Draggable handle={`.${styles.annotionListHeader}`} 
                       bounds={bounds}
                       onStart={(event, uiData) => onStart(event, uiData)}>
                <div className={styles.annotionListContainer} ref={draggleRef}>
                    <div className={styles.innerContainer}>
                        <div className={styles.annotionListHeader}>
                            <p className={styles.annotionListTitle}>标注文件列表</p>
                            <CloseOutlined onClick={()=>{setShowAnnotionList(false)}} style={{ fontSize: '20px' }}/>
                        </div>
                        <Search
                            placeholder="搜索标注文件"
                            onSearch={onSearch}
                            className={styles.SearchBar}
                            style={{
                                width: '100%',
                                marginTop: '5px'
                            }}
                        />
                        <Divider style={{ marginTop: '5px', marginBottom: '5px', backgroundColor: '#354052' }} />
                        <div className={styles.annotionListBody}>
                            {annotion
                                .filter(item => 
                                    item.annotationName.toLowerCase().includes(searchValue.toLowerCase()) // 忽略大小写
                                  )
                                .map(item => (
                                <Popover 
                                    content={
                                        <div style={{maxWidth: '200px', padding:'10px'}}>
                                            <p><b>{item.annotationName} </b></p>
                                            <Divider style={{ marginTop: '0', marginBottom: '5px', backgroundColor: '#354052' }} />
                                            <p style={{ wordWrap: 'break-word', marginBottom: '4px' }}>
                                                <b>标注用户: </b>
                                                {item.annotatedBy}
                                            </p>
                                            <p style={{ marginBottom: '4px' }}>
                                                <b>描述: </b>
                                                {item.description}
                                            </p>
                                        </div>} 
                                        overlayClassName={styles.morePop}
                                        placement="left">
                                    <div 
                                        className={styles.annotionItem}
                                        style={{backgroundColor: `${currentAnnotion?.annotationId === item.annotationId  ? 'rgba(65, 78, 95, .5)' : 'rgba(65, 78, 95, .8)'}`,
                                                color: `${currentAnnotion?.annotationId === item.annotationId  ? '#0275d8' : '#fff'}`}}
                                        onClick={()=>{changeAnnotion(item)}}>
                                            {getStrWithLen(item.annotationName, 20)}
                                        <div className={styles.editAnnotionItem} onClick={()=>{deleteAnnotationModal(item, currentImage, pathoImageInfo)}}>
                                            <DeleteOutlined style={{ color: '#ff0000' }}/>
                                        </div>
                                    </div>
                                </Popover>
                            ))}
                            <div 
                                className={styles.annotionItem}
                                onClick={()=>{clearAll()}}>
                                <PlusOutlined style={{color: '#fff', marginRight: '10px'}}/> 新建
                            </div>
                        </div>
                    </div>
                </div>
            </Draggable>
        </>
    )
  }
  
  export default AnnotionList