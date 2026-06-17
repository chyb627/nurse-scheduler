import React, { useState } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ModalContext } from './contexts/ModalContext'

interface Props {
  children?: React.ReactNode
}

export const ReactProvider = ({ children }: Props) => {
  const [client] = useState(
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retryOnMount: true,
          refetchOnReconnect: false,
          retry: false,
        },
      },
    }),
  )

  return (
    <QueryClientProvider client={client}>
      <ModalContext>
        {children}
        <ReactQueryDevtools
          initialIsOpen={process.env.NEXT_PUBLIC_MODE === 'local'}
        />
      </ModalContext>
    </QueryClientProvider>
  )
}
