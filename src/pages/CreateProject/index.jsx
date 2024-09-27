import CreateProjectView from './createProject'
import UploadDone from './UploadDone'
import React, { useState } from 'react'

const CreateProject = ( {handleUploadDone} ) => {
    const [fileUploadStats, setFileUploadStats] = useState(null)

    if (fileUploadStats) return <UploadDone fileUploadStats={fileUploadStats} />

    return (
        <div>
            <CreateProjectView handleUploadDone={setFileUploadStats}/>
        </div>
    )
}

export default CreateProject
