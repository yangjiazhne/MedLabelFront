/*
 * @Author: Azhou
 * @Date: 2021-05-31 09:51:14
 * @LastEditors: Azhou
 * @LastEditTime: 2021-11-25 11:56:36
 */
import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import qs from 'qs'
import { renderModelSelect, renderStatusSelect } from './utils'
import { Button, Select,Space } from 'antd'
import { HomeOutlined, LeftOutlined } from '@ant-design/icons'
import { getModelList } from '@/request/actions/task'
import { useDispatch, useSelector } from 'react-redux'

const humanAnnotation = {
  modelName: 'human-annotation',
  souce: '',
  type: 'segmentation classification',
  labelsNum: 0,
  id: -1,
}

const DoneTopBar = ({ filterValue }) => {
  const {
    projectModels,
    currentModelInfo
  } = useSelector(
      // @ts-ignore
      state => state.project
  )
  const currentProjectPid = localStorage.getItem('currentProject')

  let history = useHistory()
  const dispatch = useDispatch()

  const { pathname } = useLocation()

  const [modelList, seTmodelList] = useState([])

  const handleChange = (value, selectItem) => {
    if (value === 'all') value = ''
    const trueFilterValue = {}
    if (selectItem.valueKey === 'status') {
      if (value === 'notDone') {
        const modelInfo = modelList.find(ele => ele.modelName === 'human-annotation')
        dispatch({
          type: 'UPDATE_CURRENT_MODEL',
          payload: modelInfo,
        })
        filterValue['model'] = 'human-annotation'
      } else if (value === 'done' && projectModels.length !== 0) {
        const modelInfo = modelList.find(ele => ele.modelName === projectModels[0])
        dispatch({
          type: 'UPDATE_CURRENT_MODEL',
          payload: modelInfo,
        })
        filterValue['model'] = projectModels[0]
      }
    }
    if (selectItem.valueKey === 'model') {
      const modelInfo = modelList.find(ele => ele.modelName === value)
      dispatch({
        type: 'UPDATE_CURRENT_MODEL',
        payload: modelInfo,
      })
    }
    filterValue[selectItem.valueKey] = value
    for (const key in filterValue) {
      if (filterValue[key]) trueFilterValue[key] = filterValue[key]
    }
    history.replace(`${pathname}?${qs.stringify(trueFilterValue)}`)
  }

  // const fetchModelList = async () => {
  //   const res = await getModelList()
  //   if (!res.err) {
  //     const models = res.data.data;
  //     models.unshift(humanAnnotation)
  //     seTmodelList(models)
  //   }
  // }

  // useEffect(() => {
  //   fetchModelList()
  //   dispatch({
  //     type: 'UPDATE_CURRENT_MODEL',
  //     payload: humanAnnotation,
  //   })
  // }, [])

  return (
      <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
      >
        <Button
            icon
            title="Back"
            onClick={() => {
              const projectId = localStorage.getItem('currentProject')
              history.push('/userHome/projects/' + projectId)
            }}
        >
          <LeftOutlined />
        </Button>
        <Button
            icon
            title="Home"
            style={{ margin: '0 10px' }}
            onClick={() => history.push('/userHome/my-projects')}
        >
          <HomeOutlined />
        </Button>
                {/* <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {renderStatusSelect().map(selectItem => (
              <Select
                  key={selectItem.valueKey}
                  placeholder={selectItem.placeholder}
                  value={filterValue[selectItem.valueKey] || undefined}
                  style={{ width: '200px', marginRight: '5px' }}
                  onChange={value => handleChange(value, selectItem)}
              >
                {selectItem.options.map((opt, index) => (
                    <Select.Option value={opt.value} key={index}>
                      {opt.text}
                    </Select.Option>
                ))}
              </Select>
          ))}
        </div>
        {projectModels.length !== 0 && filterValue['status']!=='notDone' && (<div style={{margin: '0 10px', padding:'5px'}}>
          <Space>
            <span style={{marginRight:'5px'}}>标注模型</span>
            {
              renderModelSelect(projectModels)[0].options.map((opt,index)=>(
                  <Button
                      size="small"
                      style={{backgroundColor: currentModelInfo.modelName === opt.text ? '#2185d0' : 'white',

                        color:currentModelInfo.modelName === opt.text ? 'white' : 'black'}}
                      onClick={() => handleChange(opt.text, renderModelSelect(projectModels)[0])}>{opt.text}</Button>
              ))
            }
          </Space>
        </div>)} */}
      </div>
  )
}

export default DoneTopBar