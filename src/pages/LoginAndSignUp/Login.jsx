import React, { useState } from 'react'
import { Form, Input, Button, message } from 'antd'
import styles from './index.module.scss'
import { userLogin } from '@/request/actions/user'

// import useQuery from '@/hooks/useQuery'

const Login = ({ goToSignUp, handleSave }) => {
  // const { type } = useQuery()
  const [loading, setLoading] = useState(false)
  // const [isModalVisible, setIsModalVisible] = useState(false)
  // const [resetEmail, setResetEmail] = useState('')
  const [form] = Form.useForm()

  //用户登录
  const onFinish = async values => {
    setLoading(true)
    const { usernameOrEmails, password } = values
    const res = await userLogin(usernameOrEmails, password)
    setLoading(false)
    console.log(res)
    if(Number(res.data.code) === 200){
      handleSave(res.data)
    }else if(Number(res.data.code) === 401){
      message.error("用户名和密码不匹配")
    }
  }

  // const handleReset = async () => {
  //   if (!isEmail(resetEmail)) {
  //     message.error('邮箱错误!')
  //     return
  //   }
  //   const res = await resetPassword(resetEmail)
  //   if (!res.err) Modal.success({ content: res.data.msg })
  //   else message.error(res.data)
  // }

  return (
    <>
      <div className={styles.title}>&nbsp;登录</div>
      <Form onFinish={onFinish} form={form} style={{width: '80%'}} className={styles.customForm}>
        <div className={styles.formInputItem}>
          <span>账户</span>
          <Form.Item
            name="usernameOrEmails"
            className={styles.antFormItem}
            rules={[
              {
                required: true,
                message: '请输入您的用户名或邮箱',
              },
            ]}
          >
            <Input placeholder="请输入您的用户名或邮箱"/>
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
                message: '请输入您的密码',
              },
            ]}
          >
            <Input type='text' placeholder="请输入您的密码"/>
          </Form.Item>
          {/* <Button type="text" style={{margin: '20px 0', color: '#fff'}} onClick={() => setIsModalVisible(true)}>
            忘记密码?
          </Button> */}
        </div>
        <div className={styles.formBlankItem}></div>
        <div className={styles.formBtnItem}>
          <Button loading={loading} type="primary" htmlType="submit" style={{width:'100%'}}>
            登录
          </Button>
          <Button onClick={goToSignUp} size="small" className={"success-btn " + styles.subBtn}>
            去注册
          </Button>
        </div>
      </Form>
      {/* <Modal
        title="重置密码"
        destroyOnClose
        open={isModalVisible}
        onOk={handleReset}
        onCancel={() => setIsModalVisible(false)}
      >
        <p>请输入您的邮箱，我们会将相关信息发送到您的账户:</p>
        <Input
          placeholder="me@Email.com"
          onChange={e => setResetEmail(e.target.value)}
          value={resetEmail}
        />
      </Modal> */}
    </>
  )
}

export default Login
