# 홈페이지 강조형 인터랙티브 모션 설계

> 상태: 디자인 승인 완료. 이 문서는 설계만 정의하며 홈페이지 코드나 배포본을 변경하지 않는다.

## 1. 배경과 목적

현재 홈페이지에는 최초 진입 reveal, 통계 count-up, 작은 카드 hover가 적용되어 있다. 동작은 안정적이지만 이동 거리와 시각적 대비가 작아 사용자가 변화를 뚜렷하게 느끼기 어렵다.

이번 개선의 목적은 기존 정보 구조와 연구실 홈페이지의 신뢰감을 유지하면서 첫 화면에서 분명한 시각적 인상을 주는 것이다. Hero를 가장 강하게 개선하고, 이후 섹션은 같은 시각 언어를 절제된 강도로 반복한다.

## 2. 승인된 결정

- 시각 강도: 현재 레이아웃을 유지하는 **한 단계 강조형**
- 강조 범위: Hero는 강하게, 나머지 섹션은 중간 수준으로 강화
- 배경 자산: 현재 `assets/lab-hero.png` 유지
- 추가 그래픽: 인라인 SVG 네트워크 레이어
- 데스크톱 동작: 마우스와 스크롤에 반응하는 3단계 패럴랙스
- 모바일·태블릿 동작: 짧은 진입 애니메이션 후 완전히 정지
- 구현 방식: 외부 라이브러리와 Canvas 없이 HTML, CSS, JavaScript 사용
- 접근성: Reduce Motion에서는 모든 이동·카운트업·reveal을 비활성화

## 3. 목표와 비목표

### 목표

- 첫 화면에서 이전 배포본과 확실히 구분되는 깊이와 반응성을 제공한다.
- 네트워크, 연결성, 에너지 IoT라는 연구 주제를 장식 그래픽으로 표현한다.
- 제목, 버튼, 공지 및 연구 정보의 가독성을 움직임보다 우선한다.
- 데스크톱에서 마우스와 스크롤에 자연스럽게 반응한다.
- 모바일, Reduce Motion, 미지원 브라우저에서 안정적인 정적 화면을 제공한다.
- 기존 publication 검색·필터, 내비게이션, 통계 및 콘텐츠 데이터를 보존한다.

### 비목표

- Hero 이미지 교체 또는 영상 배경 도입
- Canvas 파티클 시스템
- 커서 전용 그래픽, 스크롤 가로채기 또는 페이지 전환 애니메이션
- publication과 alumni 항목별 반복 애니메이션
- 콘텐츠 문구, publication, member 또는 통계 데이터 변경
- 외부 애니메이션 라이브러리나 CDN 추가
- 이 디자인 단계에서의 구현 또는 배포

## 4. 검토한 접근법

### 선택: 레이어형 SVG 패럴랙스

네트워크 그래픽을 원경, 중경, 전경으로 나누고 마우스와 스크롤 입력에 서로 다른 이동량을 적용한다. 텍스트는 고정되므로 깊이감과 가독성을 동시에 유지할 수 있다. SVG가 정적 마크업이라 실패 시에도 장식이 그대로 보이며, 모바일 정지 상태도 자연스럽다.

### 대안 1: Hero 전체 3D 틸트

이미지, 그래픽, 텍스트, 공지 패널을 하나의 평면으로 기울이는 방식이다. 강한 효과를 적은 코드로 만들 수 있지만 텍스트까지 움직이고 멀미 가능성이 높아 학술 홈페이지에 적합하지 않다.

### 대안 2: Canvas 네트워크 엔진

노드와 연결선을 실시간 생성해 가장 화려한 결과를 만들 수 있다. 그러나 CPU 비용, 구현 복잡도, 접근성 대응 및 테스트 범위가 커지고 승인된 한 단계 강조형 범위를 넘어선다.

## 5. Hero 시각 설계

### 레이어 순서

뒤에서 앞으로 다음 순서를 사용한다.

1. 기존 Hero 이미지
2. 현재보다 대비가 높은 남색·파란색 gradient shade
3. 오른쪽과 하단에 제한된 원근 grid
4. 마우스를 따라가는 낮은 불투명도의 cyan halo
5. 원경·중경·전경으로 구분한 SVG 연결선과 노드
6. 고정된 Hero 제목, 설명, 버튼 및 공지 패널

SVG와 grid는 장식 요소이므로 `aria-hidden="true"`로 접근성 트리에서 제외한다. Hero 제목, 버튼과 공지 패널에는 패럴랙스를 적용하지 않는다.

