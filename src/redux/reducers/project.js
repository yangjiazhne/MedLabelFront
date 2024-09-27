/*
 * @Author: Azhou
 * @Date: 2021-06-15 15:04:30
 * @LastEditors: Azhou
 * @LastEditTime: 2022-11-22 10:23:42
 */
import { hitShapeTypes, traPathGenerateWay, intePathGenerateWay, contorlTypes } from '@/constants'
import { createDocEntityColorMap, createEntitiesJson } from '@/helpers/Utils'
import {
  CLEAR_PROJECT_STATE,

  UPDATE_PROJECT_DETAIL,
  UPDATE_CURRENT_PROJECT_GROUPS,
  UPDATE_PROJECT_MODELS,

  UPDATE_CURRENT_GROUP,
  UPDATE_CURRENT_GROUP_IMAGES,
  UPDATE_CURRENT_GROUP_LENGTH,

  UPDATE_CURRENT_IMAGE,
  UPDATE_CURRENT_GROUP_IMAGE_LENGTH,
  UPDATE_CURRENT_IMAGE_SIZE,
  UPDATE_PATHOIMGINFO,
  UPDATE_PATHOVIEWSIZE,
  UPDATE_CURRENT_INDEX,
  
  UPDATE_CURRENT_CANVAS,
  UPDATE_CURRENT_ACTIVE_OBJ,
  UPDATE_CURRENT_VIEWER,
  UPDATE_ANNOTION,
  UPDATE_CURRENT_ANNOTION,
  UPDATE_NEW_ANNOTATION,
  UPDATE_PROJECDT_ENTITY,
  UPDATE_CUSTOM_ENTITY,
  UPDATE_CURRENT_ENTITY,
  UPDATE_CURRENT_SHAPE,
  UPDATE_CURRENT_TRAPATHWAY,
  UPDATE_CURRENT_INTEPATHWAY,
  UPDATE_CURRENT_MODEL_INFERENCE,
  UPDATE_CURRENT_CONTROL_TYPE,
  UPDATE_INIT_BOUNDING_BOX,
  UPDATE_BOUNDING_BOX_MAP,
  UPDATE_CURRENT_CLASSIFY_INFO,
  UPDATE_STROKEWIDTH,
  UPDATE_CIRCLERADIUS,
  // UPDATE_ISEDIT,
  UPDATE_ISMUTITAG,
  UPDATE_LAUNCH_REF_PROCESS,
  UPDATE_SEGPOSITIVE,
  UPDATE_SAMMODE,
  UPDATE_CANNYTHRESHOLD,
  UPDATE_THRESHOLD,
  UPDATE_CURRENT_MODEL_INFO

} from '../actionTypes'
import { ConsoleSqlOutlined } from '@ant-design/icons'

export const projectInitialState = {
  // 数据集相关信息
  projectDetails: {}, // 项目详情
  currentProjectGroups: null,   //当前数据集下的分组
  projectModels: [], //项目使用哪些模型标记过

  // 分组相关信息
  currentGroup: null,  //当前选中的组信息
  currentGroupLength: 0,  //分页查询分组长度
  currentGroupImages: [], //当前组中的图像

  // 图像相关信息
  currentImage: null, //当前选中的图像
  currentGroupImageLength: 0,  // 分页查询中图像的长度
  currentImgSize: {   //选中图像的宽高
    width: 0,
    height: 0,
  },
  pathoImgInfo: {     //病理图相关信息
    url: '',
    overlap: '',
    tileSize: '',
    format: '',
    size: {
      width: 0,
      height: 0,
    },
  },
  pathoViewSize: {      //病理图在视窗内的图像大小
    width: 0,
    height: 0,
  },
  currentIndex: 0, // 当前标记项在所有图像中的index

  // 标注相关
  annotion: [],   // 当前图像的标注列表
  currentAnnotion: null,  // 当前的标注信息
  newAnnotation: null, // 当前新增加的标注内容，用于Ctrl Z 删除最近标注
  currentCanvas: null, // 当前画布canvas
  currentActiveObj: null,   //当前选中对象
  currentViewer: null, //当前的viewer对象
  projectEntities: [],   // 当前数据的labels
  customEntities: [],   // 当前图像的自定义类别
  projectEntityColorMap: {},  // 数据集的数据类别的颜色映射
  entityColorMap: {},     // 当前数据的数据类别的颜色映射
  currentEntity: '', // 当前选择的label类型
  currentShape: hitShapeTypes.RECT, // 当前选择要绘制的shape
  currentTraPathWay: traPathGenerateWay.GRABCUT, // 传统算法当前生成路径的方式
  currentIntePathWay: intePathGenerateWay.EISEG, // 智能标注算法当前生成路径的方式
  currentModelInference: '',  //智能算法单张推理的推理模型
  currentControlType: contorlTypes.DRAG, // 当前画布的控制类型【default/drag】
  initBoundingBox: [], // 标注文件存储的的初始标注信息
  boundingBoxMap: [], // 当前标记项的标记信息
  classifyInfo: {   // 当前标记项的classification分类信息
    label: [],
    note: '',
  },
  strokeWidth: 1, // 画笔宽度
  circleRadius: 2, // 圆形半径
  // isEdit: false,   // 是否在done状态下进行编辑
  isMutiTag: false, // 是否是多次标注状态
  launchRefProcess: false,

  segPositive: true, // EISeg当前的点性质
  SAMMode: 'point',  //SAMSeg分割形式
  cannyThreshold: [50, 100], // canny threshold
  threshold: [10, 30], 
  currentModelInfo: {},
}

