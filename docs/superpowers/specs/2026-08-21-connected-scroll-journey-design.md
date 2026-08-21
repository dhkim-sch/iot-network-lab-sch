# 홈페이지 연결형 스크롤 여정 설계

> 상태: 디자인 최종 승인 완료. 이 문서는 설계만 정의하며 홈페이지 코드나 배포본을 변경하지 않는다.

## 1. 배경과 목적

현재 홈페이지는 Hero의 3단 SVG 패럴랙스, 최초 reveal, 통계 count-up, 카드 hover를 제공한다. Hero는 충분히 역동적이지만 Hero 아래 영역은 정보 읽기에 집중하도록 정적으로 설계되어 있어, 첫 화면의 네트워크 시각 언어가 본문까지 이어지는 느낌은 약하다.

이번 개선의 목적은 기존 레이아웃과 학술 홈페이지의 신뢰감을 유지하면서 Hero에서 Contact까지 하나의 연구 여정으로 연결하는 것이다. 스크롤 진행에 반응하는 교차형 네트워크 선과 섹션 체크포인트를 추가하되 Publications의 긴 읽기 목록, 모바일 성능, Reduce Motion 및 기존 기능을 침해하지 않는다.

이 문서는 `2026-08-20-interactive-homepage-enhancement-design.md`를 기반으로 하는 후속 설계다. 이전 문서의 Hero, 색상, 데이터, 접근성 및 성능 결정은 유지한다. 다만 이전 문서에서 Hero 아래 상시 움직임을 사용하지 않기로 한 정책은 이 문서가 정의하는 스크롤 연결선과 활성 노드에 한해 대체한다.

## 2. 승인된 결정

- 개선 방향: Hero 추가 강화보다 본문 스크롤 여정 강화
- 시각 강도: 연결형 중간 강도
- 경로 형태: B안, 좌우를 부드럽게 오가는 교차형 네트워크
- 구현 방식: B안, SVG 체크포인트 컨트롤러
- 체크포인트 순서: `About → Research → Publications → Members → Join → Contact`
- Publications 처리: 제목과 필터까지만 연결하고 긴 목록 구간에서는 경로를 생략
- 체크포인트 반응: B안, 노드 펄스 후 제목과 카드의 레이어형 reveal
- 재생 정책: 카드 reveal은 최초 1회, 경로 진행과 활성 노드는 스크롤에 계속 반응
- 기기 정책: 데스크톱은 전체 경로, 모바일·태블릿은 작은 노드와 경량 reveal만 제공
- 접근성: Reduce Motion에서는 이동·펄스·진행 애니메이션 없이 완성된 정적 상태 제공
- 구현 제약: 외부 라이브러리, Canvas, 스크롤 가로채기 및 콘텐츠 데이터 변경 없음

## 3. 목표와 비목표

### 목표

- Hero의 네트워크 그래픽이 본문으로 이어지는 일관된 시각 경험을 만든다.
- 사용자가 현재 읽고 있는 주요 섹션을 활성 노드로 인지할 수 있게 한다.
- 제목과 카드가 체크포인트에 맞춰 짧고 분명하게 등장하도록 한다.
- Publications의 긴 목록은 차분한 읽기 영역으로 보존한다.
- 위아래 스크롤 모두에서 경로 진행과 활성 노드가 자연스럽게 복귀하도록 한다.
- 기존 Hero 패럴랙스와 모션 수명주기 구조를 확장하되 각 컨트롤러의 책임을 분리한다.
- 데스크톱, 태블릿, 모바일, Reduce Motion 및 기능 미지원 환경에서 안정적으로 저하한다.

### 비목표

- Hero 이미지, 텍스트, 공지 또는 정보 구조 변경
- 섹션 순서, publication, member, contact 또는 통계 데이터 변경
- Publications 개별 행의 반복 reveal 또는 상시 애니메이션
- 전체 화면 고정, 섹션 pinning, 스크롤 가로채기 또는 페이지 전환 효과
- 모바일에서 데스크톱 경로를 축소 복제하는 것
- Canvas 파티클, WebGL, GSAP 또는 외부 애니메이션 라이브러리 도입
- 이번 디자인 단계에서 홈페이지 코드 구현 또는 배포

