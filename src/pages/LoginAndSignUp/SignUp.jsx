import React, { useState } from 'react'
import { Form, Input, Button, message, Modal } from 'antd'
import styles from './index.module.scss'
import { userRegister } from '@/request/actions/user'

const SignUp = ({ goToLogin }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 用户注册
  const onFinish = async values => {
    setLoading(true)
    const { username, email, password, phone, profilelink } = values
    const res = await userRegister(username, email, password, phone, profilelink)

    setLoading(false)
    if (!res.err) Modal.success({
      title: '注册成功', 
      content: res.data.msg,
      onOk: () => {goToLogin()}
     })
  }
  return (
    <>
      <div className={styles.title}>&nbsp;注册</div>
      <Form onFinish={onFinish} form={form} style={{width: '80%'}}  className={styles.customForm}>
        <div className={styles.formInputItem}>
          <span>用户名</span>
          <Form.Item
            name="username"
            className={styles.antFormItem}
            rules={[
              {
                required: true,
                message: '请输入用户名!',
              },
            ]}
          >
            <Input placeholder="输入您的用户名"/>
          </Form.Item>
        </div>
        <div className={styles.formInputItem}>
          <span>邮箱</span>
          <Form.Item
            name="email"
            className={styles.antFormItem}
            rules={[
              {
                type: 'email',
                message: '请输入合法的邮箱地址!',
              },
              {
                required: true,
                message: '请输入你的邮箱地址!',
              },
            ]}
          >
            <Input placeholder="me@Email.com"/>
          </Form.Item>
        </div>
        <div className={styles.formInputItem}>
          <span>密码</span>
          <Form.Item
            name="password"
            className={styles.antFormItem}
            rules={[
              {
                required: true,
                message: '请输入你的密码!',
              },
            ]}
          >
            <Input placeholder="请输入密码"/>
          </Form.Item>
        </div>
        <div className={styles.formInputItem}>
          <span>电话号码</span>
          <Form.Item
            name="phone"
            className={styles.antFormItem}
          >
            <Input placeholder="可选"/>
          </Form.Item>
        </div>
        <div className={styles.formInputItem}>
          <span>主页地址</span>
          <Form.Item
            name="profilelink"
            className={styles.antFormItem}
          >
            <Input placeholder="可选"/>
          </Form.Item>
        </div>
        <div className={styles.formBlankItem}></div>
        <div className={styles.formBtnItem}>
          <Button onClick={goToLogin} className={"success-btn " + styles.subBtn}>
            返回登录
          </Button>
          <Button loading={loading} type="primary" htmlType="submit" style={{width:'100%'}}>
            注册
          </Button>
        </div>
      </Form>
    </>
  )
}

export default SignUp
