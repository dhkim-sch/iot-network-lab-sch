# About 가족사진 콜라주 상세 구현 계획

> 상태: 계획 전용. 이 문서를 작성하는 단계에서는 홈페이지 코드, 사진 파생본, 배포본을 변경하지 않는다.

## 목표

기존 About 섹션의 교수 소개와 Lab profile 아래에 두 가족 여행 사진을 작은 엽서 콜라주로 추가한다. 사진은 공개하되 원본 파일과 EXIF 메타데이터는 배포하지 않으며, 현재 페이지의 데이터 기반 렌더링·절제된 모션·반응형 구조·접근성 원칙을 유지한다.

승인된 설계: `docs/superpowers/specs/2026-08-26-about-family-photo-collage-design.md`

현재 작업 브랜치: `agent/about-family-photo-collage-design`

## 변경 대상

- `.gitignore`: 두 원본 사진 경로를 정확히 제외
- `content.js`: `professor.personalMoments` 콘텐츠 데이터 추가
- `index.html`: About aside와 숨김 상태의 모듈 host 추가, 자산 캐시 버전 갱신
- `script.js`: 선택적 가족사진 모듈 renderer 추가
- `styles.css`: 최소 크기 엽서 콜라주, 반응형, 실패 상태, 모션 감소 스타일 추가
- `assets/motion.js`: 개인 문구와 postcard slot을 기존 reveal 대상에 등록
- `assets/beyond-lab-tokyo.webp`: Tokyo 원본의 최적화·메타데이터 제거 파생본
- `assets/beyond-lab-dubai.webp`: Dubai 원본의 최적화·메타데이터 제거 파생본
- `docs/superpowers/plans/2026-08-26-about-family-photo-collage-plan.md`: 본 계획

변경하지 않을 파일:

- `.github/workflows/pages.yml`
- `assets/lab-hero.png`
- publication, research, member, announcement 데이터
- Members 교수 카드와 페이지 navigation 구조
- 시각 비교 기록이 있는 `.superpowers/`

커밋하거나 배포하지 않을 원본:

- `assets/daughter.png`
- `assets/son.jpg`

## 구현 원칙

- 원본은 로컬 입력으로만 사용하고 Git 및 GitHub Pages artifact에 포함하지 않는다.
- 이미지 내용은 생성·합성·보정하지 않는다. 승인된 구도를 유지한 채 중앙 3:4 crop, resize, WebP 압축, 메타데이터 제거만 수행한다.
- About의 교수 소개와 Lab profile이 사진보다 먼저 읽혀야 한다.
- 콘텐츠 데이터가 없거나 renderer가 실패하면 기존 About 레이아웃으로 복구한다.
- 캡션은 항상 보이며 hover에 정보를 의존하지 않는다.
- 기존 공통 reveal이 postcard 회전을 덮지 않도록 움직이는 slot과 회전하는 figure를 분리한다.
- 모바일 `320px`까지 가로 넘침을 허용하지 않는다.
- 외부 라이브러리, CDN, lightbox, carousel, modal을 추가하지 않는다.
- 이 계획 실행만으로 push 또는 배포하지 않는다. 배포는 별도 요청에서 진행한다.

## 작업 1: 구현 전 기준선과 도구 확인

대상 파일: 없음

1. 현재 브랜치가 `agent/about-family-photo-collage-design`이고 설계 커밋을 포함하는지 확인한다.
2. 작업 트리에서 `.superpowers/`, `assets/daughter.png`, `assets/son.jpg` 외에 예상하지 못한 변경이 없는지 확인한다.
3. 원본 사진이 Git에 추적되지 않는지 확인한다.
4. JavaScript 세 파일의 문법 검사를 실행한다.
5. `content.js`에서 현재 통계를 계산해 journals `51`, conferences `11`, patents `35`, research `4`, publication total `97`을 기록한다.
6. 이미지 파이프라인 도구를 확인한다.
   - `/opt/homebrew/bin/ffmpeg`
   - `/opt/homebrew/bin/cwebp`
   - `/opt/homebrew/bin/webpmux`
   - `/usr/bin/sips`
