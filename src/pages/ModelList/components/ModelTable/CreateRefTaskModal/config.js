/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:54:12
 */

// 未使用
import { Select } from 'antd'
import React from 'react'

const { Option } = Select

export const taskArr = [
  { text: '分类', value: 'classification', id: 0 },
  { text: '分割', value: 'segmentation', id: 1 },
  { text: '检测', value: 'detection', id:2 }
]

const convertType = (type) => {

  return taskArr.find(task => task.value == type).id
}


export const selectors = ['SVM', 'RandomForest', 'DecisionTree', 'KNN', 'boosting', 'NaiveBayes']
export const features = ['SIFT', 'ORB', 'SURF', 'HOG']
export const getFormConfig = (models, onFeatureChange, taskType) => {
  return [{
    name: 'modelName',
    label: '模型名称',
    rules: [{ required: true }],
    children: (
      <Select placeholder="请选择模型">
        {models?.filter(item => taskType.includes(taskArr.at(item.type)['value'])).map(v => (
          <Option key={v.modelName} value={v.modelName}>
            {v.modelName}
          </Option>
        ))}
      </Select>
    ),
  }]

}
