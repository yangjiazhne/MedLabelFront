// @ts-nocheck
import { message, Modal } from 'antd'
import store from '@/redux/store'
import { ERROR_MESSAGES } from '@/constants'
import history from '@/helpers/history';

export const DOC_ENTITY_COLORS = [
  '#9ACD32',
  '#E52B50',
  '#50C878',
  '#007FFF',
  '#CD7F32',
  '#8A2BE2',
  '#0000FF',
  '#0095B6',
  '#DE5D83',
  '#89CFF0',
  '#964B00',
  '#800020',
  '#702963',
  '#960018',
  '#007BA7',
  '#7B3F00',
  '#0047AB',
  '#6F4E37',
  '#B87333',
  '#F88379',
  '#DC143C',
  '#DE3163',
  '#00FF3F',
  '#FFD700',
  '#808080',
  '#00FF00',
  '#3FFF00',
  '#4B0082',
  '#00A86B',
  '#29AB87',
  '#B57EDC',
  '#C8A2C8',
  '#FF00FF',
  '#FF00AF',
  '#800000',
  '#000080',
  '#CC7722',
  '#808000',
  '#FFA500',
  '#FF4500',
  '#DA70D6',
  '#FFE5B4',
  '#D1E231',
  '#CCCCFF',
  '#1C39BB',
  '#FFC0CB',
  '#8E4585',
  '#003153',
  '#CC8899',
  '#800080',
  '#E30B5C',
  '#FF0000',
  '#C71585',
  '#FF007F',
  '#E0115F',
  '#FA8072',
  '#92000A',
  '#0F52BA',
  '#FF2400',
  '#C0C0C0',
  '#708090',
  '#A7FC00',
  '#00FF7F',
  '#D2B48C',
  '#483C32',
  '#008080',
  '#40E0D0',
  '#EE82EE',
  '#40826D',
]

export const DUMMY_UID = '123'
export const DUMMY_TOKEN = '11111'
export const IMAGE_POLYGON_BOUNDING_BOX_V2 = 'IMAGE_POLYGON_BOUNDING_BOX_V2'

export const HIT_STATE_SKIPPED = 'skipped'
export const HIT_STATE_DONE = 'done'
export const HIT_STATE_SL = 'sl' // 模型标注结果Self Learning(易分类的)
export const HIT_STATE_AL = 'al' // 人工标注结果Active Learning(不易分类的)

export const HIT_STATE_NOT_DONE = 'notDone'
export const HIT_STATE_DELETED = 'deleted'
export const HIT_STATE_PRE_TAGGED = 'preTagged'
export const HIT_STATE_REQUEUED = 'reQueued'

export const hitStateNameMap = {
  deleted: 'Deleted',
  skipped: 'Skipped',
  done: 'Completed',
  sl: 'Self Learning',
  al: 'Active Learning',
  reQueued: 'Re-queued for Annotation',
  notDone: 'Not Done',
  preTagged: 'Pre Tagged',
}

export const createEntitiesJson = ruleLine => {
  const rules = JSON.parse(ruleLine)
  if (!rules.tags) {
    return {}
  }
  if (typeof rules.tags !== 'string') {
    const entities = []
    const entityJson = {}
    for (let index = 0; index < rules.tags.length; index++) {
      entities.push(rules.tags[index].label)
      entityJson[rules.tags[index].label] = rules.tags[index].imageUrl
    }
    return { entities, entityJson }
  } else if (typeof rules.tags === 'string') {
    return {
      entities: rules.tags.split(',').map(Function.prototype.call, String.prototype.trim),
      entityJson: {},
    }
  }
}

export const createDocEntityColorMap = entities => {
  const colorMap = {}
  if (entities !== undefined) {
    for (let index = 0; index < entities.length; index++) {
      colorMap[entities[index]] = DOC_ENTITY_COLORS[index % DOC_ENTITY_COLORS.length]
    }
  }
  return colorMap
}