7. 로컬 기준 화면에서 About 섹션 높이, 가로 overflow, 콘솔 오류 유무를 기록한다.

검증 명령:

```bash
git status --short --branch
git ls-files --error-unmatch assets/daughter.png
git ls-files --error-unmatch assets/son.jpg
node --check content.js
node --check script.js
node --check assets/motion.js
node -e 'global.window={}; require("./content.js"); const d=window.LAB_DATA; const p=d.publications; console.log({journals:p.journals.length, conferences:p.conferences.length, patents:p.patents.length, research:d.researchAreas.length, total:p.journals.length+p.conferences.length+p.patents.length});'
```

두 `git ls-files --error-unmatch` 명령은 실패해야 정상이다.

완료 조건:

- 기준 통계와 기존 About 상태를 재현할 수 있다.
- 원본 두 파일이 미추적 상태임을 확인했다.
- 필요한 로컬 이미지 도구가 모두 실행 가능하다.

## 작업 2: 원본 보호와 production 이미지 생성

대상 파일: `.gitignore`, `assets/beyond-lab-tokyo.webp`, `assets/beyond-lab-dubai.webp`

### 2.1 원본 보호

1. `.gitignore`에 다음 두 경로를 정확히 추가한다.

```gitignore
/assets/daughter.png
/assets/son.jpg
```

2. 광범위한 `assets/*.png` 또는 `assets/*.jpg` 규칙은 추가하지 않는다.
3. ignore 적용 후에도 파일이 로컬 디스크에 존재하는지 확인한다.

### 2.2 안전한 임시 작업 디렉터리

1. `mktemp -d`로 전용 임시 디렉터리를 만든다.
2. `$HOME`, `~`, workspace root 또는 광범위한 glob을 임시 출력·정리 대상으로 사용하지 않는다.
3. 변환 성공과 출력 경로 확인 후에만 검증된 임시 디렉터리를 정리한다.

### 2.3 3:4 crop과 WebP 변환

Tokyo와 Dubai 모두 다음 파이프라인을 사용한다.

1. `ffmpeg`로 원본 비율을 유지하며 `480 × 640`을 채우도록 확대·축소한다.
2. 중앙에서 정확히 `480 × 640`으로 crop한다.
3. `-map_metadata -1`로 입력 메타데이터를 전달하지 않는다.
4. 임시 PNG를 `cwebp -q 82 -m 6 -metadata none`으로 변환한다.
5. 결과가 `150KB`를 넘으면 품질을 `80`, `78`, `76`, `74` 순서로만 낮추며 매번 육안 검토한다.
6. 품질 `74`에서도 예산을 넘으면 이미지를 더 작게 만들지 말고 원인을 검토한다.

명령 형태:

```bash
photo_work_dir="$(mktemp -d)"
ffmpeg -y -i assets/daughter.png -vf "scale=480:640:force_original_aspect_ratio=increase,crop=480:640" -map_metadata -1 -frames:v 1 "$photo_work_dir/tokyo.png"
cwebp -q 82 -m 6 -metadata none "$photo_work_dir/tokyo.png" -o assets/beyond-lab-tokyo.webp
ffmpeg -y -i assets/son.jpg -vf "scale=480:640:force_original_aspect_ratio=increase,crop=480:640" -map_metadata -1 -frames:v 1 "$photo_work_dir/dubai.png"
cwebp -q 82 -m 6 -metadata none "$photo_work_dir/dubai.png" -o assets/beyond-lab-dubai.webp
```

### 2.4 파생본 검증

1. `sips`로 두 파일이 각각 `480 × 640`, WebP인지 확인한다.
2. `webpmux -info`에 EXIF, XMP, ICC profile이 없음을 확인한다.
3. 각 파일이 `150KB` 이하, 합계가 `300KB` 이하인지 확인한다.
4. 두 파생본을 직접 열어 다음을 확인한다.
   - Tokyo: Skytree 상단과 두 인물이 모두 남아 있다.
   - Dubai: Burj Khalifa 상단과 두 인물이 모두 남아 있다.
   - 야간 하늘의 banding과 얼굴·의복의 압축 손상이 허용 범위다.
