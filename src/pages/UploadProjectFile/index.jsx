import useQuery from '@/hooks/useQuery'
import React, { useState } from 'react'
import UploadPreAnnotated from './UploadPreAnnotated'
import UploadDone from './UploadDone'
import UploadRawData from './UploadRawData'
import UploadResource from './UploadResource'
import UploadDcmOrMrxsData from './UploadDcmOrMrxsData'
import UploadType from '../ProjectOverview/components/Header/UploadType'

const UploadProjectFile = () => {
  const { type: uploadType, imageType: imageType } = useQuery()
  const [fileUploadStats, setFileUploadStats] = useState(null)

  if (fileUploadStats) return <UploadDone fileUploadStats={fileUploadStats} />

  return (
    <div style={{padding: '30px 120px', flex: 1, minHeight:'88vh', width: '100%'}}>
      {uploadType === 'Pre-Annotated' && (
        <UploadPreAnnotated handleUploadDone={setFileUploadStats} />
      )}
      {uploadType === 'DcmOrMrxs' && <UploadDcmOrMrxsData handleUploadDone={setFileUploadStats} imageType={imageType}/>}
      {uploadType === 'Raw' && <UploadRawData handleUploadDone={setFileUploadStats}  imageType={imageType}/>}
      {uploadType === 'Resource' && <UploadResource handleUploadDone={setFileUploadStats} />}
    </div>
  )
}

export default UploadProjectFile
