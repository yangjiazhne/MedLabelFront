import React, { useEffect, useState } from 'react'
import useQuery from '@/hooks/useQuery'
import { Form, Input, Button, Modal, Checkbox, Select, Spin, message, Progress } from 'antd'
import {
  editProject,
  createProject,
  deleteProject,
  searchProject
} from '@/request/actions/project'
import { searchImageType } from '@/request/actions/imageType'

import { useHistory } from 'react-router'
import styles from './index.module.scss'
import { UploadOutlined } from '@ant-design/icons'

const CreateProjectView = ({ handleUploadDone }) => {
  let { id: projectId } = useQuery()
  const history = useHistory()
  const [errorMsg, setErrorMsg] = useState()
  const [uploading, setUploading] = useState(false) // 仿照UploadRawData.jsx
  const [uploadProcess, setUploadProcess] = useState(0)
  const [pImageType, setPImageType] = useState('')
  const [pTaskType, setPTaskType] = useState('')
  const [imageType, setImageType] = useState(1)
  const [AllImageType, setAllImageType] = useState()
  const [form] = Form.useForm()

  // const isSelectedTask = async value => {
  //   console.log(value)
  //   if (value === 'IMAGE_DETECTION_IMAGE_SEGMENTATION') {
  //     setClassify(false)
  //   } else {
  //     setClassify(true)
  //   }
  // }

  const fetchData = async () => {
    const imageTypeRes = await searchImageType()

    const transformedImageTypeRes = imageTypeRes.data.map(type => {
      // 将 JSON 格式的字符串转换为数组
      const extensionsArray = JSON.parse(type.imageExtensions);

      const extensionsString = extensionsArray.map(ext => `.${ext}`).join(', ');

      return {
        label: `${type.imageTypeName}(${extensionsString})`,
        value: type.imageTypeId
      };
    });

    setAllImageType(transformedImageTypeRes)

    // if (projectId) {
    //   // 获取项目详情
    //   const result = await searchProject(projectId)
      
    //   const projectDetails = result.data.content[0]

    //   setPImageType(projectDetails.imageType.imageTypeId)

    //   form.setFields([
    //     { name: 'project_name', value: projectDetails.projectName },
    //     { name: 'instructions', value: projectDetails.description }
    //   ])
    // }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const onFinish = async values => {
    const { project_name, tagsList, instructions } = values

    const projectRes = await searchProject()

    const allProjects = projectRes.data.content

    const matchingProject = allProjects.find(p => p.projectName === project_name)
    
    if((matchingProject && matchingProject.length !== 0 && !projectId) || (matchingProject && matchingProject.length !== 0 && projectId && matchingProject[0].projectId.toString() !== projectId)){
      Modal.error({
        title: '该数据集名称已存在！',
        content: '请更换一个数据集名称',
      });
      return
    }

    setUploading(true)
    // let res
    // if (projectId) {
    //   res = await editProject([{
    //     projectId: Number(projectId),
    //     newProjectName: project_name,
    //     newProjectDescription: instructions
    //   }])
    // } else {
    const  res = await createProject([{
        projectName: project_name,
        projectDescription: instructions,
        imageTypeId: imageType,
        categories: tagsList
      }])
    // }
    setUploading(false)
    if (res.err) message.error(res?.data || '创建失败')
    else {
      Modal.success({
        content: '信息提交成功',
        onOk: () => {
          if (projectId) {
            history.push('/userHome/projects/' + projectId.toString())
          }else{
            history.push('/userHome/my-projects')
          }
        },
      })
    }
  }

  return (
    <div style={{ margin: 'auto', width: '600px', textAlign: 'center', padding: '40px 0',  minHeight:'88vh'}}>
      <h1 style={{ marginBottom: '50px' }}>{projectId ? '编辑' : '创建'}数据集</h1>
      <Form
        form={form}
        layout="vertical"
        style={{ textAlign: 'left' }}
        initialValues={{ imageType: 'normal' }}
        onFinish={onFinish}
      >
        <Form.Item
          label="数据集名称"
          name="project_name"
          rules={[
            {
              required: true,
              message: '必须填写数据集名称',
            },
          ]}
        >
          <Input placeholder="汽车/动物 框选数据集" />
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
        {/* <Form.Item label="任务类型" name="taskType">
          {pTaskType === '' && (
            <Select
              style={{ width: '100%' }}
              placeholder="请选择任务类型"
              onChange={isSelectedTask}
              defaultValue={'IMAGE_DETECTION_IMAGE_SEGMENTATION'}
              options={[
                {
                  label: '检测与分割',
                  value: 'IMAGE_DETECTION_IMAGE_SEGMENTATION',
                },
                {
                  label: '分类',
                  value: 'IMAGE_CLASSIFICATION',
                },
              ]}
            ></Select>
          )}
          {pTaskType !== '' && (
            <Select
              style={{ width: '100%' }}
              defaultValue={pTaskType}
              disabled
              options={[
                {
                  label: '检测与分割',
                  value: 'IMAGE_DETECTION_IMAGE_SEGMENTATION',
                },
                {
                  label: '分类',
                  value: 'IMAGE_CLASSIFICATION',
                },
              ]}
            ></Select>
          )}
        </Form.Item> */}
        <Form.Item
          label="图片类型"
          name="imageType"
          rules={[
            {
              required: true,
              message: '必须选择图片类型',
            },
          ]}
        >
          {pImageType === '' && (
            <Select
              style={{ width: '100%' }}
              options={AllImageType}
              onChange={(value) => setImageType(value)}
              defaultValue={1}
            ></Select>
          )}
          {pImageType !== '' && (
            <Select
              style={{ width: '100%' }}
              options={imageType}
              defaultValue={pImageType}
              disabled
            ></Select>
          )}
        </Form.Item>
        <Form.Item
          label="数据集简介"
          name="instructions"
          rules={[
            {
              required: true,
              message: '必须填写数据集简介',
            },
          ]}
        >
          <Input.TextArea
            rows={5}
            placeholder="汽车物体矩形框选数据集，包含汽车的矩形框标注，用于汽车识别。"
          />
        </Form.Item>
      </Form>
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {uploading && <Spin tip={'项目正在创建中...'} style={{ margin: '20px auto' }}></Spin>}
        {(uploading || uploadProcess > 0) && (
          <Progress
            percent={Number(uploadProcess.toFixed(2))}
            style={{ width: '400px', margin: '20px auto' }}
          />
        )}
        <Button type="primary" onClick={() => form.submit()} disabled={uploading}>
          提交
        </Button>
        <div style={{ color: 'red', marginTop: 8 }}>{errorMsg}</div>
      </div>
    </div>
  )
}

export default CreateProjectView
