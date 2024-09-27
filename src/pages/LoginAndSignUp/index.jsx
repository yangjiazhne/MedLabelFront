/*
 * @Author: Azhou
 * @Date: 2021-11-12 16:39:08
 * @LastEditors: Azhou
 * @LastEditTime: 2022-03-01 16:56:02
 */
import React, { useEffect, useState } from 'react'
import { Navbar, FixedFooter } from '@/components/index'
import { useHistory } from 'react-router-dom'
import styles from './index.module.scss'
import Login from './Login'
import SignUp from './SignUp'
import { useDispatch, useSelector } from 'react-redux'
// @ts-ignore
import LoginBG from '@/assets/login_bg.jpg'

const LoginAndSignUp = () => {
  const [panelType, setPanelType] = useState('login')
  const history = useHistory()
  const dispatch = useDispatch()

  // @ts-ignore
  const { isLogin } = useSelector(state => state.user)

  // 登录成功后的回调函数
  const handleSave = res => {
    const token = res.data.token
    window.sessionStorage.setItem('token', token)
    window.sessionStorage.setItem('userDetail', JSON.stringify(res.data))
    dispatch({
      type: 'UPDATE_USER_LOGIN',
      payload: true,
    })
    dispatch({
      type: 'UPDATE_USER_DETAIL',
      payload: res.data
    })
  }

  useEffect(() => {
    if (isLogin) history.push('/userHome/my-projects')
  }, [isLogin])

  return (
    <>
      <Navbar />
      <div className={styles.loginWrap}>
        <div className={styles.loginBg} style={{background: `transparent url(${LoginBG}) center center no-repeat`, backgroundSize: 'cover'}}></div>
        <div className={styles.leftText}>
          <span>极致简易的数据标注</span>
          <span>邀请您的团队，在短短几分钟内就可生成高质量的标注数据</span>
          <span>注册即代表您统一我们的隐私政策协议</span>
        </div>
        {panelType === 'login' && (
          <div className={styles.rightPanel} style={{marginBottom: '70px'}}>
            <Login goToSignUp={() => setPanelType('signUp')} handleSave={handleSave} />
          </div>
        )}
        {panelType === 'signUp' && (
          <div className={styles.rightPanel}>
              <SignUp goToLogin={() => setPanelType('login')} />
          </div>
        )}
      </div>
      <FixedFooter />
    </>
  )
}

export default LoginAndSignUp
