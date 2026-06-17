import { getWedding } from '@/api/wedding'
import { useSuspenseQuery } from '@tanstack/react-query'

export default function useWedding() {
  const {
    data: wedding,
    isLoading,
    error,
  } = useSuspenseQuery({
    queryKey: ['wedding'],
    queryFn: async () => {
      const res = await getWedding()
      if (!res.ok) throw new Error('청첩장 정보를 불러오지 못했습니다.')
      return res.json()
    },
  })

  return {
    wedding,
    isLoading,
    error,
  }
}
