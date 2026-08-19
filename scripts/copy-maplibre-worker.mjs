/**
 * MapLibre는 지도 타일을 파싱할 웹 워커를 `new Worker(url, { type: 'module' })`로
 * 띄운다. Turbopack은 이 워커를 번들 그래프에 넣지 못해 요청이 404로 떨어지고,
 * Next가 HTML 404 페이지를 돌려주면서 MIME 오류로 지도가 통째로 죽는다.
 *
 * 워커와 그 의존 모듈을 public/ 아래로 복사해 직접 서빙하고,
 * MapView에서 setWorkerUrl로 이 경로를 가리킨다.
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const dist = path.dirname(require.resolve('maplibre-gl/package.json')) + '/dist'
const out = path.resolve(import.meta.dirname, '../public/maplibre')

const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

await mkdir(out, { recursive: true })
for (const file of FILES) {
  await copyFile(path.join(dist, file), path.join(out, file))
}
console.log(`maplibre worker -> public/maplibre (${FILES.length} files)`)
