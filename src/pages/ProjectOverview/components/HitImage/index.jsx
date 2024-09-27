import React from 'react'
import { Image, Tooltip } from 'antd'
import { CopyOutlined, FileSearchOutlined } from '@ant-design/icons'
import { imgError } from './config'
import styles from './index.module.scss'
import { copyToClip, getStrWithLen } from '@/helpers/Utils'
import { imgUploadPre } from '@/constants'
import { useTranslation } from 'react-i18next'

// 废弃
const HitImage = ({ hitDetail }) => {
  // console.log(hitDetail)
    const { t } = useTranslation()

  if (!hitDetail || !hitDetail.data || !hitDetail.fileName) return (
    <div></div>
  )
  
  return (
    <div className={styles.container}>
      <div className={styles.imgWrap}>
        <Image
          src={hitDetail.data}
          fallback={imgError}
          style={{ height: '130px', width: '130px'}}
        />
      </div>

      <p>
        <span>{getStrWithLen(hitDetail?.fileName.split('thumbnail')[0], 15)}</span>
          <Tooltip title={hitDetail.fileName.split('thumbnail')}>
              <FileSearchOutlined className={styles.copyBtn} />
          </Tooltip>
        {/*<Tooltip title={t('click')}>*/}
        {/*  <CopyOutlined*/}
        {/*    className={styles.copyBtn}*/}
        {/*    onClick={() => copyToClip(hitDetail.data.split(imgUploadPre)[1])}*/}
        {/*  />*/}
        {/*</Tooltip>*/}
      </p>
    </div>
  )
}

export default HitImage
