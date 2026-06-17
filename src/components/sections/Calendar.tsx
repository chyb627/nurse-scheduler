import { parseISO, format } from 'date-fns'
import classNames from 'classnames/bind'
import Section from '@shared/Section'
import { ko } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'

import 'react-day-picker/dist/style.css'
import styles from './Calendar.module.scss'
import { memo } from 'react'

const cx = classNames.bind(styles)

const css = `
    .rdp-nav {
        display: none;
    }
    .rdp-day {
        cursor: default;
    }
    .rdp-weekday {
        font-weight: 500;
        font-size: 14px;
        font-weight: bold;
    }
    .rdp-selected .rdp-day_button {
        border-color: var(--red);
        background-color: var(--red);
        font-weight: bold;
        color: #fff;
    }
    .rdp-selected .rdp-day_button:hover {
        background-color: var(--red);
    }
`

function Calendar({ date }: { date: string }) {
  const weddingDate = parseISO(date)

  return (
    <Section
      title={
        <div className={cx('wrap-header')}>
          <span className={cx('txt-date')}>
            {format(weddingDate, 'yyyy.MM.dd')}
          </span>
          <span className={cx('txt-time')}>
            {format(weddingDate, 'aaa h시 eeee', { locale: ko })}
          </span>
        </div>
      }
    >
      <div className={cx('wrap-calendar')}>
        <style>{css}</style>
        <DayPicker
          mode="single"
          locale={ko}
          month={weddingDate}
          selected={weddingDate}
          formatters={{ formatCaption: () => '' }} // 날짜를 빈문자열로 바꿔줌.
          onSelect={() => {}} // 선택해도 아무 일도 안 일어남
          // disabled={() => true} // 모든 날짜를 비활성화함
        />
      </div>
    </Section>
  )
}

export default memo(Calendar)
