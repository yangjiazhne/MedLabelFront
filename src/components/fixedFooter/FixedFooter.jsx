import React from 'react'
import styles from './index.module.scss'

const footerItems = [
    { name: 'Dataturks',linkUrl:'' },
    { name: 'Blog',linkUrl:'' },
    { name: 'Contact',linkUrl:'' },
    { name: 'Privacy Policy',linkUrl:'' },
]

const FixedFooter = () => {
    return (
        <div className={styles.footerWrap}>
            <a href="http://www.vipazoo.cn" target="_blank" rel="noopener noreferrer">
                contact@vipazoo.cn
            </a>
        </div>
    )
}

export default FixedFooter
