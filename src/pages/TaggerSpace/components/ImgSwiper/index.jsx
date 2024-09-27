/*
 * @Author: Azhou
 * @Date: 2021-07-13 11:29:06
 * @LastEditors: Azhou
 * @LastEditTime: 2021-08-20 16:48:54
 */
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getStrWithLen } from '@/helpers/Utils'
import styles from './index.module.scss'
import { Modal } from 'antd'
import { ExclamationCircleOutlined, CheckCircleTwoTone } from '@ant-design/icons'

import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Pagination, Navigation, Controller } from 'swiper/core'
import 'swiper/swiper.min.css'
import 'swiper/components/pagination/pagination.min.css'
import 'swiper/components/navigation/navigation.min.css'

SwiperCore.use([Navigation, Pagination, Controller])

function compare(itemA, itemB) {
  if (itemA.imageName < itemB.imageName) return -1
  else if (itemA.imageName > itemB.imageName) return 1
  else return 0
}

const ImgSwiper = ({ changeSession }) => {
  const dispatch = useDispatch()
  const { currentGroupImages, currentImage, currentIndex } = useSelector(
    // @ts-ignore
    state => state.project
  )
  const windowHeight = window.innerHeight
  const [sortedGroupImages, setSortedGroupImages] = useState([])
  const [swiper, setSwiper] = React.useState(null)
  
  const [lastIndex, setLastIndex] = useState([])

  useEffect(() => {
    if(sortedGroupImages.length === 0) return
    const result = findLastIndex(sortedGroupImages)
    setLastIndex(result)
  }, [sortedGroupImages]);
  const findLastIndex = (sortedProjectHits) => {
    let result = []
    sortedProjectHits.forEach((item, index) => {
      result[getName(item.imageName)] = index
    })
    return result
  }
  const getName = (fileName) => {
    const nonAlphaIndex = fileName.match(/[^a-zA-Z]/).index;
    return fileName.substring(0, nonAlphaIndex)
  }

  useEffect(() => {
    if(!currentImage) return
    const isImageInGroup = currentGroupImages.some(image => image.imageId === currentImage.imageId)
    if(isImageInGroup){
      const _sortedGroupImages = currentGroupImages.slice().sort(compare)
      setSortedGroupImages(_sortedGroupImages)
    }
  }, [currentImage])

  const changeSlide = activeIndex => {
    const _change = () => {
      dispatch({
        type: 'UPDATE_CURRENT_HIT_INDEX',
        payload: activeIndex,
      })
      dispatch({
        type: 'UPDATE_CURRENT_IMAGE',
        payload: sortedGroupImages[activeIndex],
      })
      window.sessionStorage.setItem('tagInitImageId', sortedGroupImages[activeIndex].imageId)
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

  return (
    <div style={{ padding: '20px', height: windowHeight }}>
      <Swiper
        style={{ width: '100%', height: '100%' }}
        direction='vertical'
        slidesPerView={6}
        spaceBetween={8}
        centeredSlides
        initialSlide={sortedGroupImages.findIndex(v => v.imageId === currentImage.imageId)} // 设置初始选中值
        pagination={{
          clickable: true,
          el: '.swiper-pagination', // 去除轮播图下方的白点
        }}
        // slideToClickedSlide
        // navigation
        onSlideChange={swiper => changeSlide(swiper.activeIndex)}
        onSwiper={swiper => setSwiper(swiper)}
      >
        {sortedGroupImages.map((v, index) => (
          <SwiperSlide key={index} onClick={() => swiper.slideTo(index)}>
            <div className={styles.left}>
              <img
                  style={{
                    border: v.imageId === currentImage.imageId ? '3px solid red' : 'none',
                    padding: v.imageId === currentImage.imageId ? '4px 4px' : '0',
                  }}
                  key={index}
                  src={v.imageUrl}
                  className={styles.swiperImg}
              />
              <div
                  title={v.imageName}
                  style={{ textAlign: 'center', fontSize: '12px', width: '150px', color:'#fff' }}
              >
                {/* {v.correctResult && <CheckCircleTwoTone twoToneColor="#52c41a" />} */}
                {getStrWithLen(v.imageName, 20)}
              </div>
              {/* {Object.values(lastIndex).includes(index) && (
                <div className={styles.divider}></div>
              )} */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default ImgSwiper