5. 원본 파일 hash나 timestamp를 변경하지 않았는지 확인한다.

검증 명령:

```bash
sips -g pixelWidth -g pixelHeight -g format assets/beyond-lab-tokyo.webp assets/beyond-lab-dubai.webp
webpmux -info assets/beyond-lab-tokyo.webp
webpmux -info assets/beyond-lab-dubai.webp
wc -c assets/beyond-lab-tokyo.webp assets/beyond-lab-dubai.webp
git check-ignore -v assets/daughter.png assets/son.jpg
```

완료 조건:

- 배포 대상은 metadata-free `480 × 640` WebP 두 개뿐이다.
- 두 원본은 로컬에 남아 있으나 Git status에서 제외된다.
- 총 신규 이미지 전송량이 `300KB` 이하이다.

## 작업 3: 콘텐츠 데이터와 semantic host 추가

대상 파일: `content.js`, `index.html`

### 3.1 콘텐츠 데이터

`window.LAB_DATA.professor` 아래에 다음 구조의 `personalMoments`를 추가한다.

```js
personalMoments: {
  eyebrow: "Beyond the Lab",
  heading: "Family journeys keep curiosity close.",
  supportingText: "A personal glimpse beyond research.",
  moments: [
    {
      key: "tokyo",
      src: "assets/beyond-lab-tokyo.webp",
      alt: "Professor Daehee Kim and his daughter viewed from behind beside the illuminated Tokyo Skytree at night.",
      caption: "With my daughter in Tokyo",
    },
    {
      key: "dubai",
      src: "assets/beyond-lab-dubai.webp",
      alt: "Professor Daehee Kim standing with his son in front of the Burj Khalifa in Dubai.",
      caption: "With my son in Dubai",
    },
  ],
},
```

배열 순서는 Tokyo, Dubai로 고정한다.

### 3.2 About markup

1. 기존 `.lab-profile`을 새 `.about-aside` 안으로 이동한다.
2. `.lab-profile` 바로 뒤에 다음 semantic host를 추가한다.
   - `section.personal-journeys`
   - `aria-labelledby="personal-journeys-title"`
   - 초기 `hidden`
   - 내부 렌더 대상 `#personal-journeys-content`
3. 정적 host 이외의 실제 문구·figure는 `script.js`가 데이터로 생성한다.
4. About의 기존 제목, biography ID, profile list ID를 변경하지 않는다.

완료 조건:

- 데이터만 읽어도 승인 문구, 순서, alt, 이미지 경로를 확인할 수 있다.
- JavaScript가 중단되면 비어 있는 personal module은 `hidden` 상태로 남는다.
- 기존 Lab profile DOM과 ID가 보존된다.

예정 커밋 단위:

```text
Add optimized Beyond the Lab photo content
```

## 작업 4: 격리된 personal moments renderer 구현

대상 파일: `script.js`

1. `renderPersonalMoments()`를 `renderProfile()`과 분리해 추가한다.
2. renderer는 다음 순서로 방어적으로 처리한다.
   - host와 content target 존재 확인
   - `data.professor.personalMoments`가 객체인지 확인
   - eyebrow, heading, supporting text가 non-empty string인지 확인
   - `moments`가 배열인지 확인
   - `key`, `src`, `alt`, `caption`이 모두 유효한 항목만 필터링
   - `key`는 `tokyo` 또는 `dubai`만 허용
3. 유효 항목이 0개면 host 내용을 비우고 `hidden`을 유지한다.
4. 실제 DOM은 `DocumentFragment`에서 완성한 뒤 한 번에 붙인다.
5. copy 영역과 image 영역을 분리한다.
   - `.personal-journeys-copy`
   - `.personal-postcard-stack`
