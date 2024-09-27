/*
 * @Author: Azhou
 * @Date: 2021-12-02 17:25:37
 * @LastEditors: Azhou
 * @LastEditTime: 2021-12-02 21:22:34
 */
export const renderLeftTime = timeLeft => {
  var h = Math.floor((timeLeft / 3600) % 24)
  var m = Math.floor((timeLeft / 60) % 60)
  var s = Math.floor(timeLeft % 60)
  if (h < 1) {
    return (timeLeft = m + '分钟' + s + '秒')
  } else {
    return (timeLeft = h + '小时' + m + '分钟' + s + '秒')
  }
}
