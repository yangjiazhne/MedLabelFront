import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { getUserDetail } from '@/request/actions/user'
import { useDispatch, useSelector } from 'react-redux'
import styles from './index.module.scss'
import { Dropdown, Menu, Modal, Tooltip } from 'antd'
import { logOut } from '@/helpers/Utils'
import { DownOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next';
import { pathItems, userOperateItems } from './config'

const Navbar = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  // const [isModalVisible, setIsModalVisible] = useState(false)
  // const [showError, setShowError] = useState(false)
  // const [password, setPassword] = useState('')
  // @ts-ignore
  const { isLogin, userDetail } = useSelector(state => state.user)

  // 中英文切换[现在默认为中文]
  const [language, setLanguage] = useState('zh')
  const { t, i18n } = useTranslation();

  useEffect(( ) => {
    i18n.changeLanguage(language);
  }, [language])

  //导航栏切换
  const [currentPath, setCurrentPath] = useState('datasets');
  const changePath = (e) => {
    const selectedItem = pathItems.find(item => item.key === e.key);
    if (selectedItem) {
      setCurrentPath(selectedItem.key)
      history.push(selectedItem.pathName)
    }
  };

  useEffect(() => {
    if (isLogin) fetchData()
  }, [isLogin])

  useEffect(() => {
    const token = window.sessionStorage.getItem('token')
    // 已登录状态
    if (token) {
      dispatch({
        type: 'UPDATE_USER_LOGIN',
        payload: true,
      })
    }
  }, [])

  // 获取用户信息并存储到redux
  const fetchData = async () => {

    const userDetail = JSON.parse(window.sessionStorage.getItem('userDetail'))
    dispatch({
      type: 'UPDATE_USER_DETAIL',
      payload: userDetail
    })
    // const res = await getUserDetail()
    // if (!res.err) {
    //   dispatch({
    //     type: 'UPDATE_USER_DETAIL',
    //     payload: res.data
    //   })
    // } else {
    //   Modal.error({
    //     title: '提示',
    //     content: '您的登录已过期，请重新登陆',
    //     onOk: () => logOut(history),
    //   })
    // }
  }

  //用户账户相关操作
  const userOperate = ({ key }) => {
    if(key === 'logout'){
      logout()
    }
  };

  const logout = () => {
    Modal.confirm({
      title: '提示',
      content: '确定要退出登录吗',
      onOk: () => logOut(history),
    })
  }

  // 修改密码
  // const onChangePwd = async () => {
  //   if (password.length < 7) {
  //     setShowError(true)
  //     return
  //   }
  //   setShowError(false)
  //   const res = await changePassword(user.email, password)
  //   if (!res.err) {
  //     setIsModalVisible(false)
  //     Modal.success({
  //       content: 'password change success, you need login again with your new password',
  //       onOk: () => logOut(history),
  //     })
  //   }
  // }

  // 查看使用说明
  const goToIntroduction = () => {
    window.open(`${window.location.protocol}//${window.location.host}/Introduction.pdf`, '_blank')
  }

  return (
    <div className={styles.navbarWrap}>
      <div className={styles.navbar}>
        {/*<ArrowLeftOutlined className={styles.backIcon} onClick={history.goBack} />*/}
        <div className={styles.navbarTitleWrap}>
          <span className={styles.navbarTitle}>{t("title")}</span>
          {/* <Tooltip title="点击查看使用说明" className={styles.navbarIcon}>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} onClick={goToIntroduction} />
          </Tooltip> */}
        </div>
      </div>
      {isLogin ? 
        (<Menu onClick={changePath} 
              selectedKeys={[currentPath]} 
              mode="horizontal" 
              items={pathItems} 
              className={styles.customMenu}/>) : 
        (<div className={styles.customMenu}/>
      )}
      <div className={styles.navbarMenu}>
        <div className={styles.navbarMenuItem}>
          {isLogin && (
            <Dropdown
              menu={{
                items : userOperateItems,
                onClick : userOperate
              }}
            >
              <span>
                {t('greeting') + `, ${userDetail?.username}`}
                <DownOutlined style={{ marginLeft: '5px' }} />
              </span>
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  )
}

export default Navbar
