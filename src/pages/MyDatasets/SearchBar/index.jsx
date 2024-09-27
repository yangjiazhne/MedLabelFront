import React, { useState, useEffect } from 'react'
import { getHomeData } from '@/request/actions/user'
import { getPublicDatasets } from '@/request/actions/project'
import { SearchOutlined } from '@ant-design/icons';
import { Button, Modal, Select, Input } from 'antd'
import styles from './index.module.scss'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

//已废弃
const SearchBar = ({ setKeyWord, setImageTypeFilter, setTaskTypeFilter }) => {
    const [key, setKey] = useState('')
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()
    const { t } = useTranslation()

    function handleSearch () {
        // // event.preventDefault()
        // const regex = new RegExp(`${keyword}`)
        // const filteredData = data.filter(item => item.name.match(regex))
        // setSearchResult(filteredData)
        setKeyWord(key.trim())
    }

    const allSearch = async (e) => {
        // if (e.keyCode === 13 && keyword.trim().length === 0) {
        //     refreshData()
        // } else if (e.keyCode === 13) {     
        //     const regex = new RegExp(`${keyword}`)
        //     const filteredData = data.filter(item => item.name.match(regex))
        //     setSearchResult(filteredData)
        // }
        if (e.keyCode === 13){
            setKeyWord(key.trim())
        }
    }

    return (
        <div style={{ paddingTop: '6px', marginLeft: 'auto', width: '100%', display: 'flex', justifyContent: 'center'}}>
            <Input
                value={key}
                style={{width: '30%', height: '60px'}}
                prefix={<SearchOutlined style={{color: '#5cc1bb', fontSize: '20px'}}/>} 
                placeholder={t('keyword')}
                size="large"
                onChange={e => setKey(e.target.value)}
                onKeyUp={allSearch}/>
            <Select
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
            </Select>
            <Button type="primary" onClick={handleSearch} size="large" style={{marginLeft: '10px', height: '60px', width: '100px', backgroundColor:'#2cad2c', borderColor: 'green'}}>搜索</Button>
        </div>
    )
}

export default SearchBar