import { traPathGenerateWay, intePathGenerateWay, hitShapeTypes } from '@/constants'
import { Radio, Slider } from 'antd'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const TopRightWidget = ({ drawingFree, spotSize, setSpotSize, setBrushMode }) => {
    const dispatch = useDispatch()
    const [tempBrushMode, setTempBrushMode] = useState('pencil') // pencil / eraser
    const { currentIntePathWay, currentTraPathWay, currentShape, segPositive, threshold, cannyThreshold, SAMMode } = useSelector(
        // @ts-ignore
        state => state.project
    )

    if (currentShape ===  hitShapeTypes.INTEPATH && currentIntePathWay === intePathGenerateWay.EISEG)
        return (
            <Radio.Group
                value={segPositive}
                size="small"
                onChange={() =>
                    dispatch({
                        type: 'UPDATE_SEGPOSITIVE',
                        payload: !segPositive,
                    })
                }
            >
                <Radio.Button value={true}>positive</Radio.Button>
                <Radio.Button value={false}>negative</Radio.Button>
            </Radio.Group>
        )

    if(currentShape === hitShapeTypes.INTEPATH && currentIntePathWay === intePathGenerateWay.SAMSEG)
        return (
            <div>
                <div>
                    <Radio.Group
                        value={SAMMode}
                        size="small"
                        style={{marginBottom:SAMMode==='point'?'10px':'0'}}
                        onChange={(e) =>{
                            dispatch({
                                type: 'UPDATE_SAMMODE',
                                payload: e.target.value,
                              })
                          }
                        }
                    >
                        <Radio.Button value={'point'} style={{width:'64px'}}>点</Radio.Button>
                        <Radio.Button value={'box'} style={{width:'67px'}}>矩形</Radio.Button>
                    </Radio.Group>
                </div>
                <div>
                    {SAMMode==='point' && (<Radio.Group
                        value={segPositive}
                        size="small"
                        onChange={() =>
                            dispatch({
                                type: 'UPDATE_SEGPOSITIVE',
                                payload: !segPositive,
                            })
                        }
                    >
                        <Radio.Button value={true}>positive</Radio.Button>
                        <Radio.Button value={false}>negative</Radio.Button>
                    </Radio.Group>)}
                </div>
            </div>
        )

    if ( currentShape === hitShapeTypes.MANUALCLOSE || currentShape === hitShapeTypes.MANUAL)
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Radio.Group
                    value={tempBrushMode}
                    size="small"
                    onChange={e => {
                        setTempBrushMode(e.target.value)
                        setBrushMode(e.target.value)
                        drawingFree(e.target.value)
                    }}
                >
                    <Radio.Button value="pencil">画笔</Radio.Button>
                    <Radio.Button value="eraser">擦除</Radio.Button>
                </Radio.Group>
                <Slider
                    style={{ marginLeft: '5px', width: '150px' }}
                    value={spotSize}
                    onChange={setSpotSize}
                    min={2}
                    max={15}
                />
            </div>
        )

    if (currentShape ===  hitShapeTypes.TRAPATH && currentTraPathWay === traPathGenerateWay.THRESHOLD)
        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    阈值：
                    <Slider
                        style={{ marginLeft: '5px', width: '150px' }}
                        value={threshold[0]}
                        onChange={value =>
                            dispatch({
                                type: 'UPDATE_THRESHOLD',
                                payload: [value, threshold[1]],
                            })
                        }
                        min={0}
                        max={255}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    最大值：
                    <Slider
                        style={{ marginLeft: '5px', width: '150px' }}
                        value={threshold[1]}
                        onChange={value =>
                            dispatch({
                                type: 'UPDATE_THRESHOLD',
                                payload: [threshold[0], value],
                            })
                        }
                        min={0}
                        max={255}
                    />
                </div>
            </>
        )
    if (currentShape ===  hitShapeTypes.TRAPATH && currentTraPathWay === traPathGenerateWay.CANNY)
        return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                阈值：
                <Slider
                    style={{ width: '150px' }}
                    min={0}
                    max={255}
                    range
                    defaultValue={cannyThreshold}
                    onChange={value =>
                        dispatch({
                            type: 'UPDATE_CANNYTHRESHOLD',
                            payload: value,
                        })
                    }
                />
            </div>
        )
}

export default TopRightWidget