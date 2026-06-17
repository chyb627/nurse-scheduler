import { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FullScreenMessage from '@components/shared/FullScreenMessage'
import { ReactProvider } from './providers'
import reportWebVitals from './reportWebVitals'
import './scss/global.scss'
import ErrorBoundary from '@components/shared/ErrorBoundary'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <ReactProvider>
    <ErrorBoundary fallbackUI={<FullScreenMessage type="error" />}>
      <Suspense fallback={<FullScreenMessage type="loading" />}>
        <App />
      </Suspense>
    </ErrorBoundary>
  </ReactProvider>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
