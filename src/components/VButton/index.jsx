import { Button } from 'antd'
import React, { useMemo } from 'react'

const VButton = props => {
  const { color } = props

  const btnStyle = useMemo(() => {
    let style = {
      borderRadius: '5px',
      ...(props.style || {})
    }
    if (color) {
      style = {
        ...style,
        backgroundColor: color,
        borderColor: color,
      }
    }
    return style
  }, [color])

  return (
    <Button {...props} type="primary" style={btnStyle}>
      {props.children}
    </Button>
  )
}

export default VButton
