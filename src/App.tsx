import classNames from 'classnames/bind'
import { useEffect, useState } from 'react'
import styles from './App.module.scss'
import FullScreenMessage from '@shared/FullScreenMessage'
import Video from '@components/sections/Video'
import Heading from '@components/sections/Heading'
import { Wedding } from '@models/wedding'
import ImageGallery from '@components/sections/ImageGallery.tsx'
import Intro from '@components/sections/Intro'
import Invitation from '@components/sections/Invitation'
import Calendar from '@components/sections/Calendar'
import Map from '@components/sections/Map'
import Contact from '@components/sections/Contact'
import Share from '@components/sections/Share'
import AttendCountModal from '@components/AttendCountModal'

const cx = classNames.bind(styles)

const DATA = {
  wedding: {
    id: 0,
    date: '2027-03-06T13:00:00',
    location: {
      lat: 37.28163212324522,
      lng: 127.0303329958705,
      name: '노블레스 웨딩컨벤션 7층 컨벤션홀',
      address:
        '경기도 수원시 팔달구 우만동 팔달문로 128\n수원 노블레스 웨딩컨벤션',
      link: 'https://map.kakao.com/?map_type=TYPE_MAP&target=car&rt=,,506715,1050669&rt1=&rt2=%EC%88%98%EC%9B%90%EB%85%B8%EB%B8%94%EB%A0%88%EC%8A%A4%EC%9B%A8%EB%94%A9%EC%BB%A8%EB%B2%A4%EC%85%98&rtIds=,9846217',
      waytocome: {
        metro: ['셔틀버스 운행 → 분당선 수원시청역 5번출구 수시운행'],
        bus: [
          '수원역(4번출구) → 동수원병원 하차10, 11-1, 37, 720-2, 83-1 (약 20분)',
          '수원종합버스터미널 → 수병원 하차300, 300-1, 82-1, 80, 88 (약 20분)',
          '서수원시외버스터미널 → 동수원병원 하차11-1, 37, 61, 62-1 (약 30분)',
          '망포역 (4번출구) → 동수원병원 하차62-1, 61 (약 30분)',
          '용인시(용인대입구삼거리) → 동수원병원 하차10, 10-5, 66 (약 1시간)',
          '범계역(범계사거리), 오산역(오산터미널맞은편) → 수병원 하차300 (약 50분)',
          '잠실역(4번출구) → 월드컵경기장 하차1007-1 (약 1시간 20분)',
          '사당역(4번출구) → 월드컵경기장 하차7000, 7001 (약 1시간)',
          '강남역(7번출구) → 월드컵경기장 하차3002, 3007, 3008 (약 1시간)',
        ],
      },
    },
    groom: {
      name: '영빈',
      account: {
        bankName: '신한',
        accountNumber: '110-356-123433',
        kakaopayLink: 'https://qr.kakaopay.com/FQq4BBJjC',
      },
      phoneNumber: '01027005745',
      parents: [
        {
          name: '빈아빠',
          account: {
            bankName: '우리',
            accountNumber: '1002-638-301529',
          },
          phoneNumber: '01027005745',
        },
        {
          name: '빈엄마',
          account: {
            bankName: '국민',
            accountNumber: '360102-04-171514',
          },
          phoneNumber: '01027005745',
        },
      ],
    },
    bride: {
      name: '가연',
      account: {
        bankName: '카카오뱅크',
        accountNumber: '3333-05-9949640',
      },
      phoneNumber: '01075932207',
      parents: [
        {
          name: '연아빠',
          account: {
            bankName: '카카오뱅크',
            accountNumber: '3333-05-9949640',
          },
          phoneNumber: '01075932207',
        },
        {
          name: '연엄마',
          account: {
            bankName: '국민',
            accountNumber: '360102-04-171514',
          },
          phoneNumber: '01075932207',
        },
      ],
    },
    message: {
      intro:
        '가장 진실된 것으로\n가장 당신을 위한 생각으로\n나의 마음을 가득 채워가고 싶다\n참 작은 마음이지만\n당신을 위한 것 중 가장 작은 것일지라도\n당신이 허락해준다면\n나 내 온 마음 그것이라 하겠다.\n\n이경선, <마음>',
      invitation:
        '소중한 분들을 초대합니다\n살랑이는 바람결에\n사랑이 묻어나는 계절입니다.\n여기 곱고 예쁜 두 사람이 사랑을 맺어\n인생의 반려자가 되려 합니다.\n새 인생을 시작하는 이 자리에 오셔서\n축복해 주시면 감사하겠습니다.',
    },
    galleryImages: [
      '/assets/images/yb_01',
      '/assets/images/yb_02',
      '/assets/images/yb_03',
      '/assets/images/yb_04',
      '/assets/images/yb_05',
      '/assets/images/yb_06',
      '/assets/images/yb_07',
      '/assets/images/yb_08',
      '/assets/images/yb_09',
      '/assets/images/yb_10',
      '/assets/images/yb_11',
      '/assets/images/yb_12',
    ],
    attendCount: 0,
  },
}

function App() {
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<boolean>(false)

  // 1. wedding 데이터 호출
  useEffect(() => {
    setLoading(true)

    fetch('http://localhost:8888/wedding')
      .then((res) => {
        // 404 케이스는 명시적으로 에러를 throw 해주어야 한다.
        if (res.ok === false) {
          throw new Error('청첩장 정보를 불러오지 못했습니다.')
        }

        return res.json()
      })
      .then((data) => {
        setWedding(data)
      })
      .catch((e) => {
        console.log('에러발생', e)
        // setError(true)
        setWedding(DATA.wedding)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <FullScreenMessage type="loading" />
  }

  if (error) {
    return <FullScreenMessage type="error" />
  }

  if (wedding == null) {
    return null
  }

  const {
    date,
    galleryImages,
    groom,
    bride,
    location,
    message: { intro, invitation },
  } = DATA.wedding

  return (
    <div className={cx('container')}>
      <Heading date={date} />
      <Video />
      <Intro
        groomName={groom.name}
        brideName={bride.name}
        locationName={location.name}
        date={date}
        message={intro}
      />
      <Invitation message={invitation} />
      <ImageGallery images={galleryImages} />
      <Calendar date={date} />
      <Map location={location} />
      <Contact groom={groom} bride={bride} />
      <Share groomName={groom.name} brideName={bride.name} date={date} />
      <AttendCountModal wedding={DATA.wedding} />
    </div>
  )
}

export default App
