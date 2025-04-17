/*
 * @Author: Azhou
 * @Date: 2021-10-25 23:14:47
 * @LastEditors: Azhou
 * @LastEditTime: 2021-11-27 09:49:59
 */
import React from 'react'
import {
  CodeOutlined,
  DeleteOutlined,
  FileZipOutlined,
} from '@ant-design/icons'

export const downLoadItem = [
    {
      key: 'JSON',
      label: '下载Json文件',
      icon: <CodeOutlined style={{ color: 'teal' }} />,
    },
    {
      key: 'ZIP',
      label: '下载Zip压缩文件',
      icon: <CodeOutlined style={{ color: 'teal' }} />,
    },
    {
      key: 'URL',
      label: '下载图像Url地址',
      icon: <CodeOutlined style={{ color: 'teal' }} />,
    },
  ]


export const getOptionsBtn = ({
  history,
  downloadFile,
  // deleteProject,
  // projectDetails,
  // createByMe,
  // addData,
}) => {
  let result = [
    {
      icon: <CodeOutlined style={{ color: 'teal' }} />,
      title: 'downloadJson',
      onClick: () => downloadFile('JSON'),
    },
    {
      icon: <FileZipOutlined style={{ color: 'blue' }} />,
      title: 'downloadZip',
      onClick: () => downloadFile('zip'),
    },
  ]
  // if (createByMe)
  //   result.unshift(
  //     {
  //       icon: <PlusSquareOutlined style={{ color: 'green' }} />,
  //       title: '添加数据',
  //       onClick: addData,
  //     },
  //     {
  //       icon: <FormOutlined style={{ color: 'purple' }} />,
  //       title: '编辑数据集',
  //       onClick: () => history.push(`/userHome/import?id=${projectDetails.id}`),
  //     },
  //     {
  //       icon: <DeleteOutlined style={{ color: 'red' }} />,
  //       title: '删除数据集',
  //       onClick: deleteProject,
  //     }
  //   )
  return result
}

export const uploadTypes = [
  { uploadType: 'Raw', header: 'uploadRawData', desc: 'uploadRawDesc' },
  // {
  //   uploadType: 'Pre-Annotated',
  //   header: 'Upload Pre-Annotated Data',
  //   desc: 'If you have some data which is already pre-annotated and want to go through annotations and correct them.',
  // },
  {
    uploadType: 'Resource',
    header: 'uploadResourceData',
    desc: "uploadResourceDesc",
  },
]