6. 각 사진은 다음처럼 slot과 figure를 분리한다.
   - `.personal-postcard-slot.personal-postcard-slot-{key}`: reveal transform 담당
   - `figure.personal-postcard.personal-postcard-{key}`: 기본 회전과 hover transform 담당
   - `img`, `figcaption`
7. `<img>`에 `width=480`, `height=640`, `loading="lazy"`, `decoding="async"`를 지정한다.
8. image `error` listener는 figure에 `.is-image-missing`을 추가한다.
   - image는 DOM과 accessibility tree에 유지한다.
   - CSS fallback이 `Photo unavailable`을 표시한다.
   - caption과 card 크기는 유지한다.
9. 항목이 하나면 host에 `.has-single-moment`를 추가한다.
10. 렌더가 성공한 뒤에만 host의 `hidden`을 해제한다.
11. renderer 내부 예외는 catch하여 host를 초기화하고 숨긴다. 다른 renderer로 예외를 전파하지 않는다.
12. 모든 데이터 renderer가 끝난 뒤, motion 초기화 전에 `renderPersonalMoments()`를 호출한다.

동적 검증 시나리오:

1. 정상 데이터: 카드 2개, caption 2개, alt 2개.
2. `moments=[]`: module hidden.
3. Dubai 항목만 유효: `.has-single-moment`, 카드 1개.
4. 잘못된 key 또는 빈 alt: 해당 항목만 제외.
5. image error 강제: 크기·fallback·caption 유지.

완료 조건:

- optional module 실패가 stats, publications, members, navigation 렌더링에 영향을 주지 않는다.
- DOM 순서가 Tokyo, Dubai다.
- 콘텐츠 정보가 hover나 motion에 의존하지 않는다.

## 작업 5: 최소 크기 콜라주와 반응형 CSS 구현

대상 파일: `styles.css`

### 5.1 Desktop `>1080px`

1. `.about-aside`를 세로 grid로 만들고 Lab profile을 항상 첫 번째로 둔다.
2. `.personal-journeys`는 현재 About 배경과 조화를 이루는 투명한 보조 블록으로 처리한다.
3. 카드 목표 크기:
   - width 최대 `132px`
   - height 최대 `176px`
   - aspect ratio `3 / 4`
4. postcard stack은 가운데 정렬하고 전체 높이를 약 `200px` 이하로 제한한다.
5. Tokyo는 `--postcard-rotation: -2deg`, Dubai는 `2deg`를 사용한다.
6. Tokyo는 약간 아래, Dubai는 약간 위에 배치한다.
7. caption은 항상 보이는 어두운 반투명 surface로 만들고 최소 `0.72rem` 글자 크기를 사용한다.

### 5.2 Tablet `1080px–621px`

1. 기존 `.about-grid` 한 열 전환을 유지한다.
2. `.about-aside`만 두 개의 같은 폭 column으로 바꾼다.
3. Lab profile과 personal module 상단을 맞추되 DOM 순서는 유지한다.
4. `820px` journey·scene 모바일 규칙과 충돌하지 않는지 확인한다.

### 5.3 Mobile `<=620px`

1. `.about-aside`를 한 열로 되돌린다.
2. `.personal-journeys` 내부는 copy와 `166px` stack의 두 column을 사용한다.
3. 각 카드의 실제 표시 크기를 `92 × 123px`로 줄인다.
4. 추가 모듈 높이를 약 `140px`로 제한한다.
5. `<=340px`에서는 copy와 stack을 한 열로 전환하고 stack을 중앙 정렬한다.

### 5.4 Missing image와 단일 카드

1. `.is-image-missing`은 기존 카드 크기와 caption을 유지한다.
2. 카드 배경에 `Photo unavailable` 텍스트를 표시한다.
3. `.has-single-moment`에서는 slot 하나를 stack 중앙에 둔다.

### 5.5 기본 transform 분리

