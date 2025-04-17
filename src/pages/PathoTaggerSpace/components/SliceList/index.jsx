import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { CloseOutlined, ExclamationCircleOutlined, CheckCircleTwoTone } from '@ant-design/icons'
import styles from './index.module.scss'
import { useHistory, useParams } from 'react-router-dom'
import {Divider, Collapse, Button, Spin, Image, Input, InputNumber,Empty, Modal } from 'antd'
import Draggable from 'react-draggable'; 
const { Panel } = Collapse;
import { searchImage, fetchImageTileInfo } from '@/request/actions/image'
import { imgError } from './config'
const { Search } = Input;
import useDidUpdateEffect from '@/hooks/useDidUpdateEffect'
import { getStrWithLen } from '@/helpers/Utils'

function compare(itemA, itemB) {
    if (itemA.imageUrl.substring(itemA.imageUrl.lastIndexOf('/') + 1) < itemB.imageUrl.substring(itemB.imageUrl.lastIndexOf('/') + 1) ) return -1
    else if (itemA.imageUrl.substring(itemA.imageUrl.lastIndexOf('/') + 1) > itemB.imageUrl.substring(itemB.imageUrl.lastIndexOf('/') + 1)) return 1
    else return 0
}

const SliceList = ({changeSession, setShowSliceList, setSearchValue, currentPage, setCurrentPage, setCurrentPageSize, setHistoryChat, showSliceList}) => {
    const {
        currentGroupImages, // 项目图片信息
        currentProjectGroups,
        currentGroup,
        currentImage,
        currentGroupLength
      } = useSelector(
        // @ts-ignore
        state => state.project
      )
    const dispatch = useDispatch()
    // @ts-ignore
    let { projectId } = useParams()

    const [loading, setLoading] = useState(false)
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

    const [sortedGroupImages, setSortedGroupImages] = useState([])
    useEffect(() => {
        if(!currentGroupImages) return
        // const _sortedGroupImages = currentGroupImages.slice().sort(compare)
        // setSortedGroupImages(_sortedGroupImages)
        setSortedGroupImages(currentGroupImages)
    }, [currentGroupImages])

    const onChangeGroup = async (key) => {
        if(key){
            setActiveKey([key])
            const group = currentProjectGroups.find(g => g.imageGroupId === Number(key));

            // dispatch({
            //     type: 'UPDATE_CURRENT_GROUP',
            //     payload: group,
            // })
    
            setLoading(true)
    
            const imageRes = await searchImage(group.imageGroupId)
            const formatImages = imageRes.data.content
            // const formatImages = imageRes.data.content.map(item => ({
            //     ...item,
            //     imageName: item.imageUrl.substring(item.imageUrl.lastIndexOf('/') + 1),
            //     imageUrl: `/uploads/${projectId}/${item.imageName}/deepzoom/imgs/10/0_0.jpeg`
            //   }))

            dispatch({
                type: 'UPDATE_CURRENT_GROUP_IMAGES',
                payload: formatImages
            })
    
            setLoading(false)
        }else{
            setActiveKey([])
        }
    }

    const changeImage = async (image) => {

        const _change = async() => {
            dispatch({
                type: 'UPDATE_CURRENT_IMAGE',
                payload: {...image},
            })

            window.sessionStorage.setItem('tagInitGroupId', image.imageGroup.imageGroupId)
            window.sessionStorage.setItem('tagInitImageId', image.imageId)
            localStorage.setItem("lastViewImageId", image.imageId)
    
            //获取病理图信息
            try{
                const pathoImageInfo = await fetchImageTileInfo(projectId,image.imageName)
                dispatch({
                    type: 'UPDATE_PATHOIMGINFO',
                    payload: pathoImageInfo,
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

    const onSearch = (value) => {
        setSearchValue(value.trim())
    }

    const changePageNum = (value) => [
        setCurrentPage(Math.floor(value))
    ]

    const [activeKey, setActiveKey] = useState([]);
    const sliceItemRefs = useRef({}); // 存储所有 sliceItem 的 ref
    useEffect(() => {
        console.log(showSliceList)
        if(!currentImage) return

        const curGroupId = currentImage.imageGroup.imageGroupId

        if(!showSliceList) {
            console.log(curGroupId)
            onChangeGroup(curGroupId)
            return
        }
        // 查找当前image所在的Group
        
        setActiveKey([curGroupId]);

         // 让 currentImage 滚动到 sliceListBody 容器的最上方
        setTimeout(() => {
            const currentImageRef = sliceItemRefs.current[currentImage?.imageId];
            if (currentImageRef) {
                console.log(currentImageRef)
                currentImageRef.scrollIntoView({
                    behavior: "smooth", // 平滑滚动
                    block: "start", // 使其对齐 sliceListBody 容器顶部
                    inline: "nearest"
                });
            }
        }, 500); // 延迟执行，确保 DOM 已渲染

    }, [showSliceList])

    return (
        <>
            <Draggable handle={`.${styles.sliceListHeader}`} 
                       bounds={bounds}
                       onStart={(event, uiData) => onStart(event, uiData)}>
                <div className={styles.sliceListContainer} ref={draggleRef} style={{ display: showSliceList ? 'block' : 'none' }}>
                    <div className={styles.innerContainer}>
                        <div className={styles.sliceListHeader}>
                            <p className={styles.sliceListTitle}>切片列表</p>
                            <CloseOutlined onClick={()=>{setShowSliceList(false)}} style={{ fontSize: '20px' }}/>
                        </div>
                        <Search
                            placeholder="搜索分组"
                            onSearch={onSearch}
                            className={styles.SearchBar}
                            style={{
                                width: '100%',
                                marginTop: '5px'
                            }}
                        />
                        <Divider style={{ marginTop: '5px', marginBottom: '5px', backgroundColor: '#354052' }} />
                        <div className={styles.sliceListBody}>
                            <Collapse accordion
                                    //   defaultActiveKey={[currentGroup.imageGroupId]}
                                      activeKey={activeKey} 
                                      onChange={onChangeGroup} 
                                      style={{border:'1px solid #272b33', backgroundColor:'transparent'}} 
                                      className={styles.customCollapse}>
                                {currentProjectGroups.map(group => (
                                    <Panel header={group.imageGroupName} key={group.imageGroupId} 
                                           style={{backgroundColor:'#414e5f', border:'1px solid #272b33', marginBottom:'2px'}}>
                                        <Spin spinning={loading && group === currentGroup}>
                                        {sortedGroupImages.length > 0 ? 
                                         ((sortedGroupImages.map((image, index) => (
                                            <div 
                                                key={image.imageId}
                                                ref={(el) => sliceItemRefs.current[image.imageId] = el} // 存储 ref
                                                className={styles.sliceItem}
                                                style={{backgroundColor: `${currentImage?.imageId === image.imageId  ? 'rgba(65, 78, 95, .5)' : 'rgba(65, 78, 95, .8)'}`,
                                                         color: `${currentImage?.imageId === image.imageId  ? '#fff' : '#25b0e5'}`}}
                                                onClick={()=>{changeImage(image)}}>
                                                <div style={{width: '40px', display: 'flex', alignItems: 'center', fontWeight: 'bold', justifyContent: 'space-around'}}>
                                                    <span>{index + 1}</span>
                                                </div>
                                                <Image
                                                    src={`/uploads/${projectId}/${image.imageName}/deepzoom/imgs/10/0_0.jpeg`}
                                                    fallback={imgError}
                                                    preview={false}
                                                    style={{ height: '64px', width: '64px'}}
                                                />
                                                <div style={{ width: '105px',wordWrap: 'break-word', marginLeft:'5px', display:'flex', flexDirection: 'column' }} title={image.imageUrl.substring(image.imageUrl.lastIndexOf('/') + 1)}>
                                                    {/* <span>{image.imageUrl.substring(image.imageUrl.lastIndexOf('/') + 1)}</span> */}
                                                    <span>{getStrWithLen(image.imageUrl.substring(image.imageUrl.lastIndexOf('/') + 1), 25)}</span>
                                                    {image.status === 4 && <CheckCircleTwoTone twoToneColor="#52c41a" />}
                                                </div>
                                            </div>
                                        )))):
                                        (<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{height: '80px', marginTop: '15px', marginBottom:'0'}}/>)}
                                        </Spin>
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>
                        <Divider style={{ marginTop: '10px', marginBottom: '10px', backgroundColor: '#354052' }} />
                        <div className={styles.sliceListFoot}>
                            <Button disabled={currentPage===1} className={styles.disabledButton} onClick={()=>{setCurrentPage(currentPage-1)}}>
                                上一页
                            </Button>
                            <div><InputNumber min={1} max={currentGroupLength} 
                                              className={styles.inputNumberControl}
                                              value={currentPage}
                                              onChange={changePageNum}
                                              onPressEnter={changePageNum}
                                              style={{width: '24px', color: '#f0f0f0'}}
                                              bordered={false} size='small'/>
                                / {currentGroupLength}</div>
                            <Button disabled={currentPage===currentGroupLength} className={styles.disabledButton}  onClick={()=>{setCurrentPage(currentPage+1)}}>
                                下一页
                            </Button>
                        </div>
                    </div>
                </div>
            </Draggable>
        </>
    )
  }
  
  export default SliceList