### 타이포그래피와 색상

- 현재 `IoT Network Lab` 제목과 본문 내용은 유지한다.
- 제목의 `Lab` 또는 짧은 핵심 부분에 밝은 cyan 강조를 허용한다.
- eyebrow 앞에 짧은 gradient line을 추가한다.
- 기본 남색, SCH 파랑, cyan 계열을 유지하고 새 브랜드 색상은 추가하지 않는다.
- 배경과 텍스트의 명도 대비는 현재 수준 이상으로 유지한다.

### 버튼과 공지 패널

- Primary 버튼은 남색에서 cyan으로 이어지는 gradient와 작은 glow를 사용한다.
- Secondary 버튼은 반투명 배경과 밝은 테두리를 유지한다.
- 공지 패널은 현재 구조를 유지하되 상단 2px gradient line과 깊어진 그림자를 적용한다.
- 클릭 영역, 링크 목적지 및 텍스트는 변경하지 않는다.

### 스크롤 단서와 통계

- Hero 하단 중앙에 작은 `Scroll to explore` 단서를 배치한다.
- 단서는 Hero가 화면을 떠날 때 사라지고 Reduce Motion에서는 애니메이션 없이 정적으로 표시한다.
- Quick stats는 현재 4열 구조를 유지하되 상단 gradient line을 추가한다.
- 통계 값은 계속 `content.js` 배열에서 계산하며 현재 값은 journals `51`, conferences `11`, patents `34`, research tracks `4`다.

## 6. Hero 상호작용 설계

### 데스크톱 포인터 입력

- `(hover: hover) and (pointer: fine)` 환경에서만 활성화한다.
- Hero 내부 포인터 위치를 가로·세로 각각 `-1`에서 `1`로 정규화한다.
- 원경, 중경, 전경의 최종 이동량은 포인터와 스크롤 기여분을 합산한 뒤 각각 최대 `6px`, `10px`, `18px`로 제한한다.
- 배경 이미지와 halo는 SVG보다 작은 반대 방향 이동을 사용해 깊이감을 만든다.
- 포인터가 Hero를 벗어나면 목표 좌표를 중앙으로 되돌린다.

### 스크롤 입력

- 페이지 스크롤을 가로채지 않고 Hero의 viewport 진행률만 읽는다.
- 배경, grid, SVG 레이어에 서로 다른 수직 이동량을 적용한다.
- Hero가 viewport 밖으로 나가면 계산과 animation frame을 중지한다.
- 페이지가 hidden 상태가 되면 즉시 animation frame을 취소한다.

### 렌더링 정책

- 포인터와 스크롤 이벤트에서는 목표값만 저장한다.
- 하나의 `requestAnimationFrame` 루프가 보간된 값을 CSS 사용자 정의 속성으로 기록한다.
- 매 프레임 DOM 구조나 SVG path를 다시 만들지 않는다.
- 애니메이션 속성은 `transform`과 `opacity`로 제한한다.

## 7. Hero 아래 시각 설계

Hero 아래에서는 상시 움직임을 사용하지 않는다. 강한 첫 화면 이후 정보 탐색이 차분해지도록 정적인 색상과 짧은 상태 전환만 사용한다.

### 섹션 제목

- section kicker 앞에 26px 안팎의 파랑–cyan gradient line을 추가한다.
- 진입할 때 line이 짧게 그려진 후 제목 묶음이 페이드업한다.
- 기존 제목 구조와 콘텐츠 순서는 유지한다.

### Research 카드

- 상단 2px gradient line과 낮은 불투명도의 원형 패턴을 추가한다.
- 카드에 `01`부터 `04`까지 시각적 순번을 표시하되 접근성 이름에는 불필요하게 반복하지 않는다.
- 정밀 포인터 hover에서 최대 `5px` 올라가고 테두리와 그림자가 선명해진다.
- 키보드 focus-within에서도 동일한 계층 강조를 제공하되 focus outline을 제거하지 않는다.

### Publications

- 긴 읽기 목록은 가장 차분한 영역으로 유지한다.
- 활성 필터에 파랑–cyan gradient pill을 사용한다.
- 각 그룹 제목에 데이터에서 계산한 정확한 개수를 표시하며 별도 하드코딩은 금지한다.
- 행 hover는 배경 변화와 최대 `3px` 수평 이동으로 제한한다.
- 검색이나 필터로 다시 렌더링된 행에는 reveal을 재적용하지 않는다.

### Members와 Join

