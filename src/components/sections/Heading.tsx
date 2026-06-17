import classNames from 'classnames/bind'
import { format, parseISO, getDay } from 'date-fns'

import styles from './Heading.module.scss'
import Section from '@shared/Section'

const cx = classNames.bind(styles)

// 함수 밖에 사용하는 이유는 상수인데 리랜더링 될때마다 재실행이 되서 이 변수를 계속 만들기 때문
const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function Heading({ date }: { date: string }) {
  const weddingDate = parseISO(date) // Date 타입으로 변경

  const title = format(weddingDate, 'yy.MM.dd') // yy.MM.dd 형식으로 포맷
  const subTitle = DAYS[getDay(weddingDate)] // 요일

  return (
    <Section className={cx('container')}>
      <div className={cx('txt-date')}>{title}</div>
      <div className={cx('txt-day')}>{subTitle}</div>
    </Section>
  )
}

export default Heading