## 4. 검토한 구현 접근법

### A. 섹션별 CSS 연결선

각 섹션에 짧은 선과 노드를 독립적으로 배치하는 방식이다. 구현과 반응형 처리가 단순하고 실패 범위가 작지만, 섹션 사이가 시각적으로 끊겨 하나의 연구 여정이라는 인상이 약하다.

### B. SVG 체크포인트 컨트롤러 — 선택

하나의 컨트롤러가 여러 SVG 선분과 섹션 체크포인트를 관리한다. 측정된 섹션 위치로 cubic Bézier 경로를 만들고, 스크롤 진행률에 따라 선을 그리며 활성 노드를 갱신한다. 현재 인라인 SVG와 `assets/motion.js` 구조를 재사용할 수 있고 역동성, 가독성, 폴백 안정성의 균형이 가장 좋다.

### C. 네이티브 Scroll Timeline

CSS `animation-timeline: scroll()` 중심으로 경로와 reveal을 연결하는 방식이다. JavaScript가 줄고 브라우저 최적화를 활용할 수 있지만 브라우저별 지원과 동작 차이 때문에 별도 폴백 설계가 필요하며 현재 정적 Pages 구조의 유지보수 부담이 커진다.

## 5. 시각 경험 설계

### 5.1 경로와 체크포인트

Hero의 `Scroll to explore` 단서에서 짧은 entry stem이 시작되고 본문의 다음 체크포인트로 이어진다.

1. About
2. Research
3. Publications
4. Members
5. Join
6. Contact

경로는 섹션별 외곽 여백과 상단 전환 공간을 사용해 좌우를 교차한다. 경로, 노드, halo는 제목, 본문, 카드, 필터 및 링크 위를 지나지 않는다. 경로의 수평 전환은 섹션 콘텐츠 사이의 빈 전환 구간에서만 발생한다.

선은 현재 Hero와 동일한 SCH 파랑–cyan 계열을 사용한다. 기본 track은 낮은 불투명도로 전체 구조를 보여주고, 완료된 구간은 밝은 cyan gradient와 작은 glow로 표시한다. 아직 도달하지 않은 구간은 배경 track만 보인다.

### 5.2 선분 분리

하나의 긴 SVG 레이어 대신 한 컨트롤러가 두 개의 지역 SVG 선분을 관리한다.

- 선분 1: Hero entry stem에서 About, Research, Publications 제목·필터까지
- 선분 2: Members에서 Join, Contact까지

Publications 목록에는 경로가 없다. 첫 선분은 필터 영역 부근에서 opacity gradient로 흐려지며 끝나고, 두 번째 선분은 Members의 새 노드에서 다시 시작한다. 이렇게 하면 publication 필터나 검색으로 목록 높이가 크게 달라져도 목록 위에 거대한 SVG 레이어를 만들지 않는다.

### 5.3 체크포인트 활성 상태

viewport 높이의 58% 지점을 활성 기준선으로 사용한다. 기준선에 가장 가까운 체크포인트를 현재 노드로 표시한다.

- 현재 노드: 밝은 cyan fill, 얇은 흰색 ring, 짧은 glow
- 완료 노드: cyan fill, 낮은 glow
- 미도달 노드: 투명 fill, 낮은 불투명도의 stroke

활성 노드는 섹션 최초 진입 시 한 번만 펄스한다. 위로 되돌아갈 때 활성 노드와 경로 진행은 역방향으로 갱신되지만 펄스와 카드 reveal은 반복하지 않는다.

### 5.4 레이어형 reveal

체크포인트 최초 진입 시 다음 순서로 한 번 재생한다.

1. 노드가 짧게 펄스한다.
2. section kicker와 제목이 아래에서 `14px` 올라오며 나타난다.
3. 카드 또는 콘텐츠 묶음이 좌우에서 `14px` 이동하며 순차 등장한다.
4. 전환 class와 인라인 지연값을 정리해 정적 최종 상태로 남긴다.