const project = function (state = projectInitialState, action) {
  switch (action.type) {
    case CLEAR_PROJECT_STATE:
      return projectInitialState
    // 数据集相关
    case UPDATE_PROJECT_DETAIL:
      return {
        ...state,
        projectDetails: action.payload,
      }

    case UPDATE_CURRENT_PROJECT_GROUPS:
      return {
        ...state,
        currentProjectGroups: action.payload
      }

    case UPDATE_PROJECT_MODELS:
      return {
        ...state,
        projectModels: action.payload.models,
      }


    // 分组相关
    case UPDATE_CURRENT_GROUP:
      return {
        ...state,
        currentGroup: action.payload
      }

    case UPDATE_CURRENT_GROUP_IMAGES:
      return {
        ...state,
        currentGroupImages: action.payload
      }

    case UPDATE_CURRENT_GROUP_LENGTH:
      return {
        ...state,
        currentGroupLength: action.payload
      }


    // 图像相关
    case UPDATE_CURRENT_IMAGE:
      return {
        ...state,
        currentImage: action.payload
      }    

    case UPDATE_CURRENT_GROUP_IMAGE_LENGTH:
      return {
        ...state,
        currentGroupImageLength: action.payload
      }

    case UPDATE_CURRENT_IMAGE_SIZE:
      return {
        ...state,
        currentImgSize: action.payload,
      }

    case UPDATE_PATHOIMGINFO:
      return {
        ...state,
        pathoImgInfo: action.payload,
      }

    case UPDATE_PATHOVIEWSIZE:
      return {
        ...state,
        pathoViewSize: action.payload,
      }

    case UPDATE_CURRENT_INDEX:
      return {
        ...state,
        currentIndex: action.payload,
      }


    // 标注相关
    case UPDATE_CURRENT_CANVAS:
      return {
        ...state,
        currentCanvas: action.payload,
      }

    case UPDATE_CURRENT_ACTIVE_OBJ:
      return {
        ...state,
        currentActiveObj: action.payload,
      }

    case UPDATE_CURRENT_VIEWER:
      return {
        ...state,
        currentViewer: action.payload
      }
    
    case UPDATE_ANNOTION:
      return {
        ...state,
        annotion: action.payload
      }

    case UPDATE_NEW_ANNOTATION:
      return {
        ...state,
        newAnnotation: action.payload
      }

    case UPDATE_CURRENT_ANNOTION:
      return {
        ...state,
        currentAnnotion: action.payload
      }

    case UPDATE_PROJECDT_ENTITY:
      const entities = action.payload
      return {
        ...state,
        projectEntities: entities,
        currentEntity: entities[0],
        projectEntityColorMap: createDocEntityColorMap(entities),
      }

    case UPDATE_CUSTOM_ENTITY:
      const categories = action.payload.sort((a, b) => a.id - b.id);
      const customColor = {}
      categories.forEach(item => {
        customColor[item.entity] = item.color
      })
      return {
        ...state,
        customEntities: categories,
        entityColorMap: {
          ...state.projectEntityColorMap, // 现有的 entityColorMap
          ...customColor      // 数据的 customColor 映射
        }
      }

    case UPDATE_CURRENT_ENTITY:
      return {
        ...state,
        currentEntity: action.payload,
      }

    case UPDATE_CURRENT_SHAPE:
      return {
        ...state,
        currentShape: action.payload,
      }
    case UPDATE_CURRENT_TRAPATHWAY:
      return {
        ...state,
        currentTraPathWay: action.payload,
      }
    case UPDATE_CURRENT_INTEPATHWAY:
      return {
        ...state,
        currentIntePathWay: action.payload,
      }
    case UPDATE_CURRENT_MODEL_INFERENCE:
      return {
        ...state,
        currentModelInference: action.payload,
      }
    case UPDATE_CURRENT_CONTROL_TYPE:
      return {
        ...state,
        currentControlType: action.payload,
      }

    case UPDATE_INIT_BOUNDING_BOX:
      return {
        ...state,
        initBoundingBox: action.payload,
        boundingBoxMap: action.payload,
        newAnnotation: null
      }

    case UPDATE_BOUNDING_BOX_MAP:
      return {
        ...state,
        boundingBoxMap: action.payload,
      }

    case UPDATE_CURRENT_CLASSIFY_INFO:
      return {
        ...state,
        classifyInfo: action.payload,
      }

    case UPDATE_STROKEWIDTH:
      return {
        ...state,
        strokeWidth: action.payload,
      }
    case UPDATE_CIRCLERADIUS:
      return {
        ...state,
        circleRadius: action.payload,
      }

    // case UPDATE_ISEDIT:
    //   return {
    //     ...state,
    //     isEdit: action.payload,
    //   }

    case UPDATE_ISMUTITAG:
      return {
        ...state,
        isMutiTag: action.payload,
      }

    case UPDATE_LAUNCH_REF_PROCESS:
      return {
        ...state,
        launchRefProcess: action.payload,
      }

    case UPDATE_SEGPOSITIVE:
      return {
        ...state,
        segPositive: action.payload,
      }

    case UPDATE_SAMMODE:
      return {
        ...state,
        SAMMode: action.payload,
      }
    
    case UPDATE_CANNYTHRESHOLD:
      return {
        ...state,
        cannyThreshold: action.payload,
      }

    case UPDATE_THRESHOLD:
      return {
        ...state,
        threshold: action.payload,
      }

    case UPDATE_CURRENT_MODEL_INFO:
      return {
        ...state,
        currentModelInfo: action.payload,
      }

    default:
      return state
  }
}
export default project
