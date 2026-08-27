# About 가족사진 제목 우측 재배치 설계

> 상태: 사용자 승인 완료

## 목표

현재 About 섹션의 Lab profile 아래에 있는 가족사진 두 장을 `About / Introduction` 제목 행의 우측 빈공간으로 옮긴다. 사진 위 캡션과 주변 소개 문구는 모두 제거하고 사진만 표시한다. 기존 엽서형 겹침, 작은 크기, 접근성용 `alt`, 절제된 모션은 유지한다.

## 승인된 결정

- 배치안 A: About 제목 행 우측
- 구현 방식 1: CSS 강제 이동이 아닌 실제 마크업 이동
- 보이는 문구 전체 제거
  - `Beyond the Lab`
  - `Family journeys keep curiosity close.`
  - `A personal glimpse beyond research.`
  - `With my daughter in Tokyo`
  - `With my son in Dubai`
- 사진 파일은 변경하지 않음
- 이미지 설명은 기존 `alt` 텍스트만 유지

## 현재 구조와 문제

현재 `.personal-journeys`는 `.about-aside`에서 Lab profile 다음에 렌더된다. 이 구조는 사진이 우측 컬럼 아래로 이어지면서 About 섹션 높이를 늘리고, 소개 본문 아래에 큰 빈공간을 만든다. 캡션은 이미지 파일에 포함된 글자가 아니라 `figcaption`으로 덧씌운 HTML 오버레이이므로 이미지 재가공 없이 제거할 수 있다.

## 레이아웃 구조

### 마크업

About 제목을 다음 두 영역으로 나눈다.

1. `.about-heading-copy`
   - `About` kicker
   - `Introduction` 제목
2. `.personal-journeys`
   - `.personal-postcard-stack`
   - Tokyo postcard slot
   - Dubai postcard slot

`.personal-journeys` host는 `.about-aside`에서 제거하고 `.section-heading.about-heading` 안으로 이동한다. `.about-grid`에는 기존 biography와 Lab profile만 남긴다. Lab profile의 DOM, ID, 내용 순서는 바꾸지 않는다.

### Desktop 및 tablet `>620px`

- `.about-heading`의 기존 `max-width`를 About에서만 해제한다.
- 제목과 사진 stack을 `minmax(0, 1fr) 230px` 두 열로 배치한다.
- 사진 stack은 우측 끝에 정렬한다.
- postcard 표시 크기는 기존 `132 × 176px`을 유지한다.
- Tokyo는 약간 아래, Dubai는 약간 위에 겹친다.
- `.about-grid`의 기존 breakpoint를 유지한다. `>1080px`에서는 biography/Lab profile 두 열, `<=1080px`에서는 한 열이다.

### Mobile `<=620px`

- `.about-heading`을 한 열로 전환한다.
- 사진 stack을 제목 아래, `DAEHEE KIM` 이름 위에 중앙 정렬한다.
- postcard 크기는 기존 `92 × 123px`, stack 폭은 `166px`을 유지한다.
- `320px`에서도 문서 가로 overflow가 발생하지 않아야 한다.

### About aside 정리

`.about-aside`에는 Lab profile 하나만 남는다. 기존 tablet용 2열 aside 규칙은 제거하여 단일 profile이 불필요하게 절반 폭이 되지 않도록 한다.

## 콘텐츠 데이터와 렌더링

`professor.personalMoments`에는 `moments` 배열만 남긴다. 각 항목은 다음 값만 가진다.

- `key`: `tokyo` 또는 `dubai`
- `src`: 최적화 WebP 경로
- `alt`: 구체적인 사진 설명

eyebrow, heading, supporting text, caption 필드는 제거한다. `renderPersonalMoments()`는 유효한 `key`, `src`, `alt`만 검사하고, copy 영역과 `figcaption`을 생성하지 않는다. DOM 순서는 Tokyo, Dubai로 고정한다.

사진 파생본은 이미 글자와 메타데이터가 없는 `480 × 640` WebP이므로 다시 crop, 압축 또는 수정하지 않는다. 로컬 원본 `assets/daughter.png`, `assets/son.jpg`도 변경하지 않는다.

## 모션과 상호작용

- Tokyo slot reveal: `0ms`
- Dubai slot reveal: `80ms`
- reveal 이동은 slot에만 적용한다.
- 내부 postcard의 기본 회전 `-2deg`와 `2deg`는 유지한다.
- 정밀 포인터에서 기존 최대 `2px` hover lift를 유지한다.
- Reduce Motion에서는 reveal과 hover 이동을 제거하고 정적 회전만 유지한다.
- 콘텐츠는 motion script가 없거나 실패해도 기본 상태에서 보여야 한다.

## 이미지 실패 처리

- 이미지 하나가 실패하면 해당 slot만 숨긴다.
- 유효한 카드가 하나만 남으면 `.has-single-moment`로 stack 중앙에 배치한다.
- 두 이미지가 모두 실패하면 `.personal-journeys` 전체를 숨긴다.
- `Photo unavailable`을 포함한 보이는 대체 문구는 표시하지 않는다.
- 실패가 About biography, Lab profile 또는 다른 renderer에 영향을 주지 않아야 한다.

## 접근성

- 각 이미지의 구체적인 기존 `alt`를 유지한다.
- 보이지 않는 별도 heading, aria-label 또는 caption을 추가하지 않는다.
- 사진은 정보성 이미지로 접근성 트리에 남긴다.
- 키보드 조작을 요구하는 기능, lightbox, carousel은 추가하지 않는다.

## 캐시와 변경 범위

변경 대상:

- `content.js`
- `index.html`
- `script.js`
- `styles.css`
- `assets/motion.js`

변경된 CSS와 JavaScript cache query는 `20260827a`로 갱신한다.

변경하지 않는 항목:

- `assets/beyond-lab-tokyo.webp`
- `assets/beyond-lab-dubai.webp`
- 로컬 원본 사진
- publication, patent, research, member 데이터
- navigation, scene, journey 구조
- GitHub Pages workflow

## 검증

### 정적 검사

- `node --check content.js`
- `node --check script.js`
- `node --check assets/motion.js`
- `git diff --check`
- 사진 파일 hash가 변경되지 않았는지 확인
- journals `51`, conferences `11`, patents `35`, research `4`, publication total `97` 유지 확인

### 브라우저 검사

- `1440`, `1080`, `820`, `620`, `390`, `360`, `320px` viewport
- 사진이 desktop/tablet에서 About 제목 우측에 표시되는지 확인
- 사진이 mobile에서 제목 아래·이름 위에 표시되는지 확인
- 모든 viewport에서 캡션과 주변 개인 문구가 보이지 않는지 확인
- 이미지 `alt`와 Tokyo/Dubai 순서 확인
- postcard 실제 크기와 가로 overflow 확인
- `0/80ms` reveal, `2px` hover, Reduce Motion 확인
- 단일/전체 이미지 실패 상태 확인
- publication 필터·검색, 모바일 메뉴, contact 링크 회귀 확인
- console error와 page error가 0인지 확인

## 완료 기준

- 가족사진이 About 제목 행 우측 빈공간에 표시된다.
- 모바일에서는 제목 아래, `DAEHEE KIM` 이름 위에 표시된다.
- 사진 위와 주변에 보이는 문구가 없다.
- 두 이미지의 `alt`는 유지된다.
- Lab profile 아래의 기존 사진 영역과 그로 인한 추가 높이가 제거된다.
- 이미지 파일과 원본 사진은 변경되지 않는다.
- 기존 홈페이지 데이터와 상호작용이 정상이다.
