import { DeleteOutlined, FileZipOutlined, UploadOutlined } from '@ant-design/icons'
import { updateImage, uploadImage, uploadImageFolder } from '@/request/actions/image'
import { Form, Select, Button, message, Progress, Tabs, Upload, Spin, Modal } from 'antd'
import bytes from 'bytes'
import React, { useState, useEffect } from 'react'
import styles from './index.module.scss'
import { useHistory } from 'react-router'
import { useParams } from 'react-router-dom'
const { TabPane } = Tabs
const { Dragger } = Upload
import { searchGroup} from '@/request/actions/group'
import { logOut } from '@/helpers/Utils'

const UploadDcmOrMrxsData = ({ handleUploadDone, imageType }) => {
  const [form] = Form.useForm()
  const [txtFile, setTxtFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProcess, setUploadProcess] = useState(0)
  const [tabValue, setTabValue] = useState('txt')
  const [errorMsg, setErrorMsg] = useState()
  const history = useHistory()
  const [options, setOptions] = useState([])
  //@ts-ignore
  let {projectId} = useParams()

  // 获取项目所有的组
  const fetchGroup = async() => {
    const projectGroupsRes= await searchGroup(projectId)
  
    const groups = projectGroupsRes.data.content 

    const value = groups.map(group => ({
      value: group.imageGroupId,
      label: group.imageGroupName
    }));

    setOptions(value)
  }

  useEffect(() => {
    fetchGroup()
  }, [])

  const beforeUpload = file => {
    if (tabValue === 'txt') {
        setTxtFile(file)
    } 
    return false
  }

  const readFile = async file => {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result)
      }

      reader.onerror = () => {
        reject(reader.error)
      }

      reader.readAsText(file)
    })
  }

  const handleSubmit = async values => {
    const { group } = values
    
    // 上传txt文件
    if (tabValue === 'txt') {
        if (!txtFile) {
          message.error('Please choose a txt file')
          return
        }
        setUploading(true)
        const content = await readFile(txtFile)
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line !== '')
        const total = lines.length
        if (total < 1) {
          Modal.error({
            content: '输入的txt文件中无有效地址',
          })
          setUploading(false)
          return 0
        }

        const imageList = []
        const folderList = []

        lines.forEach(path => {
          if (path.includes('.')) {
            imageList.push(path);
          } else {
            folderList.push(path);
          }
        });

        // Dcm 数据
        if (Number(imageType) === 2){
          if (folderList.length > 0){
            try {
              const responses = await Promise.all(
                folderList.map(line => 
                  uploadImageFolder({
                    imageGroupId: group,
                    imageTypeId: 2,
                    imageFolderUrl: line,
                  })
                )
              );
            } catch (error) {
              message.error("上传失败")
            }
          }
    
          if (imageList.length > 0){
            const res = await uploadImage({
              imageGroupId: group,
              imageTypeId: 2,
              imageUrls: imageList
            })
    
            if(res.err){
              message.error("上传失败")
            }
          }
        }

        // 病理图数据
        if (Number(imageType) === 3){
          if (folderList.length > 0){
            try {
              const responses = await Promise.all(
                folderList.map(line => 
                  uploadImageFolder({
                    imageGroupId: group,
                    imageTypeId: 3,
                    imageFolderUrl: line,
                  })
                )
              );
            } catch (error) {
              message.error("上传失败")
            }
          }
    
          if (imageList.length > 0){
            const res = await uploadImage({
              imageGroupId: group,
              imageTypeId: 3,
              imageUrls: imageList
            })
    
            if(res.err){
              message.error("上传失败")
            }
          }
        }

        setUploading(false)

        Modal.success({
          content: '数据正在上传中....',
          onOk: () => {
            history.push('/userHome/projects/' + projectId.toString())
          },
        })
    }
  }

  return (
    <div style={{ textAlign: 'center', width: '80%', margin: 'auto' }}>
      <h3 style={{ margin: '20px 0' }}> {imageType === 2 ? "上传数字医学图像数据" : "上传病理图数据"} </h3>
      <Tabs
        defaultActiveKey="images"
        onChange={key => {
          setTabValue(key)
          setUploadProcess(0)
        }}
      >
        <TabPane  tab="txt文本文件" key="txt" disabled={uploading}>
          <div style={{ margin: '20px auto', width: '500px', textAlign: 'left' }}>
              <Form
                form={form}
                layout="vertical"
                style={{ textAlign: 'left' }}
                initialValues={{ imageType: 'normal' }}
                onFinish={handleSubmit}
              >
                <Form.Item
                  label="分组名称"
                  name="group"
                  rules={[
                    {
                      required: true,
                      message: '必须选择分组',
                    },
                  ]}
                >
                    <Select
                      style={{ width: '100%' }}
                      options={options}
                    ></Select>
                </Form.Item>
                <div style={{ marginBottom: '15px' }}>
                  <p style={{ opacity: '0.7', fontSize: '14px' }}>
                    {imageType === 2 ? 
                      "请上传文本文件, 根据行数生成数据个数, 文本文件的每行为图片所在文件夹的绝对路径" : 
                      "请上传文本文件, 根据行数生成数据个数, 文本文件的每行为图片的绝对路径"}
                  </p>
                  <Dragger
                    beforeUpload={beforeUpload}
                    showUploadList={true}
                    maxCount={1} 
                    accept=".txt"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽文件到此区域</p>
                  </Dragger>
                </div>
              </Form>
          </div>
        </TabPane>
      </Tabs>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin tip={"文件正在解析到数据库"} style={{margin: '20px auto'}} spinning={uploading}>
          <Button type="default" onClick={() => history.push('/userHome/projects/' + projectId.toString())} disabled={uploading}
              style={{marginRight:'40px'}}>
            返回
          </Button>
          <Button type="primary" onClick={() => form.submit()} disabled={uploading}>
            提交
          </Button>
        </Spin>
      </div>
    </div>
  )
}

export default UploadDcmOrMrxsData
