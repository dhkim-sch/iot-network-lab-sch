# About 가족사진 제목 우측 재배치 구현 계획

## 목표

승인된 설계에 따라 About의 가족사진 두 장을 Lab profile 아래에서 `About / Introduction` 제목 행 우측으로 옮긴다. 보이는 개인 문구와 사진 캡션을 모두 제거하고, 사진과 `alt`만 유지한다. 이미지 파일은 수정하지 않으며 기존 반응형·모션·홈페이지 기능을 회귀 검증한다.

승인 설계:

`docs/superpowers/specs/2026-08-27-about-family-photo-heading-placement-design.md`

현재 작업 브랜치:

`agent/reposition-about-family-photos`

## 변경 대상

- `content.js`: 개인 문구와 caption 데이터 제거
- `index.html`: 사진 host를 About 제목 행으로 이동, cache query 갱신
- `script.js`: 사진 전용 renderer와 무문구 실패 처리
- `styles.css`: 제목 우측/모바일 이름 위 배치, 불필요한 copy·caption 스타일 제거
- `assets/motion.js`: 사진 reveal을 `0/80ms`로 조정

변경하지 않을 항목:

- `assets/beyond-lab-tokyo.webp`
- `assets/beyond-lab-dubai.webp`
- `assets/daughter.png`
- `assets/son.jpg`
- publication, patent, research, member, announcement 데이터
- `.github/workflows/pages.yml`
- `.superpowers/`

이 계획 실행만으로 push 또는 배포하지 않는다.

## 작업 1: 구현 전 기준선 기록

대상 파일: 없음

1. 작업 브랜치와 dirty state를 확인한다.
2. 예상된 미추적 항목이 `.superpowers/`뿐인지 확인한다.
3. JavaScript 문법 검사를 실행한다.
4. 통계를 다시 계산한다.
   - journals `51`
   - conferences `11`
   - patents `35`
   - research `4`
   - publication total `97`
5. 네 사진 파일 hash를 기록한다.
   - Tokyo WebP: `3cec4b892dfa168292e1210c3b8320c388a96c09006e094c42ee10e28c033729`
   - Dubai WebP: `a22c8920a466ef012e97f47f7f1f4092d4af1dca32d2a5ddae86806fe8f1982e`
   - daughter 원본: `57f8892e9c881a88249ff702856538d4b27f96e970230a09915fc2ae3b542096`
   - son 원본: `2a143cd309f4566cdc4fb5a05296469f576edb16b0d74a56f52ee88c1e9fae94`
6. 현재 브라우저에서 About section 높이, 사진 host와 Lab profile의 DOM 순서, caption 존재, 가로 overflow를 기록한다.

검증 명령:

```bash
git status --short --branch
node --check content.js
node --check script.js
node --check assets/motion.js
node -e 'global.window={}; require("./content.js"); const d=window.LAB_DATA; const p=d.publications; console.log({journals:p.journals.length, conferences:p.conferences.length, patents:p.patents.length, research:d.researchAreas.length, total:p.journals.length+p.conferences.length+p.patents.length});'
shasum -a 256 assets/beyond-lab-tokyo.webp assets/beyond-lab-dubai.webp assets/daughter.png assets/son.jpg
```

완료 조건:

- 기존 DOM·크기·통계·hash를 구현 후 비교할 수 있다.
- 구현과 무관한 사용자 변경이 없다.

## 작업 2: 데이터 단순화와 semantic host 이동

대상 파일: `content.js`, `index.html`

### 2.1 콘텐츠 데이터

`professor.personalMoments`에서 다음 필드를 제거한다.

- `eyebrow`
- `heading`
- `supportingText`
- 각 moment의 `caption`

다음 데이터만 유지한다.

```js
personalMoments: {
  moments: [
    {
      key: "tokyo",
      src: "assets/beyond-lab-tokyo.webp",
      alt: "Professor Daehee Kim and his daughter viewed from behind beside the illuminated Tokyo Skytree at night.",
    },
    {
      key: "dubai",
      src: "assets/beyond-lab-dubai.webp",
      alt: "Professor Daehee Kim standing with his son in front of the Burj Khalifa in Dubai.",
    },
  ],
},
```

### 2.2 About markup

1. 기존 `.section-heading`에 `.about-heading`을 추가한다.
2. kicker와 `Introduction`을 `.about-heading-copy`로 묶는다.
3. `.personal-journeys` host를 `.about-heading-copy` 다음에 둔다.
4. host는 초기 `hidden` 상태의 일반 `div`로 사용한다.
5. `.about-aside`에서는 personal host를 제거하고 Lab profile만 남긴다.
6. 기존 `#professor-name`, `#professor-bio`, `#lab-profile-list`를 보존한다.
7. `styles.css`, `content.js`, `script.js`, `assets/motion.js` query를 `20260827a`로 갱신한다.