노드 펄스는 `420ms`, 제목은 `480ms`, 카드는 `520ms`를 기준으로 한다. 카드 stagger는 `70ms`, 한 묶음의 최대 지연은 `280ms`로 제한한다.

적용 단위는 다음과 같다.

- About: 소개 본문과 lab profile
- Research: 현재 4개 연구 카드
- Publications: 제목과 필터만 레이어형 reveal, publication 그룹은 기존의 차분한 fade 유지
- Members: professor 카드와 현재 학생 카드, alumni는 그룹 단위 fade 유지
- Join: 제목, 본문, 버튼 묶음
- Contact: 현재 4개 contact 카드

## 6. 반응형과 접근성

### 데스크톱

- `min-width: 821px`에서 전체 교차형 SVG 경로를 활성화한다.
- 포인터 정밀도와 관계없이 스크롤 경로는 사용할 수 있지만 기존 Hero 포인터 패럴랙스는 `(hover: hover) and (pointer: fine)` 조건을 유지한다.
- 1024px와 1440px에서 경로가 외곽 안전 영역을 지키도록 좌표를 각각 계산한다.

### 태블릿과 모바일

- `max-width: 820px`에서는 전체 SVG 경로와 entry stem을 숨긴다.
- 각 섹션 kicker 옆에 작은 정적 노드만 두고 최초 진입 시 opacity와 짧은 scale reveal을 적용한다.
- 카드 이동량은 데스크톱보다 작게 제한하며 수평 이동 대신 짧은 fade-up을 우선한다.
- 모바일 카드 fade-up 이동량은 `8px`로 제한한다.
- 지속적인 RAF, 스크롤 진행 계산, path 측정은 실행하지 않는다.

### Reduce Motion

- 최초 로드부터 Reduce Motion인 경우 경로 좌표를 한 번 계산하고 완성된 정적 track과 노드를 표시한다.
- stroke 진행, 펄스, 카드 이동, count-up, Hero 패럴랙스와 smooth scroll을 실행하지 않는다.
- 실행 중 Reduce Motion으로 변경하면 예정된 frame, observer 및 transition class를 정리하고 모든 콘텐츠를 최종 상태로 복구한다.
- Reduce Motion과 `max-width: 820px`가 함께 적용되면 전체 경로를 표시하지 않고 모바일 정적 노드만 표시한다.

장식 SVG와 노드는 `aria-hidden="true"`, `focusable="false"`, `pointer-events: none`을 사용한다. 기존 링크, 버튼, 검색창, 모바일 메뉴와 focus outline은 변경하지 않는다.

## 7. 기술 구조

### 7.1 `index.html`

- Hero의 scroll cue를 entry anchor로 식별한다.
- 각 주요 section heading에 `data-journey-checkpoint`와 안정적인 checkpoint id를 지정한다.
- 두 개의 장식용 journey SVG 선분과 path, node group을 추가한다.
- SVG는 기본적으로 숨겨 두고 좌표 계산이 완료된 경우에만 ready class로 표시한다.
- `styles.css`와 `assets/motion.js` cache query version을 갱신한다.

### 7.2 `styles.css`

- journey overlay, 기본 track, progress path, node 상태와 fade endpoint 스타일을 정의한다.
- 경로의 z-index를 콘텐츠보다 낮고 섹션 배경보다 높게 유지한다.
- 레이어형 reveal의 좌우 방향, stagger, 완료 상태를 정의한다.
- `min-width: 821px`, `max-width: 820px`, 정밀 포인터와 Reduce Motion 규칙을 분리한다.
- JavaScript가 실패하거나 ready class가 없으면 SVG를 숨기고 콘텐츠를 기본 상태로 표시한다.

### 7.3 `assets/motion.js`

기존 컨트롤러에 다음 단위를 추가한다.

