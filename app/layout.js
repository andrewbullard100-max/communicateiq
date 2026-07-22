import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'CommunicateIQ — Executive Communication Training Platform',
  description: 'AI-powered executive communication training for contract dining & hospitality leadership',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
