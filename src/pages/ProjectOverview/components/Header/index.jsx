/*
 * @Author: Azhou
 * @Date: 2021-10-25 23:14:47
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 15:28:50
 */
import React, { useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { Modal, Breadcrumb, Dropdown, message, Checkbox, Divider } from 'antd'
import { UnorderedListOutlined } from '@ant-design/icons'
import { VIcon, VButton } from '@/components'
import { primaryColor } from '@/constants'
import { useSelector } from 'react-redux'
import styles from './index.module.scss'
import { downloadFile } from './utils'
import { copyToClip, getStrWithLen } from '@/helpers/Utils'
import { downLoadItem } from './config'
import { searchGroup } from '@/request/actions/group'

const CheckboxGroup = Checkbox.Group;

const DownloadDataModal = ({open, onOk, onCancel, title, okText, projectGroups, downType}) => {
  const [checkedList, setCheckedList] = useState([])
  const [indeterminate, setIndeterminate] = useState(false)
  const [checkAll, setCheckAll] = useState(false)
  const onChange = (list) => {
    setCheckedList(list);
    setIndeterminate(!!list.length && list.length < projectGroups.length);
    setCheckAll(list.length === projectGroups.length);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? projectGroups.map(group => group.imageGroupId) : []);
    setIndeterminate(false);
    setCheckAll(e.target.checked);
  };

  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="取消"
      onCancel={()=>{
        onCancel()
        setCheckedList([])
        setIndeterminate(false)
        setCheckAll(false)
      }}
      destroyOnClose
      okButtonProps={{ disabled: (checkedList.length === 0) }}
      onOk={()=>{
          downloadFile(downType, checkedList)
          setCheckedList([])
          setIndeterminate(false)
          setCheckAll(false)
          message.info("正在下载中，请稍等...")
          onOk()
      }}
    >
      <div style={{ boxShadow: '0 0 15px #ededed', borderRadius: '4px'}}>
      <div style={{ padding: '10px'}}>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={checkAll}>
              全部选中
          </Checkbox>
          <Divider style={{ marginTop: '5px', marginBottom: '5px'}} />
          <div style={{maxHeight: '250px', overflowY: 'auto', width: '100%'}}>
              <CheckboxGroup value={checkedList} onChange={onChange} style={{width: '100%'}}>
                  {projectGroups?.map(group => {
                      const isChecked = checkedList.includes(group.imageGroupId);
                      return (<div key={group.imageGroupId} 
                                    style={{
                                            marginBottom: '4px',
                                            backgroundColor: isChecked ? '#f0f0f0' : 'transparent',
                                            padding: '4px',
                                            borderRadius: '4px',
                                          }}>
                                  <Checkbox value={group.imageGroupId} style={{alignItems: 'center'}}>
                                      <div style={{display:'flex', alignItems: 'center'}}>
                                          <div>{getStrWithLen(group?.imageGroupName, 50)}</div>
                                      </div>
                                  </Checkbox>
                              </div>)})}
              </CheckboxGroup>
          </div>
      </div>
      </div>
    </Modal>
  )
}

const Header = () => {
  let history = useHistory()

  const { projectDetails } = useSelector(
    // @ts-ignore
    state => state.project
  )

  const [downloadGroup, setDownloadGroup] = useState([])
  const [downJsonModalOpen, setDownJsonModalOpen] = useState(false)
  const [downZipModalOpen, setDownZipModalOpen] = useState(false)  
  const [downUrlModalOpen, setDownUrlModalOpen] = useState(false)  

  // const startTagging = () => {
  //   if (projectDetails.status === 'INVALID') {
  //     Modal.warning({ content: '数据集无效，无法标记，请联系管理员处理' })
  //     return
  //   }
  //   if (projectHits.length === 0) {
  //     Modal.warning({ content: '该数据集还未上传任何图片，请先上传图片' })
  //     return
  //   }
  //   if (projectDetails.imageType == 'mrxs') {
  //     history.push(
  //       `/projects/pathoSpace/${projectDetails.id}?status=notDone&model=human-annotation`
  //     )
  //   } else
  //     history.push(`/projects/space/${projectDetails.id}?status=notDone&model=human-annotation`)
  // }

  // const showTagged = () => {
  //   if (projectDetails.status === 'INVALID') {
  //     Modal.warning({ content: '数据集无效，无法标记，请联系管理员处理' })
  //     return
  //   }
  //   if (projectHits.length === 0) {
  //     Modal.warning({ content: '该数据集还未上传任何图片，请先上传图片' })
  //     return
  //   }
  //   if (projectDetails.imageType == 'mrxs') {
  //     history.push(`/projects/pathoSpace/${projectDetails.id}?status=done`)
  //   } else history.push(`/projects/space/${projectDetails.id}?status=done`)
  // }

  const downLoadOperate = async ({ key }) => {
    const projectGroupsRes= await searchGroup(projectDetails.projectId)
    setDownloadGroup( projectGroupsRes.data.content)
    if(key === 'JSON'){
      setDownJsonModalOpen(true)
    }
    if(key === 'ZIP'){
      setDownZipModalOpen(true)
    }
    if(key === 'URL'){
      setDownUrlModalOpen(true)
    }
  };


  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Breadcrumb>
        <span style={{color: '#000'}}><VIcon type="icon-position02" style={{ fontSize: '16px', marginRight:'10px' }} />您的位置：</span>
        <Breadcrumb.Item>
          <Link to="/userHome/my-projects" style={{ color: 'blue' }}>
            {/* {userDetails.userName} */}
            Home
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{projectDetails.projectName}</Breadcrumb.Item>
      </Breadcrumb>
      <Dropdown
        menu={{
          items: downLoadItem,
          onClick: downLoadOperate
        }}
      >
        <VButton color={primaryColor}>
          <UnorderedListOutlined />
            下载
        </VButton>
      </Dropdown>
      <DownloadDataModal
        open={downJsonModalOpen}
        onOk={()=>{setDownJsonModalOpen(false)}}
        onCancel={()=>{setDownJsonModalOpen(false)}}
        title={"下载Json文件"}
        okText={"下载"}
        projectGroups={downloadGroup}
        downType={'JSON'}
      />
      <DownloadDataModal
        open={downZipModalOpen}
        onOk={()=>{setDownZipModalOpen(false)}}
        onCancel={()=>{setDownZipModalOpen(false)}}
        title={"下载Zip文件"}
        okText={"下载"}
        projectGroups={downloadGroup}
        downType={'ZIP'}
      />
      <DownloadDataModal
        open={downUrlModalOpen}
        onOk={()=>{setDownUrlModalOpen(false)}}
        onCancel={()=>{setDownUrlModalOpen(false)}}
        title={"下载图像Url"}
        okText={"下载"}
        projectGroups={downloadGroup}
        downType={'URL'}
      />
    </div>
  )
}

export default Header
