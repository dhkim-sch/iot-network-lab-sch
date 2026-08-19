# 홈페이지 절제형 모션 상세 구현 계획

> 상태: 계획 전용. 이 문서를 작성하는 단계에서는 홈페이지 코드와 배포본을 변경하지 않는다.

## 목표

외부 라이브러리 없이 CSS와 `IntersectionObserver`를 사용해 홈페이지 전반에 절제된 최초 1회 진입 모션을 추가한다. 기존 콘텐츠 렌더링, publication 검색·필터, 내비게이션, 통계 계산 및 접근성을 유지한다.

승인된 설계: `docs/superpowers/specs/2026-08-19-subtle-homepage-motion-design.md`

## 변경 대상

- `styles.css`: 모션 토큰, reveal 상태, hover, 모션 감소 대응
- `script.js`: reveal 등록·관찰, stagger, 통계 count-up 및 실패 복구
- `index.html`: 배포 시 CSS/JavaScript 캐시 버전만 갱신

변경하지 않을 파일:

- `content.js`: publication, member, 연구 분야 등 실제 데이터
- `assets/`: 이미지 자산
- `.github/workflows/pages.yml`: 기존 GitHub Pages 배포 방식

## 구현 원칙

- 콘텐츠는 JavaScript 없이도 기본적으로 보인다.
- 모션은 `opacity`와 `transform`만 사용한다.
- 각 reveal 대상은 최초 노출 후 관찰을 해제한다.
- 긴 목록은 항목별이 아니라 그룹 단위로 처리한다.
- publication 검색·필터로 다시 생성된 결과에는 모션을 다시 적용하지 않는다.
- `prefers-reduced-motion: reduce`에서는 reveal, count-up, hover 이동 및 부드러운 스크롤을 비활성화한다.

## 작업 1: 변경 전 기준선 확인

대상 파일: 없음

1. 작업 트리가 깨끗하고 `main`이 의도한 기준 커밋인지 확인한다.
2. JavaScript 문법 검사를 실행한다.
3. 현재 통계 데이터가 journals `51`, conferences `11`, patents `34`, research `4`인지 계산한다.
4. 로컬 정적 서버에서 다음 기존 기능을 기록한다.
   - 모바일 메뉴 열기·닫기
   - 스크롤에 따른 활성 내비게이션
   - publication 유형 필터
   - publication 검색
   - 외부 publication 링크
5. 데스크톱과 모바일 화면을 기준 스크린샷으로 남긴다.

검증 명령 예시:

```bash
node --check script.js
git status -sb
```

완료 조건:

- 기존 기능과 현재 통계 값을 재현할 수 있다.
- 구현 전 콘솔 오류가 없는지 확인했다.

## 작업 2: CSS 모션 기반 추가

대상 파일: `styles.css`

1. 기존 `:root` 색상·그림자 토큰 옆에 다음 역할의 모션 토큰을 추가한다.
   - reveal 거리: `12px`
   - reveal 지속 시간: 약 `480ms`
   - stagger 간격: `60–70ms`
   - 최대 stagger: `280ms`
   - 자연스럽게 감속하는 공통 easing
2. 콘텐츠 기본 상태는 건드리지 않고, 문서 루트에 모션 활성화 클래스가 있을 때만 reveal 대상의 초기 상태를 적용한다.
3. 공통 reveal 클래스에 다음 상태를 정의한다.
   - 초기: 낮은 opacity와 `translateY(12px)`
   - visible: opacity `1`, transform `none`
   - 각 요소의 CSS 사용자 정의 속성으로 delay 적용
4. `will-change`는 상시 적용하지 않는다. 짧은 애니메이션의 메모리 비용을 피한다.
5. `prefers-reduced-motion: reduce` 미디어 쿼리에서 reveal 전환과 이동을 제거하고 콘텐츠를 최종 상태로 강제한다.
6. 같은 미디어 쿼리에서 기존 `scroll-behavior: smooth`도 `auto`로 바꾼다.

완료 조건:

- 루트 활성화 클래스가 없으면 페이지 모양이 현재와 완전히 같다.
- 모션 감소 환경에서는 어떤 reveal 대상도 숨겨지지 않는다.
- CSS 전환이 레이아웃 크기나 위치 계산을 바꾸지 않는다.

예정 커밋 단위:

```text
Add accessible homepage motion styles
```

## 작업 3: 독립적인 reveal controller 추가

대상 파일: `script.js`

1. 기존 navigation용 Observer와 분리된 motion controller를 만든다.
2. 다음 조건 중 하나라도 해당하면 초기화를 종료한다.
   - `IntersectionObserver` 미지원
   - `window.matchMedia("(prefers-reduced-motion: reduce)")` 일치
   - reveal 대상이 없음
3. 작은 헬퍼를 분리한다.
   - 단일 요소를 reveal 대상으로 표시
   - NodeList에 제한된 stagger delay 부여
   - 모든 대상을 즉시 visible 상태로 복구
