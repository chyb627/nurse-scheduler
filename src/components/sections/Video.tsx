import classNames from 'classnames/bind'

import styles from './Video.module.scss'
import Section from '../shared/Section'

const cx = classNames.bind(styles)

function Video() {
  return (
    <Section className={cx('container')}>
      <video
        autoPlay // 자동재생
        loop // 영상이 끝나면 다시 실행
        muted // 음소거
        poster="/assets/poster.jpg" // 썸네일
        // controls // 컨트롤 바
      >
        <source src="/assets/main.webm" type="video/webm" />
        <source src="/assets/main.mp4" type="video/mp4" />
      </video>
    </Section>
  )
}

export default Video
