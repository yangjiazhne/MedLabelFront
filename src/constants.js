/*
 * @Author: Azhou
 * @Date: 2021-05-11 23:17:06
 * @LastEditors: Azhou
 * @LastEditTime: 2021-11-29 17:00:14
 */
export const VISIBILITY_FILTERS = {
    ALL: 'all',
    COMPLETED: 'completed',
    INCOMPLETE: 'incomplete',
}

let serverAddress
serverAddress = 'http://10.214.242.155'

// 前后端服务器地址请在这里修改
export const imgUploadPre = `${serverAddress}:3032`
// java服务端地址
export const SERVER_HOST = `${serverAddress}:3032`
// python服务端地址
export const PYTHON_SERVER_HTTP = `${serverAddress}:5088/`
export const SERVER_WS = 'ws://10.214.242.155:8080/'
export const PYTHON_SERVER_WS = 'ws://10.214.242.155:5088/'

export const BASE_URL = SERVER_HOST + '/api'
export const STATIC_URL = SERVER_HOST + '/uploads'

// 标注页面的形状绘制类型
export const hitShapeTypes = {
    POINT: 'point',
    RECT: 'rect',
    ELLIPSE: 'ellipse',
    POLYGON: 'polygon',
    POLYGONPATH: 'polygonPath',
    PATH: 'path',
    TRAPATH: 'traPath',
    INTEPATH: 'intePath',
    MANUALCLOSE: 'manualClose',
    MANUAL: 'manual',
    MODELINFERENCE: 'modelInference',
    NONE:'none' //拖拽状态
}

export const hitShapeTypeLabels = {
    [hitShapeTypes.POINT]: '点',
    [hitShapeTypes.CIRCLE]: '圆',
    [hitShapeTypes.ELLIPSE]: '椭圆',
    [hitShapeTypes.RECT]: '矩形',
    [hitShapeTypes.POLYGON]: '多边形',
    [hitShapeTypes.POLYGONPATH]: '自由路径',
    [hitShapeTypes.PATH]: '路径',
    [hitShapeTypes.NONE]: '无' // 拖拽状态
};

// 标注页面path路径生成方式
export const traPathGenerateWay = {
    GRABCUT: 'Grabcut',
    CANNY: 'Canny',
    REGIONGROW: 'RegionGrow',
    THRESHOLD: 'Threshold',
    WATERSHED: 'WaterShed',
    REGIONSPLITMERGE: 'RegionSplitMerge',
}

export const intePathGenerateWay = {
    SAMSEG: 'sam_seg',
    EISEG: 'eiseg',
    //HQSAMSEG: 'HQ_sam_click',
    //SemSAMSEG: 'Semantic_SAM_click',
}

export const contorlTypes = {
    DRAG: 'drag',
    DEFAULT: 'default'
}

export const primaryColor = '#5cc1bb'

export const taskArr = [
    { text: '分类', value: 'IMAGE_CLASSIFICATION', id: 0 },
    { text: '分割', value: 'IMAGE_SEGMENTATION', id: 1 },
    { text: '检测', value: 'IMAGE_DETECTION', id: 2 },
]

export const taskTypes = {
    0: { label: '分类', value: 'IMAGE_CLASSIFICATION' },
    1: { label: '分割', value: 'IMAGE_DETECTION_IMAGE_SEGMENTATION' },
    2: { label: '检测', value: 'IMAGE_DETECTION_IMAGE_SEGMENTATION' },
}

// 异常处理
export const ERROR_MESSAGES = {
    700: "不合法的请求头",
    701: "用户不存在",
    702: "用户名已存在",
    703: "邮箱已存在",
    704: "无效的 JWT 令牌",
    705: "用户token过期",
    706: "不支持的 JWT 令牌",
    707: "空的 JWT 声明",
    708: "用户登录过期",
    720: "未找到项目",
    730: "未找到图片",
    731: "无效的图片 URL",
    732: "图片文件夹不存在或不是文件夹",
    733: "读取文件夹错误",
    734: "不支持跨项目移动",
    740: "未找到图片分组id",
    741: "未找到组",
    742: "无效的组数据",
    750: "未找到图片类型",
    751: "图片类型与项目不匹配",
    760: "未找到标注数据",
    801: "无效的参数",
    800: "内部服务器错误",
};
  