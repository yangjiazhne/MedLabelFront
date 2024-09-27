/*
 * @Author: Azhou
 * @Date: 2021-05-11 10:47:01
 * @LastEditors: Azhou
 * @LastEditTime: 2021-11-25 10:07:05
 */
import {
  CreateProject,
  LoginAndSignUp,
  MyProjects,
  TaskList,
  ModelList,
  UserHome,
  ProjectOverview,
  TaggerSpace,
  UploadProjectFile,
  PathoTaggerSpace,
} from '../pages'

import UploadDone from '../pages/CreateProject/UploadDone'

const routes = [
  {
    path: '/entryPage',
    component: LoginAndSignUp,
  },
  {
    path: '/userHome',
    component: UserHome,
    routes: [
      {
        path: '/userHome/my-projects',
        component: MyProjects,
      },
      {
        path: '/userHome/import',
        component: CreateProject,
      },
      {
        path: '/userHome/task-list/:datasetTaskId?',
        component: TaskList,
      },
      {
        path: '/userHome/model-list',
        component: ModelList,
      },
      {
        path: '/userHome/project-file/:projectId',
        component: UploadProjectFile,
      },
      { path: '/userHome/projects/overview', component: ProjectOverview },
      { path: '/userHome/projects/:projectId', exact: true, component: ProjectOverview },
      {
        path: '/userHome/test',
        component: () => (
          <div>
            <UploadDone fileUploadStats={{ numHitsCreated: 1, numHitsIgnored: 2, taskId: 36 }} />
          </div>
        ),
      },
    ],
  },
  {
    path: '/projects/space/:projectId', // 设置的:orgName/:projectName 通过 useParams钩子函数获取
    exact: true,
    component: TaggerSpace,
  },
  {
    path: '/projects/pathoSpace/:projectId',
    exact: true,
    component: PathoTaggerSpace,
  },
]

export default routes
