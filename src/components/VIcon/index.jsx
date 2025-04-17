import { createFromIconfontCN } from '@ant-design/icons'

// const VIcon = createFromIconfontCN({
//   scriptUrl: '//at.alicdn.com/t/c/font_4637384_stpawl8p5j.js', // 在 iconfont.cn 上生成
// })

const VIcon = createFromIconfontCN({
  scriptUrl: `${window.location.protocol}//${window.location.host}/font_4637384_stpawl8p5j.js`, // 这里改成本地路径
})

export default VIcon