- Professor 카드에는 왼쪽 gradient rail과 avatar ring을 추가한다.
- Student 카드에는 최대 `3px` hover와 작은 그림자만 적용한다.
- Join 영역은 현재 남색 계열을 유지하면서 cyan halo와 큰 정적 원형 line을 추가한다.
- Join을 제외한 본문 영역에는 반복·상시 애니메이션을 추가하지 않는다.

## 8. 모션 리듬

- Hero 최초 진입: 제목·설명·버튼·공지의 순차 reveal과 SVG line draw
- Hero 체류 중: 데스크톱에서만 포인터·스크롤 패럴랙스
- 섹션 제목: gradient line 후 제목 fade-up
- Research와 현재 학생 카드: 행 단위 stagger
- Publications와 alumni: 그룹 단위 reveal
- 검색·필터 결과: 즉시 표시
- 재생 정책: 기존 reveal과 count-up은 최초 한 번만 실행

Hero 외 영역의 전환 시간은 약 `180–520ms`, stagger는 `60–80ms`, 최대 지연은 `320ms` 이내로 제한한다.

## 9. 기술 구조

### `index.html`

- Hero 내부에 장식용 grid, halo, 인라인 SVG 마크업을 추가한다.
- 필요한 class와 `aria-hidden` 속성을 지정한다.
- `assets/motion.js`를 `script.js` 뒤에 로드한다.
- CSS와 JavaScript cache query version을 갱신한다.

### `styles.css`

- Hero scene, 3단계 SVG 레이어, gradient line, halo와 scroll cue 스타일을 정의한다.
- Research, Publications, Members 및 Join의 승인된 강조 스타일을 정의한다.
- 데스크톱 정밀 포인터, 모바일·태블릿, Reduce Motion 규칙을 분리한다.
- JavaScript가 없어도 기본 콘텐츠와 SVG가 보이는 상태를 기본값으로 둔다.

### `script.js`

- 콘텐츠 렌더링, 내비게이션, publication 검색·필터만 담당한다.
- 현재 포함된 reveal, count-up 및 motion 초기화 책임을 `assets/motion.js`로 이동한다.
- `content.js`를 사용하는 기존 렌더링 순서와 데이터 계산은 변경하지 않는다.

### `assets/motion.js`

다음의 독립적인 controller를 제공한다.

1. `reveal controller`: 최초 노출 대상과 제한된 stagger 관리
2. `count controller`: quick stats 최초 1회 count-up과 최종 값 복구
3. `hero parallax controller`: 포인터·스크롤 목표값, 단일 RAF 및 CSS 변수 관리
4. `motion lifecycle`: viewport, visibility, media query 변화에 따른 시작·중지·정리

전역으로 필요한 공개 진입점은 하나로 제한한다. `script.js` 렌더링이 완료된 뒤 로드된 `assets/motion.js`가 현재 DOM을 확인하고 초기화한다. 모듈을 `assets/` 아래에 두어 기존 Pages workflow의 재귀적 자산 복사 규칙을 그대로 사용한다.

## 10. 데이터 흐름

1. `content.js`가 기존 콘텐츠 배열을 제공한다.
2. `script.js`가 notices, stats, research, publications, members, contact를 렌더링하고 기존 이벤트를 연결한다.
3. 뒤이어 로드된 `assets/motion.js`가 기능 지원, 입력 장치 및 Reduce Motion 설정을 확인한다.
4. reveal controller가 초기 DOM 대상만 등록한다.
5. hero controller가 Hero가 viewport에 있을 때만 pointer와 scroll 목표값을 수집한다.
6. 단일 RAF가 보간값을 CSS 변수에 기록하고 CSS가 레이어 transform을 적용한다.
7. publication 검색·필터 결과는 모션 controller 재등록 없이 즉시 표시한다.

## 11. 실패 대응과 접근성

- JavaScript가 비활성화되거나 초기화가 실패해도 콘텐츠와 SVG는 정적 상태로 보인다.
- SVG 요소가 없거나 예상 class를 찾지 못하면 hero controller만 조용히 종료한다.
- `IntersectionObserver`, `matchMedia` 또는 정밀 포인터 조건을 만족하지 않으면 해당 기능만 비활성화한다.
- `prefers-reduced-motion: reduce`에서는 패럴랙스, reveal, line draw, count-up, hover 이동과 smooth scroll을 비활성화한다.
- 실행 중 Reduce Motion으로 변경하면 animation frame과 observer를 정리하고 즉시 최종 상태로 복구한다.
- 탭이 hidden 상태이거나 Hero가 viewport 밖이면 RAF를 중지한다.
- SVG는 `aria-hidden="true"`와 `focusable="false"`를 사용하며 키보드 focus를 받지 않는다.
- 기존 링크, 버튼, 검색창 및 모바일 메뉴의 접근성 이름과 focus 표시를 유지한다.