완료 조건:

- JavaScript가 실패하면 비어 있는 사진 host는 숨겨진다.
- DOM에서 personal host가 About grid와 이름보다 먼저 나온다.
- Lab profile 내용과 ID가 바뀌지 않는다.

## 작업 3: 사진 전용 renderer 구현

대상 파일: `script.js`

1. `renderPersonalMoments()`의 reset 동작을 유지한다.
2. `personalMoments.moments`가 배열인지 확인한다.
3. 각 항목에서 다음만 검증한다.
   - `key`가 `tokyo` 또는 `dubai`
   - non-empty `src`
   - non-empty `alt`
4. Tokyo, Dubai 순으로 정렬한다.
5. copy DOM과 `figcaption`을 생성하지 않는다.
6. 각 slot에는 `figure.personal-postcard`와 `img`만 생성한다.
7. 이미지의 `width=480`, `height=640`, `loading="lazy"`, `decoding="async"`를 유지한다.
8. 내부 `syncMomentState()`를 두어 현재 slot 수에 따라 상태를 갱신한다.
   - 2개: 정상 표시
   - 1개: `.has-single-moment`
   - 0개: host hidden
9. image error 시 해당 slot을 제거하고 `syncMomentState()`를 호출한다.
10. 보이는 fallback 문구와 `.is-image-missing` 상태는 사용하지 않는다.
11. renderer 예외는 host를 초기화하고 숨기며 다른 renderer에 전파하지 않는다.

동적 검증 시나리오:

- 정상 데이터: img 2개, figcaption 0개
- 빈 배열: host hidden
- Dubai만 유효: 카드 1개, 중앙 정렬
- 잘못된 key 또는 빈 alt: 해당 항목 제외
- 이미지 하나 오류: 실패 slot 제거, 나머지 중앙 정렬
- 이미지 둘 모두 오류: host hidden

완료 조건:

- 화면과 DOM에 승인 제거 문구가 없다.
- 두 이미지의 alt와 순서가 유지된다.
- optional renderer 실패가 기존 페이지 렌더링에 영향을 주지 않는다.

## 작업 4: 제목 행 배치와 CSS 정리

대상 파일: `styles.css`

### 4.1 Desktop/tablet `>620px`

1. `.about-heading`을 full-width grid로 만든다.
   - `max-width: none`
   - `grid-template-columns: minmax(0, 1fr) 230px`
   - 우측 사진 영역과 제목 상단 정렬
2. `.personal-journeys`를 우측 끝에 배치한다.
3. stack의 기존 `230 × 194px` 공간과 postcard `132 × 176px`을 유지한다.
4. stack margin을 제거해 제목 행 내부에서 불필요한 추가 간격이 생기지 않게 한다.
5. `.about-grid`의 기존 breakpoint는 유지한다.

### 4.2 Mobile `<=620px`

1. `.about-heading`을 한 열로 전환한다.
2. 사진 host를 제목 아래 중앙에 배치한다.
3. stack `166 × 140px`, postcard `92 × 123px`을 유지한다.
4. 사진 stack 아래의 margin과 `.section-heading` 간격을 조정해 이름과 겹치지 않게 한다.
5. `<=340px` 전용 copy grid 규칙은 제거한다.

### 4.3 불필요한 규칙 제거

- `.personal-journeys-copy` 관련 규칙
- `.personal-journeys-supporting`
- `#personal-journeys-content`의 copy/image grid 규칙
- `figcaption` 규칙
- text fallback pseudo-element와 `.is-image-missing` 규칙
- max-width `1080px`의 `.about-aside` 2열 규칙
- max-width `620px`의 `.about-aside` 재설정 규칙

### 4.4 유지할 규칙

- postcard border, shadow, 회전
- slot과 figure transform 분리
- single moment 중앙 정렬
- 정밀 포인터 2px hover
- Reduce Motion 정적 회전

완료 조건:

- desktop/tablet에서 사진이 제목 우측에 있고 이름보다 위에 있다.
- mobile에서 사진이 제목 아래, 이름 위에 있다.
- Lab profile 아래에 사진 또는 빈 host가 없다.
- `320px`에서 가로 overflow가 없다.

## 작업 5: reveal 순서 조정

대상 파일: `assets/motion.js`, `styles.css`

1. `.personal-journeys-copy` reveal 대상 등록을 제거한다.
2. postcard slot delay를 `index * 80`으로 바꾼다.
   - Tokyo `0ms`
   - Dubai `80ms`
3. 기존 IntersectionObserver와 cleanup 로직을 재사용한다.
4. single moment의 `translateX(-50%)`와 reveal 이동 합성을 보존한다.
5. Reduce Motion에서는 slot opacity/transform과 postcard transition이 즉시 최종 상태가 되게 한다.

