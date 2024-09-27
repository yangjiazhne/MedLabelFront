/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:23:53
 */
import { Button, Dropdown, Empty, Form, Modal, Input, message, Select } from 'antd'
import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import styles from './index.module.scss'
import { Link } from 'react-router-dom'
import { SmallDashOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { projectOperateItems } from './config'
import { createProject, editProject, searchProject } from '@/request/actions/project'
import { getStrWithLen } from '@/helpers/Utils'

const { TextArea } = Input;

// 编辑数据集
const ProjectEditModal = ({ open, onCreate, onCancel, title, okText, project}) => {
  const [form] = Form.useForm();
  // 解析 imageExtensions 为数组
  const extensionsArray = JSON.parse(project.imageType.imageExtensions);

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="取消"
      onCancel={onCancel}
      destroyOnClose
      onOk={() => {
        form
          .validateFields()
          .then((values) => {
            onCreate(values);
            form.resetFields();
          })
          .catch((info) => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          name: project.projectName,
          description: project.description,
          tagsList: JSON.parse(project.categories)
        }}
      >
        <Form.Item
          name="name"
          label="数据集名称"
          rules={[
            {
              required: true,
              message: '请输入数据集名称!',
            },
          ]}
        >
          <Input placeholder="请输入数据集名称"/>
        </Form.Item>
        <Form.Item
          label="标签"
          name="tagsList"
          rules={[
            {
              required: true,
              message: '必须填写标签',
            },
          ]}
        >
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="请添加标签, 以英文','划分, 支持复制"
            tokenSeparators={[',']}
          />
        </Form.Item>
        <Form.Item 
          name="imageType" 
          label="图片类型">
          <Input defaultValue={`${project.imageType.imageTypeName}(${extensionsArray.map(ext => `.${ext}`).join(", ")})`} disabled/>
        </Form.Item>
        <Form.Item 
          name="description" 
          label="数据集简介"
          rules={[
            {
              required: true,
              message: '请输入数据集简介!',
            },
          ]}>
          <TextArea placeholder="请输入数据集简介"/>
        </Form.Item>
      </Form>
    </Modal>
  )
}

const SingleProject = ({ projectDetails, deleteProject, keyword, page, size }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [isHovered, setIsHovered] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false)

  // 处理鼠标悬浮事件
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  // 处理鼠标移出事件
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const projectOperate = ({ key }) => {
    if(key === 'delete'){
      deleteProject(projectDetails.projectId)
    }
    if(key === 'edit'){
      setIsEditProjectModalOpen(true)
    }
  };

  // const tagLens = useMemo(() => {
  //   if (!projectDetails || !projectDetails.taskRules) {
  //     return 0
  //   }
  //   const rules = JSON.parse(projectDetails.taskRules)
  //   return rules.tags.split(',').length
  // }, [projectDetails])

  // const taskPercent = useMemo(() => {
  //   if (projectDetails.totalHits === 0) return 0
  //   return Number(((projectDetails.totalHitsDone / projectDetails.totalHits) * 100).toFixed(2))
  // }, [projectDetails])

  return (
    <div 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={styles.projectWrap}>
      {/* {projectDetails.status === 'INVALID' && (
        <img src={invalidIcon} className={styles.invalid} alt="invalid" />
      )} */}
      {/* <Empty description={'暂无数据'}/> */}
      <div className={styles.title}>{getStrWithLen(projectDetails.projectName, 24)}</div>
      {/* 条件渲染遮罩层 */}
      {isHovered && (
        <div 
          className={styles.projectMask}
        >
          <div style={{ textAlign: 'right', paddingRight: '15px', marginTop: '5px' }}>
            <Dropdown
              menu={{
                items : projectOperateItems,
                onClick : projectOperate
              }}
            >
              <SmallDashOutlined style={{color: '#fff'}}/>
            </Dropdown>
          </div>
          <div className={styles.title} style={{ color: '#fff', height: '100px'}}>{getStrWithLen(projectDetails.projectName, 16)}</div>
          <Button style={{width: '60%', margin: '30px auto', marginTop: '0' , borderRadius: '5px'}}>
            <Link
              to={{
                pathname: '/userHome/projects/' + projectDetails.projectId,
              }}
            >
              查看详情
            </Link>
          </Button>
        </div>
      )}
      <ProjectEditModal 
        open={isEditProjectModalOpen}
        onCreate={async (values) => {
            // 不允许重名
            const projectRes = await searchProject()
            const allProjects = projectRes.data.content
            const matchedProject = allProjects.find(p => p.projectName === values.name)
            if(matchedProject && matchedProject.length !== 0 && matchedProject.projectId !== projectDetails.projectId){
              Modal.error({
                title: '该数据集名称已存在！',
                content: '请更换一个数据集名称',
              });
              return
            }

            const res = await editProject([
              {
                projectId: projectDetails.projectId,
                newProjectName: values.name,
                newProjectDescription: values.description,
                newCategories: values.tagsList
              }])
            setIsEditProjectModalOpen(false);
            if (!res.err) {
              message.success('修改成功')

              // 查询数据集
              let projectName = undefined
              if (keyword.trim() !== '') projectName = keyword.trim()
              const res = await searchProject(undefined, projectName, page-1, size)

              if (!res.err) {
                dispatch({
                  type: 'UPDATE_CURRENT_USER_PROJECTS',
                  payload: null
                })
                dispatch({
                  type: 'UPDATE_CURRENT_USER_PROJECTS',
                  payload: res.data.content,
                })
                dispatch({
                  type: 'UPDATE_CURRENT_USER_PROJECTS_LENGTH',
                  payload: res.data.totalElements,
                })
              } 
            } else {
              message.error(res || '修改失败')
            }
            setIsHovered(false);
          }}
        onCancel={()=>{setIsEditProjectModalOpen(false); setIsHovered(false);}}
        title={"编辑数据集信息"}
        okText={"完成"}
        project={projectDetails}
      />
      {/* <Progress
        percent={taskPercent}
        format={percent => `${projectDetails.totalHitsDone} / ${projectDetails.totalHits}`}
        style={{ width: '80%', margin: '10px 0' }}
      /> */}
      {/* <div className={styles.desc}>
        <Tag color="cyan">
          {projectDetails.totalHits} {t('hits')}
        </Tag>
        <Tag color="geekblue">
          {tagLens} {t('entities')}
        </Tag>
        <Tag color="purple">
          {t(projectDetails.imageType)} {'数据集'}
        </Tag>
        {projectDetails.public && <Tag color="green">public</Tag>}
      </div> */}
      {/* <div className={styles.btnWrap}>
        <Button type="primary">
          <Link
            to={{
              pathname: '/userHome/projects/' + projectDetails.id,
            }}
          >
            {t('details')}
          </Link>
        </Button>
      </div> */}
    </div>
  )
}

export default SingleProject