1. reveal 이동은 `.personal-postcard-slot`에만 적용한다.
2. postcard 회전은 내부 `.personal-postcard`에만 적용한다.
3. hover 시 figure transform은 `translateY(-2px) rotate(var(--postcard-rotation))`로 합성한다.
4. slot reveal 종료·cleanup 후에도 figure 회전은 유지되어야 한다.

완료 조건:

- desktop 사진이 교수 소개나 Lab profile보다 시각적으로 크지 않다.
- `320px`, `360px`, `390px`에서 가로 overflow가 없다.
- caption이 밝고 어두운 사진 영역 모두에서 읽힌다.
- hover와 reveal이 base rotation을 제거하지 않는다.

## 작업 6: 기존 reveal과 reduced-motion 통합

대상 파일: `assets/motion.js`, `styles.css`

1. `collectMotionTargets()`에 다음 순서로 대상을 추가한다.
   - `.personal-journeys-copy`: `0ms`
   - Tokyo `.personal-postcard-slot`: `80ms`
   - Dubai `.personal-postcard-slot`: `160ms`
2. 카드 figure 자체는 공통 `.motion-reveal` 대상으로 등록하지 않는다.
3. 기존 `IntersectionObserver`와 cleanup 로직을 재사용한다.
4. reveal 초기 이동은 공통 `--motion-distance`를 사용하되 승인 한도 `12px`를 넘지 않는다.
5. `@media (hover: hover) and (pointer: fine)`에서만 `2px` hover lift를 활성화한다.
6. `@media (prefers-reduced-motion: reduce)`에서 다음을 강제한다.
   - personal reveal opacity와 transform 최종 상태
   - postcard transition 제거
   - hover lift 제거
   - base ±2deg 회전은 정적 장식으로 유지
7. motion controller가 생성되지 않거나 `assets/motion.js`가 차단돼도 콘텐츠는 기본 상태에서 보여야 한다.

완료 조건:

- copy → Tokyo → Dubai 순으로 한 번만 진입한다.
- Reduce Motion에서 진입·hover 이동이 없다.
- motion cleanup 이후 base postcard 회전과 caption이 유지된다.
- 기존 scene controller와 journey node 계산이 정상이다.

예정 커밋 단위:

```text
Style and animate the About family photo collage
```

## 작업 7: 캐시 버전과 정적 회귀 검사

대상 파일: `index.html`, 변경된 JavaScript·CSS·이미지

1. `index.html`의 다음 query version을 `20260826a`로 갱신한다.
   - `styles.css`
   - `content.js`
   - `script.js`
   - `assets/motion.js`
2. JavaScript 문법과 whitespace를 검사한다.
3. publication 및 기존 professor 데이터가 의도치 않게 바뀌지 않았는지 diff를 확인한다.
4. 통계가 `51`, `11`, `35`, `4`, total `97`인지 다시 계산한다.
5. original images가 tracked 또는 staged 상태가 아닌지 확인한다.
6. 새 WebP 두 개만 이미지 변경으로 포함됐는지 확인한다.
7. 외부 URL, 라이브러리, CDN이 추가되지 않았는지 검색한다.

검증 명령:

```bash
node --check content.js
node --check script.js
node --check assets/motion.js
git diff --check
git diff --stat
git diff --name-only
git status --short --branch
git ls-files assets/daughter.png assets/son.jpg
git diff -- content.js index.html script.js styles.css assets/motion.js .gitignore
```

완료 조건:

- 모든 정적 검사가 통과한다.
- cache query가 변경된 네 자산과 일치한다.
- 원본 사진과 `.superpowers/`가 diff, staging, commit에 없다.

## 작업 8: 로컬 브라우저 기능·시각 검증

대상 파일: 없음

1. 정적 서버를 `127.0.0.1`의 사용 가능한 포트에서 실행한다.
2. 브라우저 자동화로 페이지를 열고 network idle까지 기다린다.
3. 다음 viewport를 확인한다.
   - `1440px`
   - `1080px`
   - `820px`
   - `620px`
   - `390px`
   - `320px`