완료 조건:

- Tokyo → Dubai 순으로 한 번만 등장한다.
- cleanup 후 base rotation이 유지된다.
- Reduce Motion에서 reveal과 hover 이동이 없다.

## 작업 6: 정적 회귀 검사

대상 파일: 변경된 production 파일

1. JavaScript 문법과 whitespace를 검사한다.
2. 변경 파일이 승인된 다섯 production 파일뿐인지 확인한다.
3. 네 이미지 hash가 기준선과 같은지 확인한다.
4. 원본 사진과 `.superpowers/`가 diff 또는 staging에 없는지 확인한다.
5. 통계가 `51`, `11`, `35`, `4`, total `97`인지 다시 계산한다.
6. 제거 대상 문구가 production 코드에 남지 않았는지 검색한다.
7. 새 외부 URL, 라이브러리 또는 CDN이 없는지 확인한다.

검증 명령:

```bash
node --check content.js
node --check script.js
node --check assets/motion.js
git diff --check
git diff --stat
git diff --name-only
shasum -a 256 assets/beyond-lab-tokyo.webp assets/beyond-lab-dubai.webp assets/daughter.png assets/son.jpg
rg -n "Beyond the Lab|Family journeys keep curiosity close|A personal glimpse beyond research|With my daughter in Tokyo|With my son in Dubai" content.js index.html script.js styles.css assets/motion.js
```

마지막 `rg` 명령은 결과가 없어야 정상이다.

## 작업 7: 로컬 브라우저 검증

대상 파일: 없음

1. 정적 서버를 실행하고 network idle까지 기다린다.
2. 다음 viewport를 검사한다.
   - `1440 × 1000`
   - `1080 × 900`
   - `820 × 900`
   - `620 × 900`
   - `390 × 844`
   - `360 × 800`
   - `320 × 780`
3. 각 viewport에서 다음을 확인한다.
   - `scrollWidth === innerWidth`
   - 사진 host가 Lab profile보다 DOM에서 앞선다.
   - `>620px`: 사진이 About 제목 우측, 이름 위
   - `<=620px`: 사진이 제목 아래, 이름 위
   - desktop/tablet 카드 `132 × 176px`
   - mobile 카드 `92 × 123px`
   - img 2개, figcaption 0개
   - 승인 제거 문구가 보이지 않음
4. 접근성 snapshot에서 두 alt만 확인하고 별도 caption이 없는지 확인한다.
5. motion 진입 시 `0/80ms`, cleanup 후 회전, desktop hover `2px`를 확인한다.
6. Reduce Motion에서 이동이 없는지 확인한다.
7. runtime에서 빈 배열, 단일 항목, 이미지 하나/둘 오류를 확인하고 정상 데이터로 복원한다.
8. publication filter/search, 모바일 메뉴, email/phone 링크를 확인한다.
9. 통계와 publication 97개를 확인한다.
10. accessibility audit, console error, page error를 확인한다.
11. desktop과 mobile 스크린샷을 직접 검토한다.

완료 조건:

- 모든 breakpoint, 오류 상태, motion 설정을 통과한다.
- 기존 홈페이지 데이터와 동작에 회귀가 없다.

## 작업 8: 구현 커밋과 인계

1. 최종 diff를 파일별로 검토한다.
2. 다음 경로만 명시적으로 stage한다.
   - `content.js`
   - `index.html`
   - `script.js`
   - `styles.css`
   - `assets/motion.js`
3. `git add .`와 `git add -A`를 사용하지 않는다.
4. staged diff에 이미지, 원본, `.superpowers/`, 문서 외 사용자 파일이 없는지 확인한다.
5. 다음 메시지로 커밋한다.

```text
Reposition About family photos
```

6. commit hash, 변경 파일, 검증 결과를 사용자에게 보고한다.
7. push, merge, GitHub Pages 배포는 별도 요청 전까지 수행하지 않는다.

## 최종 인수 기준

- 가족사진은 About 제목 우측에 있고 Lab profile 아래에는 없다.
- mobile에서는 제목 아래, 이름 위에 있다.
- 사진과 주변에 보이는 개인 문구 또는 caption이 없다.
- Tokyo와 Dubai alt가 유지된다.
- WebP와 원본 사진 hash가 변경되지 않는다.
- 사진 reveal은 `0/80ms`, hover는 최대 `2px`, Reduce Motion에서는 이동이 없다.
- `320px`부터 desktop까지 가로 overflow가 없다.
- journals `51`, conferences `11`, patents `35`, research `4`, publication total `97`이 유지된다.
- 구현 commit에는 승인된 다섯 production 파일만 포함되고 push·배포하지 않는다.