4. Observer를 먼저 안전하게 만든 후 대상 등록과 루트 활성화 클래스를 적용한다.
5. 콜백에서 진입한 요소에 visible 클래스를 추가하고 즉시 `unobserve`한다.
6. 초기화 전체를 `try/catch`로 격리한다. 실패하면 Observer를 해제하고 루트 활성화 클래스를 제거해 모든 콘텐츠를 표시한다.
7. 브라우저의 모션 감소 설정이 실행 중 변경되면 남은 대상을 즉시 표시하고 Observer를 해제한다.
8. 기본 관찰 설정은 빠른 스크롤에서도 놓치지 않도록 낮은 threshold와 작은 하단 root margin을 사용한다.

완료 조건:

- 모션 로직 오류가 기존 렌더링과 이벤트 연결을 막지 않는다.
- 한 번 visible이 된 요소는 다시 스크롤해도 재생되지 않는다.
- navigation Observer는 현재와 동일하게 계속 작동한다.

## 작업 4: 초기 렌더링 결과에 reveal 대상 지정

대상 파일: `script.js`

모든 기존 renderer가 끝난 뒤, publication 컨트롤을 연결한 다음 motion controller를 마지막으로 초기화한다.

### Hero

다음 순서로 약 `70ms`의 시차를 적용한다.

1. `.hero-content .eyebrow`
2. `#hero-title`
3. `.hero-lead`
4. `.hero-actions`
5. `.notice-board`

Hero 이미지와 배경 shade는 움직이지 않는다.

### Quick stats

- `.quick-stats` 전체를 하나의 reveal 대상으로 등록한다.
- 각 통계 칸에는 별도 이동 stagger를 적용하지 않는다.

### Section headings and primary groups

- 모든 `.section-heading`
- `.about-copy`와 `.lab-profile`
- `.publication-controls`
- `.professor-card`
- `.join-content`

### Grids

- `.research-card`: DOM 순서대로 stagger
- `.contact-block`: DOM 순서대로 stagger
- 현재 graduate student의 `.person-card`: DOM 순서대로 stagger

현재 학생 카드만 안정적으로 구분하기 위해 `renderCurrentMembers`가 만드는 grid에 의미 있는 보조 클래스 하나를 추가한다. 모션 코드는 이 클래스를 대상으로 하며 화면 구조나 콘텐츠는 변경하지 않는다.

### Long lists

- 초기 렌더링된 각 `.publication-section`을 그룹 단위로 등록한다.
- graduate student를 제외한 각 `.member-group`을 그룹 단위로 등록한다.
- publication item과 alumni item 개별 요소는 등록하지 않는다.

publication 검색이나 필터 이벤트가 `renderPublications()`를 다시 호출할 때 motion controller를 다시 호출하지 않는다. 새 결과는 즉시 표시한다.

완료 조건:

- 중첩된 부모와 자식에 reveal transform이 동시에 적용되지 않는다.
- 각 그리드의 총 stagger가 `280ms`를 넘지 않는다.
- 긴 publication 목록을 관찰 대상 수만큼 등록하지 않는다.

## 작업 5: 통계 count-up 구현

대상 파일: `script.js`

1. `renderStats`는 지금처럼 배열 길이의 최종 문자열을 먼저 DOM에 기록한다.
2. motion 초기화 시 각 `[data-count]` 요소의 최종 정수 값을 읽어 보관한다.
3. `.quick-stats`가 최초 진입하면 `requestAnimationFrame` 기반 count-up을 시작한다.
4. 지속 시간은 약 `700ms`로 통일하고 easing을 적용한다.
5. 매 프레임 정수만 출력하며 마지막 프레임에서 보관한 최종 문자열을 다시 설정한다.
6. 다음 조건에서는 count-up 없이 최종 값을 즉시 유지한다.
   - 모션 감소 설정
   - 문서가 이미 hidden 상태
   - 유효한 정수로 변환할 수 없는 값
   - animation 실행 중 예외
7. 중간 숫자를 반복 안내하지 않도록 `aria-live`는 추가하지 않는다.

완료 조건:

- 현재 데이터 기준 최종 숫자가 항상 `51`, `11`, `34`, `4`다.
- count-up을 중단하거나 탭을 전환해도 `0` 또는 중간 값으로 남지 않는다.
- 기존 데이터 기반 계산 방식이 유지된다.

예정 커밋 단위:

```text
Add one-time reveal and statistic animations
```

## 작업 6: 절제된 카드 hover 추가

대상 파일: `styles.css`

1. hover가 가능한 정밀 포인터 환경에서만 다음 카드에 효과를 적용한다.
   - `.research-card`
   - `.person-card`
   - `.contact-block`
   - `.lab-profile`
2. 최대 `translateY(-2px)`와 작은 그림자 변화만 사용한다.
3. 링크를 포함한 카드에는 `:focus-within`에서도 명확한 상태를 제공하되 기존 focus outline을 제거하지 않는다.
4. 터치 환경과 모션 감소 환경에서는 이동 효과를 제거한다.
5. `.publication-item`은 긴 읽기 목록이므로 hover 이동을 적용하지 않는다.