4. 각 viewport에서 다음을 확인한다.
   - About content order
   - Lab profile 우선순위
   - photo card 실제 bounding box
   - caption 가독성
   - landmark와 인물 crop
   - `document.documentElement.scrollWidth === window.innerWidth`
   - scene geometry와 active navigation
5. 정상 motion에서 copy, Tokyo, Dubai reveal 순서와 1회 실행을 확인한다.
6. hover-capable desktop에서 최대 `2px` lift와 base 회전 유지를 확인한다.
7. Reduce Motion emulation에서 reveal과 hover movement가 없고 콘텐츠가 즉시 보이는지 확인한다.
8. browser runtime에서 image `src`를 존재하지 않는 경로로 바꾸고 error를 발생시켜 fallback·caption·크기 유지를 확인한다.
9. runtime에서 personal data를 빈 배열·단일 항목으로 바꾸고 renderer를 다시 호출해 hidden·single 상태를 확인한 뒤 정상 데이터로 복원한다.
10. publication 필터와 검색, 모바일 메뉴, 이메일·전화 링크를 회귀 검사한다.
11. 통계가 `51`, `11`, `35`, `4`이고 publication item이 `97`개인지 확인한다.
12. console error와 page error가 0인지 확인한다.
13. desktop과 mobile 대표 스크린샷을 직접 확인한다.

완료 조건:

- 모든 기준 viewport, 실패 상태, Reduce Motion 검증을 통과한다.
- 사진 추가로 기존 데이터·navigation·publication 동작이 변하지 않는다.
- 신규 이미지 전송량과 layout shift가 승인 예산 안에 있다.

## 작업 9: 구현 커밋과 인계

대상 파일: 구현 변경 전체

1. 최종 diff를 파일별로 검토한다.
2. 다음 경로만 명시적으로 stage한다.
   - `.gitignore`
   - `content.js`
   - `index.html`
   - `script.js`
   - `styles.css`
   - `assets/motion.js`
   - `assets/beyond-lab-tokyo.webp`
   - `assets/beyond-lab-dubai.webp`
3. `git add .`와 `git add -A`를 사용하지 않는다.
4. staged diff에서 원본 사진, `.superpowers/`, 다른 사용자 파일이 없음을 다시 확인한다.
5. 모든 검증을 통과한 구현을 다음 메시지로 커밋한다.

```text
Add About family photo collage
```

6. commit 후 원본 사진은 로컬에 존재하지만 `.gitignore` 때문에 status에 나타나지 않고, 남은 미추적 항목은 `.superpowers/`뿐인지 확인한다.
7. commit hash, 변경 파일, 이미지 크기, 검증 결과를 사용자에게 보고한다.
8. push, merge, GitHub Pages 배포는 수행하지 않는다. 별도 요청을 기다린다.

## 최종 인수 기준

- About 오른쪽 Lab profile 아래에 승인된 최소 크기 가족사진 콜라주가 표시된다.
- 문구는 `Beyond the Lab`, `Family journeys keep curiosity close.`, 승인된 두 caption을 정확히 사용한다.
- desktop 카드는 최대 `132 × 176px`, mobile 카드는 `92 × 123px`이다.
- 원본은 Git과 Pages artifact에 없고, 배포 대상 WebP는 각각 `480 × 640`, `150KB` 이하이며 메타데이터가 없다.
- 캡션과 alt가 항상 존재하며 broken image fallback이 레이아웃을 유지한다.
- copy, Tokyo, Dubai가 `0/80/160ms` 순서로 한 번만 reveal된다.
- hover lift는 정밀 포인터에서만 최대 `2px`이고 Reduce Motion에서는 제거된다.
- `320px`부터 desktop까지 가로 overflow가 없다.
- 기존 scene, journey, navigation, publication 검색·필터, 통계가 정상이다.
- journals `51`, conferences `11`, patents `35`, research `4`, publication total `97`을 유지한다.
- implementation commit에는 승인된 production 파일만 포함되고 push·배포는 하지 않는다.