## 12. 성능 기준

- 외부 라이브러리, CDN, Canvas 및 런타임 데이터 요청을 추가하지 않는다.
- 새 네트워크 비용은 같은 origin의 정적 `assets/motion.js` 파일 1개로 제한하며 SVG는 HTML에 인라인한다.
- 애니메이션은 `transform`과 `opacity`만 사용한다.
- 포인터와 스크롤 입력은 하나의 RAF로 합친다.
- Hero가 보이지 않을 때 이벤트 계산과 RAF를 중지한다.
- SVG 노드 수와 path 수는 고정하며 런타임 생성하지 않는다.
- 데스크톱과 모바일에서 가로 overflow와 레이아웃 이동을 만들지 않는다.

## 13. 검증 계획

### 기능과 회귀

- Hero의 포인터 반응이 네 모서리와 중앙에서 제한 범위를 지키는지 확인한다.
- 스크롤 시 배경, grid와 SVG가 서로 다른 속도로 움직이고 텍스트는 고정되는지 확인한다.
- Hero를 벗어나면 RAF가 중지되고 다시 진입하면 정상 재개되는지 확인한다.
- publication All/Journals/Conferences/Patents 필터와 검색 결과가 즉시 표시되는지 확인한다.
- 모바일 메뉴, 활성 navigation, 외부 publication 링크, 이메일·전화 링크를 확인한다.
- 통계 최종값이 `51`, `11`, `34`, `4`인지 확인한다.

### 반응형과 입력 장치

- 데스크톱 `1440px`, `1024px`에서 pointer와 scroll 패럴랙스를 검증한다.
- 태블릿 `768px`과 모바일 `390px`에서 진입 후 움직임이 정지하는지 확인한다.
- 터치 환경에서 hover 상태가 고정되지 않는지 확인한다.
- 모든 기준 viewport에서 가로 overflow와 콘텐츠 겹침이 없는지 확인한다.

### 접근성과 실패 복구

- Reduce Motion에서 모든 콘텐츠와 최종 통계가 즉시 표시되는지 확인한다.
- 실행 중 Reduce Motion 전환 후 animation frame과 observer가 정리되는지 확인한다.
- 키보드로 내비게이션, 필터, 검색, 이메일 및 링크를 사용할 수 있는지 확인한다.
- Hero SVG를 제거하거나 Observer를 사용할 수 없는 조건에서도 콘텐츠가 보이는지 확인한다.
- 콘솔 오류와 접근성 트리의 불필요한 SVG 노출이 없는지 확인한다.

### 성능과 시각 품질

- 포인터와 스크롤 중 하나의 RAF만 동작하는지 확인한다.
- Hero가 보이지 않을 때 지속적인 animation frame이 없는지 확인한다.
- 애니메이션 중 layout shift와 눈에 띄는 프레임 저하가 없는지 확인한다.
- 이미지와 텍스트 대비, 카드 focus outline 및 링크 hover 상태를 확인한다.
- 기존 자산 외 외부 요청이 추가되지 않았는지 확인한다.

## 14. 구현 범위

변경 예정 파일:

- `index.html`
- `styles.css`
- `script.js`
- 새 `assets/motion.js`

변경하지 않을 파일:

- `content.js`
- `assets/lab-hero.png`
- publication과 member 데이터
- `.github/workflows/pages.yml`

실제 구현, 커밋, push와 배포는 별도의 사용자 요청이 있을 때만 수행한다.

## 15. 완료 기준

- 첫 화면이 이전보다 분명히 역동적이며 선택한 한 단계 강조형 범위를 유지한다.
- Hero 배경과 SVG만 반응하고 제목, 버튼과 공지는 안정적으로 고정된다.
- Hero 아래 섹션은 gradient line과 제한된 hover로 같은 시각 언어를 유지한다.
- 모바일은 진입 후 정지하고 Reduce Motion에서는 모든 이동 효과가 제거된다.
- 기존 데이터, publication 검색·필터, 내비게이션, 통계와 링크에 회귀가 없다.
- 외부 라이브러리나 CDN 없이 정적 GitHub Pages 구조로 동작한다.
- 기준 viewport와 접근성·성능 검증을 모두 통과한다.
