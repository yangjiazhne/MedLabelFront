// import { uploadFileDT } from '@/request/actions/project'
import { DeleteOutlined, FileZipOutlined, UploadOutlined } from '@ant-design/icons'
import { Button, message, Progress, Tabs, Upload, Spin, Form, Select, Modal } from 'antd'
import bytes from 'bytes'
import React, { useState, useEffect } from 'react'
import styles from './index.module.scss'
import { searchGroup} from '@/request/actions/group'
import { updateImage, uploadImage, uploadImageFolder } from '@/request/actions/image'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router'

const { TabPane } = Tabs
const { Dragger } = Upload

const UploadRawData = ({ handleUploadDone, imageType }) => {
  const [form] = Form.useForm()
  const [txtFile, setTxtFile] = useState(null)
  const [zipFile, setZipFile] = useState(null)
  const [imageList, setImageList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProcess, setUploadProcess] = useState(0)
  const [tabValue, setTabValue] = useState('txt')
  const history = useHistory()
  //@ts-ignore
  let {projectId} = useParams()
  const [options, setOptions] = useState([])

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
    if (tabValue === 'zip') {
      setZipFile(file)
    }
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

  const onImageChange = file => {
    setImageList(file.fileList)
  }

  const handleSubmit = async values => {
    const { group } = values
    console.log(values)
    const projectId = localStorage.getItem('currentProject')
    let res
    // 批量上传图片
    if (tabValue === 'images') {
      if (!imageList.length) {
        message.error('Please choose at least one image')
        return
      }
      let uploadedCnt = 0
      let fileSize = 0
      setUploading(true)
      for (let image of imageList) {
        // let res = await uploadFileDT(image.originFileObj, projectId)
        // if (!res?.err) {
        //   uploadedCnt++
        //   fileSize += image.size
        //   setUploadProcess((uploadedCnt / imageList.length) * 100)
        // }
      }
      setUploading(false)
      handleUploadDone({
        numHitsCreated: uploadedCnt,
        numHitsIgnored: imageList.length - uploadedCnt,
        totalUploadSizeInBytes: fileSize,
      })
    }
    // 上传zip文件
    if (tabValue === 'zip') {
      if (!zipFile) {
        message.error('Please choose a zip file')
        return
      }
      setUploading(true)
      // res = await uploadFileDT(zipFile, projectId, event => setUploadProcess(event.percent))
      setUploading(false)
      // if (res?.err) message.error(res.data || 'something was wrong')
      // else handleUploadDone(res.data)
    }

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

      // 图像扩展名
      const imageExtensions = ['.jpg', '.png', '.jpeg', '.bmp'];

      // 初始化图像和文件夹列表
      const imageList = [];
      const folderList = [];

      // 遍历数据列表进行分类
      lines.forEach(item => {
          // 检查是否包含图像扩展名
          const isImage = imageExtensions.some(ext => item.endsWith(ext));
          
          if (isImage) {
              imageList.push(item);  // 将图像放入图像列表
          } else {
              folderList.push(item);  // 将非图像的路径放入文件夹列表
          }
      });

      if (folderList.length > 0){
        try {
          const responses = await Promise.all(
            folderList.map(line => 
              uploadImageFolder({
                imageGroupId: group,
                imageTypeId: 1,
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
          imageTypeId: 1,
          imageUrls: imageList
        })

        if(res.err){
          message.error("上传失败")
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
    <div style={{ textAlign: 'center' }}>
      <h3 style={{ margin: '20px 0' }}> 上传原始数据 </h3>
      <Tabs
        defaultActiveKey="txt"
        onChange={key => {
          setTabValue(key)
          setUploadProcess(0)
        }}
      >
        {/* <TabPane tab="图片文件" key="images" disabled={uploading}>
          <div style={{ margin: '20px auto', width: '500px', textAlign: 'center' }}>
            <Form
              form={form}
              layout="vertical"
              style={{ textAlign: 'center' }}
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
              <div style={{ opacity: '0.7', fontSize: '17px' }}>
                选择一张或多张（最多20张）图片 <br />
              </div>
              <div style={{ margin: '20px auto'}}>
                <Dragger
                  beforeUpload={beforeUpload}
                  onChange={onImageChange}
                  multiple
                  maxCount={20}
                  accept="image/*"
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
        <TabPane tab="Zip文件" key="zip" disabled={uploading}>
          <div style={{ margin: '20px auto', width: '500px', textAlign: 'center' }}>
            <Form
              form={form}
              layout="vertical"
              style={{ textAlign: 'center' }}
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
              <div style={{ opacity: '0.7', fontSize: '17px' }}>一个包含所有图片的压缩文件</div>
              <div style={{ opacity: '0.7', fontSize: '17px' }}>
                压缩包类型: .zip,.gzip,.gz,.tar,.mrxs,.nii,.dcm,.svs,.tif
              </div>
              <div style={{ margin: '20px auto' }}>
                <Dragger
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  accept=".zip,.gzip,.gz,.tar,.mrxs,.nii,.dcm,.svs,.tif"
                  showUploadList={false}
                >
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域</p>
                </Dragger>
              </div>
              {zipFile && (
                <div className={styles.fileList}>
                  <FileZipOutlined style={{ fontSize: '26px' }} />
                  <span style={{ margin: '0 15px' }}>{zipFile.name}</span>
                  {`size: ${bytes(zipFile.size)}`}
                  <DeleteOutlined
                    style={{ marginLeft: 'auto', cursor: 'pointer' }}
                    onClick={() => setZipFile(null)}
                  />
                </div>
              )}
            </Form>
          </div>
        </TabPane> */}
        <TabPane tab="路径文本文件" key="txt" disabled={uploading}>
          <div style={{ margin: '20px auto', width: '500px', textAlign: 'center' }}>
              <Form
                form={form}
                layout="vertical"
                style={{ textAlign: 'center' }}
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
                  <div style={{ opacity: '0.7', fontSize: '17px' }}>
                      {"请上传一个文本文件, 根据行数生成数据个数, 文本文件的每行为图片的绝对路径或图片所在文件夹的绝对路径"}
                  </div>
                  {/* <div style={{ margin: '20px auto' }}> */}
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
                  {/* </div> */}
                </div>
              </Form>
          </div>
        </TabPane>
      </Tabs>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {(uploading || uploadProcess > 0) && (
          <Progress
            percent={Number(uploadProcess.toFixed(2))}
            style={{ width: '400px', margin: 'auto' }}
          />
        )}
        {
            uploading && (
                <Spin tip={"文件正在解析到数据库"} style={{margin: '20px auto'}}></Spin>
            )
        }
        <Button
          style={{ width: '200px', margin: '20px auto' }}
          type="primary"
          disabled={uploading}
          onClick={() => form.submit()}
        >
          提交
        </Button>
      </div>
    </div>
  )
}

export default UploadRawData