1. `journey geometry`: 체크포인트와 안전 전환 구간을 측정하고 두 SVG의 위치, 크기, path와 node 좌표를 만든다.
2. `journey progress`: 저장된 checkpoint y 좌표와 현재 scroll 위치로 선분별 진행률을 계산한다.
3. `journey active state`: 현재, 완료, 미도달 node class를 갱신한다.
4. `journey reveal`: 체크포인트별 최초 1회 펄스와 방향별 콘텐츠 reveal을 조정한다.
5. `journey lifecycle`: viewport media query, ResizeObserver, visibility, Reduce Motion과 destroy 처리를 관리한다.

Hero controller와 Journey controller는 서로의 DOM과 상태를 직접 변경하지 않는다. 공통 수명주기만 최상위 motion initializer가 관리한다.

Journey가 소유하는 section heading, About, Research, Publications controls, Members, Join과 Contact 대상은 기존 generic reveal 대상 목록에서 제거한다. Journey controller와 기존 reveal controller가 같은 요소에 class, delay 또는 cleanup을 중복 적용하지 않는다. Publications 그룹과 alumni 그룹의 기존 차분한 reveal은 generic reveal controller가 계속 소유한다.

### 7.4 변경하지 않는 파일

- `content.js`
- `script.js`
- `assets/lab-hero.png`
- publication, patent, member 및 contact 데이터
- `.github/workflows/pages.yml`

## 8. 좌표와 스크롤 데이터 흐름

1. `script.js`가 기존 순서대로 모든 콘텐츠를 렌더링한다.
2. 뒤이어 로드된 `assets/motion.js`가 journey SVG와 checkpoint를 확인한다.
3. 데스크톱 조건이면 section bounding box와 heading 위치를 측정한다.
4. 각 선분의 로컬 좌표계로 cubic Bézier path와 node 좌표를 생성한다.
5. 각 path는 `pathLength="1"`을 사용해 진행 값을 `0–1`로 통일한다.
6. scroll과 resize 이벤트는 목표값 또는 geometry invalidation flag만 저장한다.
7. 예약된 animation frame이 segment progress, `stroke-dashoffset`과 node class를 한 번 갱신한다.
8. `ResizeObserver`가 main, publication list 또는 checkpoint 크기 변화를 감지하면 다음 frame에서 geometry를 다시 계산한다.
9. publication 검색·필터로 Members의 문서 위치가 바뀌면 두 번째 선분의 top과 path가 다시 정렬된다.

스크롤 중에는 `getBoundingClientRect()`를 반복 호출하지 않는다. geometry 재계산은 초기화, breakpoint 전환, 창 크기 변경, 콘텐츠 높이 변경에만 수행한다.

## 9. 수명주기와 성능 정책

- Journey scroll 이벤트에서는 최대 한 개의 animation frame만 예약한다.
- 상시 반복 RAF를 만들지 않는다.
- 두 SVG 선분 모두 viewport 상하 한 화면 범위 밖에 있거나 document가 hidden 상태면 예정된 frame을 취소한다.
- path와 node 수는 HTML에 고정하며 런타임에 무제한 요소를 만들지 않는다.
- 애니메이션 속성은 `transform`, `opacity`, `stroke-dashoffset`으로 제한한다.
- `ResizeObserver` callback에서는 직접 style을 반복 기록하지 않고 geometry invalidation만 표시한다.
- 경로 좌표는 소수점 정밀도를 제한해 불필요한 style churn을 줄인다.
- 외부 네트워크 요청, CDN, 라이브러리 및 Canvas를 추가하지 않는다.

## 10. 실패 대응

- journey SVG 또는 checkpoint 누락: Journey controller만 조용히 종료한다.
- 한 선분의 필수 checkpoint 누락: 해당 선분만 숨기고 다른 선분은 유지한다.
- `IntersectionObserver` 미지원: reveal과 활성 node 전환을 비활성화하고 콘텐츠는 최종 상태로 표시한다.
- `ResizeObserver` 미지원: 동적 데스크톱 경로를 숨기고 기존 reveal만 유지한다.
- SVG geometry 또는 path 계산 오류: ready class를 제거하고 기존 페이지 기능을 유지한다.
- JavaScript 또는 motion 파일 로드 실패: 장식 SVG는 숨고 기존 콘텐츠, 통계, 검색, 필터와 내비게이션은 그대로 동작한다.
- 실행 중 breakpoint 또는 Reduce Motion 변화: 현재 컨트롤러를 destroy한 뒤 해당 조건의 정적 또는 경량 상태로 전환한다.

