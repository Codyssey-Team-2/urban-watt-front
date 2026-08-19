import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    // 홈 디렉터리에 남아있는 package-lock.json 때문에 Turbopack이 프로젝트 루트를
    // 상위로 잘못 추론한다. 명시적으로 고정한다.
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
