import { useEffect,useRef } from 'react';

//在依赖项发生变化并且组件已经完成初次挂载后才执行
const useDidUpdateEffect = (fn: any,inputs: any) => {
  const didMountRef = useRef(false);
  useEffect(() => {
    if (didMountRef.current) fn();
    else didMountRef.current = true;
  }, inputs);
};

export default useDidUpdateEffect