모든 cleanup은 event listener, observer, timeout, animation frame, 임시 class와 CSS 변수를 제거한다.

## 11. 검증 계획

### 기능과 스크롤 상태

- Hero entry stem에서 About까지 경로가 자연스럽게 이어지는지 확인한다.
- About, Research, Publications, Members, Join, Contact 순서로 node가 활성화되는지 확인한다.
- 아래로 스크롤할 때 path가 진행되고 위로 되돌릴 때 역방향으로 복귀하는지 확인한다.
- 카드 reveal과 node pulse가 최초 한 번만 재생되는지 확인한다.
- Publications 제목·필터에서 첫 선분이 흐려지고 목록 위에는 경로가 없는지 확인한다.
- Members에서 두 번째 선분이 자연스럽게 재개되는지 확인한다.

### 데이터와 기존 기능 회귀

- 통계 최종값이 journals `51`, conferences `11`, patents `34`, research tracks `4`인지 확인한다.
- publication All, Journals, Conferences, Patents 필터와 검색을 확인한다.
- 필터와 검색으로 목록 높이가 바뀐 후 Members, Join, Contact 경로가 재정렬되는지 확인한다.
- 모바일 메뉴, 활성 navigation, 이메일·전화·publication 링크를 확인한다.
- Hero 포인터·스크롤 패럴랙스와 기존 최초 reveal이 정상인지 확인한다.

### 반응형과 접근성

- 1440px와 1024px에서 경로가 제목, 카드, 필터 및 본문과 겹치지 않는지 확인한다.
- 768px와 390px에서 전체 경로가 숨고 경량 node·reveal만 적용되는지 확인한다.
- 모든 기준 viewport에서 가로 overflow와 layout shift가 없는지 확인한다.
- 초기 Reduce Motion과 실행 중 Reduce Motion 전환 후 모든 이동이 제거되는지 확인한다.
- 장식 SVG가 접근성 트리에 나타나지 않고 키보드 focus 순서가 변하지 않는지 확인한다.
- WCAG A/AA 자동 검사와 키보드 수동 검사를 수행한다.

### 실패와 성능

- SVG 제거, 필수 checkpoint 제거, Observer 미지원과 motion 파일 실패 조건을 확인한다.
- 콘솔 오류가 없고 실패 시 콘텐츠가 숨지 않는지 확인한다.
- 스크롤 중 Journey가 반복 layout 측정을 하지 않는지 확인한다.
- 한 시점에 Journey용 animation frame이 하나만 예약되는지 확인한다.
- document hidden 및 영역 이탈 시 frame이 취소되는지 확인한다.
- 새 외부 요청이나 애니메이션 라이브러리가 추가되지 않았는지 확인한다.

## 12. 구현 범위

변경 예정 파일:

- `index.html`
- `styles.css`
- `assets/motion.js`

`content.js`, `script.js`, 데이터, 이미지와 배포 workflow는 변경하지 않는다.

## 13. 완료 기준

- Hero에서 Contact까지 교차형 네트워크 여정이 시각적으로 이어진다.
- 현재 섹션을 활성 노드로 식별할 수 있고 스크롤 역방향에서도 정확히 복귀한다.
- 제목과 카드는 최초 한 번만 레이어형 reveal을 재생한다.
- Publications 목록 위에는 연결선이나 반복 모션이 없어 읽기 경험이 유지된다.
- 모바일·태블릿은 전체 경로 없이 경량 reveal만 제공한다.
- Reduce Motion과 실패 환경에서 모든 콘텐츠가 안정적인 정적 상태로 보인다.
- 기존 데이터, Hero 모션, 내비게이션, 검색·필터, 링크와 통계에 회귀가 없다.
- 성능·접근성·반응형 검증을 통과하며 외부 라이브러리나 네트워크 비용을 추가하지 않는다.

실제 구현, push와 배포는 별도의 사용자 요청과 구현 계획 승인 후에만 수행한다.
