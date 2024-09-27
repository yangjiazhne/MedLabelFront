/*
 * @Author: Azhou
 * @Date: 2021-08-19 16:57:07
 * @LastEditors: Azhou
 * @LastEditTime: 2021-08-31 16:55:23
 */

import { HIT_STATE_AL, HIT_STATE_DONE, HIT_STATE_NOT_DONE, HIT_STATE_PRE_TAGGED } from '@/helpers/Utils'

export const renderStatusSelect = () => {
  return [
    {
      valueKey: 'status',
      placeholder: 'Select State',
      options: [
        { text: '未标注', value: HIT_STATE_NOT_DONE },
        // { text: '预标签标注', value: HIT_STATE_PRE_TAGGED },
        // { text: '智能标注', value: HIT_STATE_AL },
        { text: '已标注', value: HIT_STATE_DONE },
        // { text: 'Skipped HITs', value: HIT_STATE_SKIPPED },
        // { text: 'Deleted HITs', value: HIT_STATE_DELETED },
        // { text: 'Re-Tagging Queue', value: HIT_STATE_REQUEUED },
      ],
    }
  ]
}


export const renderModelSelect = (projectModels) => {
  return [
    {
      valueKey: 'model',
      placeholder: 'Filter by Model',
      options: projectModels.map(model => ({
        text: model,
        value: model,
      })),
    }
  ]
}