완료 조건:

- 카드 크기와 주변 레이아웃이 변하지 않는다.
- 터치 후 카드가 들뜬 상태로 남지 않는다.
- 키보드 focus 표시가 기존보다 약해지지 않는다.

## 작업 7: 정적 검사 및 회귀 검증

대상 파일: `script.js`, `styles.css`

1. JavaScript 문법 검사를 실행한다.
2. diff whitespace 오류를 확인한다.
3. 외부 라이브러리, 새 CDN 또는 새 네트워크 요청이 추가되지 않았는지 확인한다.
4. 모션 활성화 클래스가 없을 때 reveal 초기 숨김 규칙이 적용되지 않는지 정적으로 확인한다.
5. `prefers-reduced-motion` 규칙이 reveal, count-up 시작 조건, hover 이동 및 smooth scroll을 모두 포함하는지 확인한다.
6. publication 데이터와 통계 계산 코드에 의도하지 않은 변경이 없는지 diff로 확인한다.

검증 명령 예시:

```bash
node --check script.js
git diff --check
git diff -- content.js
```

완료 조건:

- 모든 정적 검사가 통과한다.
- `content.js`에는 diff가 없다.

## 작업 8: 실제 브라우저 검증

대상 파일: 없음

로컬 정적 서버에서 다음 viewport를 확인한다.

- 데스크톱: 약 `1440px`
- 소형 노트북/태블릿: 약 `1024px`, `768px`
- 모바일: 약 `390px`

### 정상 모션

1. Hero가 페이지 로드 후 한 번만 순차 등장한다.
2. Stats가 진입 시 한 번 카운트업하고 정확한 최종 값에 도달한다.
3. 각 섹션 제목과 주요 카드가 스크롤 진입 시 한 번만 등장한다.
4. 다시 위아래로 이동해도 재생되지 않는다.
5. 빠르게 스크롤해도 숨겨진 채 남는 콘텐츠가 없다.

### 기존 기능 회귀

1. 모바일 메뉴가 정상 작동한다.
2. 활성 navigation 표시가 정상 작동한다.
3. publication All/Journals/Conferences/Patents 필터가 정상 작동한다.
4. publication 검색 결과가 즉시 표시되고 다시 애니메이션되지 않는다.
5. 외부 publication 링크와 이메일·전화 링크가 정상 작동한다.

### 접근성 및 성능

1. Reduce Motion을 켜고 새로고침했을 때 모든 콘텐츠와 통계가 즉시 표시된다.
2. 키보드만으로 탐색하고 focus 표시를 확인한다.
3. 콘솔 오류와 레이아웃 이동이 없는지 확인한다.
4. 스크롤 중 눈에 띄는 프레임 저하가 없는지 확인한다.

완료 조건:

- 기준 viewport와 Reduce Motion 환경에서 모든 검증 항목을 통과한다.
- 발견한 문제는 배포 전에 수정하고 같은 검증을 다시 수행한다.

## 작업 9: 캐시 버전, 최종 검토 및 선택적 배포

대상 파일: `index.html`

이 작업은 사용자가 실제 반영을 별도로 승인한 경우에만 수행한다.

1. `styles.css`와 `script.js`의 query version을 새 값으로 갱신한다.
2. 최종 diff가 `styles.css`, `script.js`, `index.html`과 승인된 문서에만 한정되는지 확인한다.
3. 기능 변경 커밋을 만든다.
4. 배포 요청이 있을 때만 `main`에 push한다.
5. GitHub Pages workflow 성공을 확인한다.
6. 실제 배포된 CSS와 JavaScript가 로컬 파일과 동일한지 확인한다.
7. 실제 홈페이지에서 최종 숫자와 모션 감소 fallback을 다시 확인한다.

완료 조건:

- 별도 승인 전에는 홈페이지 코드 커밋, push 또는 배포를 하지 않는다.
- 승인 후 배포할 경우 workflow와 실제 페이지 검증까지 완료한다.

## 최종 인수 기준

- 전체 페이지가 절제된 모션으로 더 생동감 있게 느껴진다.
- 모든 진입 모션은 요소별 최초 한 번만 실행된다.
- 반복 배경, 패럴랙스, 파티클 또는 외부 애니메이션 라이브러리가 없다.
- publication 및 member의 긴 목록은 그룹 단위로만 등장한다.
- Reduce Motion, JavaScript 오류 및 Observer 미지원 환경에서도 모든 콘텐츠가 즉시 보인다.
- 기존 검색, 필터, navigation, 링크 및 데이터 기반 통계가 그대로 작동한다.
- 현재 데이터의 최종 통계는 `51`, `11`, `34`, `4`다.
- 배포는 별도의 사용자 승인 없이는 수행하지 않는다.
