/*
 * @Author: Azhou
 * @Date: 2021-05-17 22:05:30
 * @LastEditors: Azhou
 * @LastEditTime: 2021-07-08 14:39:43
 */
import qs from 'qs'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

const useQuery = () => {
  const { search } = useLocation()
  return useMemo(() => {
    if (!search) return {}
    return qs.parse(search.replace(/^\?/, ''))
  }, [search])
}

export default useQuery
