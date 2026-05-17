import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import AiGuideClient from './AiGuideClient'

export const metadata = {
  title: 'مرشد موكادور الذكي | Mogador Connect',
  description: 'اسأل مرشدنا الذكي عن الصويرة والحرفيين والتجارب السياحية',
}

export default function AiGuidePage() {
  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-ocean opacity-60" />
          </div>
        }
      >
        <AiGuideClient />
      </Suspense>
    </div>
  )
}