export const timeConverter = unixTimestamp => {
  if (!unixTimestamp) return ''
  const aaa = new Date(unixTimestamp * 1000)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const year = aaa.getFullYear()
  const month = months[aaa.getMonth()]
  const date = aaa.getDate()
  // const hour = aaa.getHours();
  // const min = aaa.getMinutes();
  // const sec = aaa.getSeconds();
  const time = date + ' ' + month + ' ' + year
  return time
}

export const timeConverter2 = unixTimestamp => {
  if (!unixTimestamp) return ''
  const aaa = new Date(unixTimestamp * 1000)
  const year = aaa.getFullYear()
  const month = aaa.getMonth() + 1
  const day = aaa.getDay()
  const time =
    year.toString().padStart(4, '0') +
    '-' +
    month.toString().padStart(2, '0') +
    '-' +
    day.toString().padStart(2, '0')
  return time
}

export const isEmail = str => {
  const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
  return reg.test(str)
}

export const getImageSize = imgSrc => {

  return new Promise((resolve, reject) => {
    const image = document.createElement('img')
    image.src = imgSrc
    image.onload = async () => {
      // 获取图片的原始宽度
      // @ts-ignore
      const naturalWidth = image.naturalWidth
      // @ts-ignore
      const naturalHeight = image.naturalHeight
      resolve({
        naturalWidth,
        naturalHeight,
      })
    }
  })
}

export function hexToRgba(hex, opacity) {
  if (!hex) return ''
  return (
    'rgba(' +
    parseInt('0x' + hex.slice(1, 3)) +
    ',' +
    parseInt('0x' + hex.slice(3, 5)) +
    ',' +
    parseInt('0x' + hex.slice(5, 7)) +
    ',' +
    opacity +
    ')'
  )
}

export const getStrWithLen = (str, len) => {
  if (str.length < len) return str
  else return str.slice(0, len) + '...'
}

export const logOut = history => {
  store.dispatch({
    type: 'UPDATE_USER_LOGIN',
    payload: false,
  })

  history.replace('/entryPage')
  location.reload()
  window.sessionStorage.clear()
}

/**
 * 复制单行内容到粘贴板
 * content : 需要复制的内容
 * message : 复制完后的提示，不传则默认提示"复制成功"
 */
export function copyToClip(content, msg) {
  var aux = document.createElement('input')
  aux.setAttribute('value', content)
  document.body.appendChild(aux)
  aux.select()
  document.execCommand('copy')
  document.body.removeChild(aux)
  message.success(msg || '复制成功')
}

window.timer = null
export function debounce(fn, delay) {
  if (window.timer) {
    clearTimeout(window.timer) //保证只开启一个定时器
  }
  window.timer = setTimeout(function () {
    fn() //延迟delay，执行函数
  }, delay)
}

export function arraysEqualIgnoreOrder(a, b) {
  if (a.length !== b.length) {
    return false
  }
  const sortedA = Array.from(new Set(a)).sort()
  const sortedB = Array.from(new Set(b)).sort()
  for (let i = 0; i < sortedA.length; i++) {
    if (sortedA[i] !== sortedB[i]) {
      return false
    }
  }
  return true
}

// 异常处理
export const handleError = (errorCode) => {
  // 用户token过期
  if (errorCode === 705) {
    Modal.error({
      title: '提示',
      content: '您的登录已过期，请重新登陆',
      onOk: () => {
        store.dispatch({
          type: 'UPDATE_USER_LOGIN',
          payload: false,
        })
      
        window.location.href = "/#/entryPage";
        // location.reload()
        window.sessionStorage.clear()
      }
    })
    return;
  }

  // 对其他错误代码设置错误消息
  message.error(ERROR_MESSAGES[errorCode] || "发生未知错误")
};


export const handleUnauthorized = () => {
  Modal.error({
    title: '提示',
    content: '您的登录已过期，请重新登陆',
    onOk: () => {
      store.dispatch({
        type: 'UPDATE_USER_LOGIN',
        payload: false,
      })
    
      window.location.href = "/#/entryPage";
      // location.reload()
      window.sessionStorage.clear()
    }
  })
}