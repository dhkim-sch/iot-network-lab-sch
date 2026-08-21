# 홈페이지 체크포인트 장면 전환 및 카드 상호작용 설계

> 상태: 디자인 최종 승인 완료. 이 문서는 설계만 정의하며 홈페이지 코드나 배포본을 변경하지 않는다.

## 1. 배경과 목적

현재 홈페이지는 Hero의 SVG 네트워크와 포인터·스크롤 패럴랙스, 최초 reveal, 통계 count-up, 카드 hover, 그리고 Hero부터 Contact까지 이어지는 연결형 스크롤 Journey를 제공한다. 페이지의 구조와 이동 흐름은 충분히 동적이지만, 각 본문 섹션의 배경 분위기와 카드의 직접 반응은 비교적 정적이어서 Journey가 활성화된 순간에도 콘텐츠 장면이 함께 살아나는 느낌은 제한적이다.

이번 개선의 목적은 기존 Journey 체크포인트를 장면 전환 신호로 재사용해 섹션별 배경·광원 분위기를 만들고, 주요 카드에 정밀 포인터 기반의 spotlight와 약한 3D 반응을 더하는 것이다. 효과 강도는 중간 수준으로 제한해 체감 변화는 분명하게 만들되 학술 홈페이지의 정보 신뢰성, 가독성, 접근성과 성능을 유지한다.

이 문서는 2026-08-20-interactive-homepage-enhancement-design.md와 2026-08-21-connected-scroll-journey-design.md의 후속 설계다. 이전 문서에서 승인된 정보 구조, Hero 모션, Journey 경로, 데이터, 접근성 및 폴백 결정은 유지한다.

## 2. 승인된 결정

- 개선 범위: 섹션 장면 전환과 카드 상호작용을 함께 강화
- 효과 강도: A안, 중간 강도
- 구현 접근법: A안, 체크포인트 기반 장면 시스템
- 장면 신호: 기존 Journey의 활성 체크포인트와 화면 높이 58% 기준선 재사용
- 장면 순서: About → Research → Publications → Members → Join → Contact
- 장면 전환: 약 600~750ms, blue–cyan 계열 안에서 배경 gradient·halo·네트워크 광량 변경
- 카드 범위: Research, Lab Profile, Professor, Current Members, Contact와 Join CTA
- Publications 처리: 제목·필터 영역만 장면에 반응하고 긴 목록에는 새 spotlight·tilt를 적용하지 않음
- 입력 정책: 정밀 포인터 환경에만 카드 spotlight·tilt 적용
- 모바일 정책: 낮은 강도의 장면 색상은 유지하고 포인터 추적과 tilt는 제거
- Reduce Motion: 이동·추적·테두리 진행을 제거하고 정적인 색상과 광원만 제공
- 구현 제약: 외부 라이브러리, Canvas, WebGL, 섹션 pinning, 스크롤 가로채기 및 콘텐츠 데이터 변경 없음

## 3. 목표와 비목표

### 목표

- 활성 섹션이 바뀔 때 페이지의 배경 분위기도 함께 변하도록 한다.
- 기존 Journey 경로와 장면 광원이 하나의 시각 언어로 작동하도록 한다.
- Research와 주요 정보 카드가 포인터에 반응해 깊이와 탐색성을 제공하도록 한다.
- Publications의 긴 읽기 구간은 차분한 정보 영역으로 보존한다.
- 장면 변화와 카드 효과가 기존 메뉴, 필터, 검색, 링크와 충돌하지 않게 한다.
- 데스크톱, 태블릿, 모바일, 키보드, Reduce Motion과 기능 미지원 환경에서 안정적으로 저하한다.
- 상시 애니메이션 없이 활성 상태 변화와 직접 상호작용에만 비용을 사용한다.

### 비목표

- Hero 이미지, 문구, 공지, 통계 또는 정보 구조 변경
- 섹션 순서나 높이를 바꾸는 sticky scene 또는 pinning
- 부드러운 스크롤을 가로채거나 자동으로 다음 섹션으로 이동하는 동작
- Publications 개별 행의 3D 반응이나 반복 reveal
- 모든 카드에 동일한 강도의 효과 적용
- 모바일에서 데스크톱 포인터 효과를 흉내 내는 자이로 또는 터치 추적
- 지속적으로 움직이는 파티클, Canvas, WebGL 또는 외부 모션 라이브러리
- 이번 디자인 단계에서 홈페이지 기능 구현 또는 배포

## 4. 검토한 접근법

### A. 체크포인트 기반 장면 시스템 — 선택

기존 Journey가 계산하는 활성 체크포인트를 장면 컨트롤러에 전달한다. 활성 ID가 바뀔 때만 공용 배경 레이어의 위치, 색상, 광량과 네트워크 상태를 갱신한다. 주요 카드에는 별도의 정밀 포인터 컨트롤러를 적용한다.

기존 구조를 재사용할 수 있고 상시 스크롤 보간이 필요하지 않아 역동성, 성능, 접근성과 유지보수의 균형이 가장 좋다.

### B. 연속형 스크롤 보간

스크롤 진행률로 섹션 사이의 색상, 광원, 경로 밝기와 카드 깊이를 연속 보간한다. 가장 부드럽고 몰입감이 높지만 스크롤마다 더 많은 상태 기록이 필요하고 기존 Journey 진행 계산과 책임이 겹친다. Reduce Motion과 실패 폴백도 복잡해진다.

### C. 시네마틱 고정 장면

일부 섹션을 잠시 고정하고 카드가 순차적으로 확대·교차 등장하도록 한다. 시각적 변화는 가장 크지만 읽기 흐름과 섹션 높이가 바뀌며 Publications와 모바일 경험에 부담이 크다.

## 5. 전체 장면 경험

### 5.1 활성 기준

기존 Journey와 동일하게 viewport 높이의 58% 지점을 활성 기준선으로 사용한다. 기준선과 가장 가까운 체크포인트가 바뀔 때 main의 장면 상태와 공용 ambient 레이어를 갱신한다.

장면 상태는 연속적인 스크롤 값이 아니라 현재 checkpoint ID를 기준으로 한다. 위로 되돌아갈 때도 동일한 순서로 이전 장면이 복원된다.

Hero에 머무는 동안에는 ambient 레이어를 숨긴 중립 상태로 두고 About이 활성화될 때 첫 장면을 시작한다. Contact 이후에는 Contact의 안정된 최종 장면을 유지한다. 깊은 위치에서 페이지를 새로 열어도 최초 geometry 계산 후 현재 checkpoint 장면을 바로 적용한다. 최초 배치는 먼 위치에서 이동해 오는 애니메이션 없이 좌표를 먼저 기록한 뒤 ready 상태만 표시한다.

### 5.2 장면 레이어

main 내부에 장식용 ambient 레이어 하나를 둔다. 레이어는 다음 요소로 구성한다.

- blue–cyan radial halo
- 낮은 불투명도의 격자 또는 파동
- 제한된 수의 SVG 연결선과 노드

레이어는 활성 장면별로 계산한 scene bounds 안에서 외곽 안전 영역에 위치하며 제목, 본문, 카드, 필터와 링크 위를 직접 지나지 않는다. 일반 장면의 bounds는 해당 section을 기준으로 한다. Publications는 제목부터 filter controls 아래까지만, Members는 제목부터 Professor·Current Members 묶음 아래까지만 사용한다. 활성 ID가 바뀌면 위치, scale, 색상, opacity와 네트워크 밀도 상태가 약 600~750ms 동안 전환된다.

동일한 scene ID에서 resize나 publication 필터·검색으로 geometry만 다시 계산된 경우에는 장면 진입 전환을 재생하지 않는다. 레이어 좌표만 즉시 또는 최대 160ms의 짧은 정렬 전환으로 보정해 페이지를 가로지르는 장거리 이동을 방지한다.

레이어는 pointer-events: none이고 접근성 트리에서 제외한다. 콘텐츠 배경보다 위, 모든 실제 콘텐츠와 Journey 경로·노드보다 아래에 배치한다.

### 5.3 Journey 연동

활성 장면에서는 현재 Journey 노드와 완료 경로의 광량을 소폭 높인다. 새로운 경로를 Journey 위에 중복해서 그리지 않고, ambient 네트워크는 배경 깊이를 보조하는 역할만 한다.

장면 전환은 Journey의 진행률이나 카드 reveal을 다시 실행하지 않는다. Journey 경로, 최초 reveal, 장면 상태와 포인터 카드는 각각 독립된 책임을 유지한다.

## 6. 섹션별 연출

### About

- 왼쪽 Journey 노드에서 부드러운 청색 halo가 퍼진다.
- Lab Profile 뒤에 낮은 불투명도의 원형 파동을 배치한다.
- 소개 본문에는 이동이나 왜곡을 추가하지 않는다.

### Research

- 광원이 오른쪽으로 이동한다.
- ambient 네트워크의 선과 노드 밀도를 가장 분명하게 표시한다.
- 네트워크 선은 4개 연구 카드 뒤의 빈 공간을 느슨하게 연결하되 카드 텍스트 위를 지나지 않는다.

### Publications

- 전체 장면 중 광량과 네트워크 밀도를 가장 낮게 유지한다.
- 제목과 필터 영역 뒤에 넓고 얕은 수평 광원을 둔다.
- scene bounds의 아래쪽을 publication controls 하단에서 최대 36px 이내로 제한하고 그 지점에서 opacity를 흐리게 끝낸다.
- publication list와 개별 publication item 배경에는 새 장식 레이어를 적용하지 않는다.

### Members

- 오른쪽 체크포인트에서 여러 개의 작은 halo가 카드 묶음 방향으로 퍼진다.
- Professor와 Current Members를 하나의 cluster로 보이게 하되 개별 인물의 강조 순위는 바꾸지 않는다.
- scene bounds는 Professor와 Current Members 묶음의 더 낮은 하단에서 최대 36px 이내로 끝낸다.
- Alumni와 과거 구성원 목록은 기존 정적 표현을 유지한다.

### Join

- 왼쪽에서 blue–cyan gradient가 대각선으로 들어온다.
- 기존 어두운 Join 배경 안에서 CTA 주변의 광량을 한 단계 높인다.
- 버튼 위치를 이동시키는 magnetic 효과는 사용하지 않는다.

### Contact

- 배경 연결선과 광원이 오른쪽의 마지막 Journey 노드로 수렴한다.
- Contact 카드가 나타난 뒤 장면 광량이 안정된 상태로 남아 여정의 끝을 표현한다.
- 반복 pulse나 무한 반복 애니메이션은 사용하지 않는다.

## 7. 카드 상호작용

### 7.1 적용 대상과 강도

Research 카드는 가장 분명한 반응을 제공한다.

- 포인터를 중심으로 이동하는 radial spotlight
- rotateX와 rotateY 각각 최대 약 2도
- 최대 4px의 상승 효과
- 활성 시 border glow와 card index의 짧은 강조

다음 정보 카드는 더 약한 반응을 사용한다.

- lab-profile
- professor-card
- current-members-grid 내부의 person-card
- contact-block

이 그룹은 최대 약 1.2도의 tilt와 낮은 강도의 spotlight·border glow를 사용한다. 정보 밀도가 높은 카드의 텍스트와 링크는 이동하지 않고 카드 표면 전체만 변형한다.

Join CTA는 tilt를 사용하지 않는다. 포인터 또는 키보드 focus 시 gradient와 halo만 강화한다.

현재 target 카드에 이미 적용된 hover 상승 효과는 별도의 transform 선언으로 중첩하지 않는다. 기존 상승량을 card lift CSS 변수로 옮기고 perspective, rotateX, rotateY와 translateY를 하나의 합성 transform으로 기록해 hover 규칙과 tilt 규칙이 서로 덮어쓰지 않게 한다.

### 7.2 포인터 수명주기

정밀 포인터가 카드에 진입할 때 해당 카드의 경계를 한 번 측정한다. pointermove는 정규화된 x·y 목표값만 저장하고 예약된 animation frame이 CSS 변수를 한 번 갱신한다.

한 시점에는 포인터가 올라간 카드 하나만 활성화한다. 포인터가 나가거나 카드가 viewport 밖으로 이동하면 목표값을 중앙으로 되돌리고 약 200ms 안에 정적 상태로 복귀한다.

스크롤 중에는 카드별 getBoundingClientRect를 반복 호출하지 않는다. viewport 크기나 스크롤 변화는 cached bounds를 dirty 상태로만 표시하고, 다음 pointermove가 실제로 발생할 때 한 번 다시 측정한다. 새로운 pointerenter에서도 경계를 새로 측정한다.

### 7.3 Publications와 기존 hover

publication item에는 spotlight, tilt, border 추적을 적용하지 않는다. 기존 3px 수평 hover와 차분한 배경 강조를 유지한다.

필터 버튼은 선택 상태의 gradient와 shadow 전환을 조금 더 선명하게 만들 수 있지만 위치를 이동시키지 않는다. 검색 입력창의 입력, focus와 결과 갱신 동작은 변경하지 않는다.

### 7.4 키보드

Research 카드 자체는 현재 직접 focus 대상이 아니므로 강제로 tabindex를 추가하지 않는다. 카드 내부의 기존 링크나 버튼에 focus가 들어오는 대상은 focus-within으로 고정된 border glow와 shadow만 제공한다.

기존 focus-visible outline을 제거하거나 glow로 대체하지 않는다.

## 8. 반응형과 접근성

### 데스크톱 정밀 포인터

- min-width: 821px에서는 포인터 종류와 관계없이 전체 장면 전환을 활성화한다.
- 카드 spotlight·tilt는 hover: hover, pointer: fine 조건을 추가로 만족할 때만 활성화한다.
- 기존 Hero 포인터 컨트롤러와 Card 컨트롤러는 서로의 CSS 변수나 listener를 공유하지 않는다.
- 1024px와 1440px에서 ambient 레이어가 콘텐츠 외곽 안전 영역을 유지하도록 좌표를 계산한다.

### 태블릿과 모바일

- 장면별 blue–cyan 색상과 낮은 강도의 halo는 유지한다.
- 공용 레이어의 이동 거리와 opacity를 줄이고 ambient SVG 연결선 밀도를 낮춘다.
- 카드 tilt, 포인터 spotlight, border 이동 효과와 카드 전용 animation frame을 실행하지 않는다.
- 기존 모바일 Journey 노드와 최대 8px fade-up을 유지한다.
- 터치 hover가 고착되지 않도록 hover 전용 스타일을 정밀 포인터 media query 안에 둔다.

### Reduce Motion

- 최초 로드부터 Reduce Motion인 경우 공용 ambient 레이어의 이동과 전환을 실행하지 않는다.
- 각 섹션은 기존 배경 또는 CSS로 정의한 낮은 강도의 정적 색상·광원만 표시한다.
- 카드 tilt, 포인터 추적, spotlight 이동, border 이동, Journey pulse, count-up, Hero 패럴랙스와 smooth scroll을 실행하지 않는다.
- 실행 중 Reduce Motion으로 변경되면 Scene과 Card 컨트롤러를 destroy하고 모든 임시 class, CSS 변수, listener와 frame을 정리한다.

장식 레이어와 SVG는 aria-hidden="true", focusable="false", pointer-events: none을 사용한다. DOM 순서, heading 구조, 링크 이름과 focus 순서는 변경하지 않는다.

## 9. 기술 구조

### 9.1 index.html

- main 내부에 scene-ambient 장식 레이어를 하나 추가한다.
- 레이어 안에 halo, grid 또는 wave, 제한된 path와 node를 포함한다.
- 기존 data-journey-checkpoint와 section ID를 장면 식별자로 재사용한다.
- 새 장식은 기본적으로 숨기고 Scene 컨트롤러 초기화가 성공한 경우에만 ready 상태로 표시한다.
- styles.css와 assets/motion.js의 cache query version을 갱신한다.

### 9.2 styles.css

- scene-ambient의 layer, position, size, opacity, scale, color와 ready 상태를 정의한다.
- main의 active scene 상태에 따라 사용하는 scene CSS 변수를 정의한다.
- 실제 콘텐츠가 ambient 레이어 위에 유지되도록 stacking context를 명시한다.
- card-interactive, card-active, spotlight, tilt, lift, border glow와 복귀 transition을 정의한다.
- 기존 카드 hover의 translateY를 card lift 변수로 통합하고 tilt와 하나의 transform 식에서 합성한다.
- Research 카드와 정보 카드 그룹의 강도를 분리한다.
- focus-within, 정밀 포인터, 모바일과 prefers-reduced-motion 규칙을 분리한다.
- JavaScript가 실패하거나 ready class가 없으면 장면 레이어는 숨고 카드가 기존 hover 상태로 보이게 한다.

### 9.3 assets/motion.js

기존 모션 초기화 구조에 다음 책임을 추가한다.

1. Scene controller
   - ambient 레이어와 checkpoint section을 수집한다.
   - active checkpoint ID와 geometry snapshot을 입력받는다.
   - 활성 장면의 scene bounds, 크기와 side를 scene CSS 변수로 기록한다.
   - Publications bounds는 heading 상단부터 publication controls 하단 36px 이내에서 끝낸다.
   - Members bounds는 heading 상단부터 Professor·Current Members 묶음 하단 36px 이내에서 끝낸다.
   - scene ID가 바뀔 때 ready·active 상태를 갱신한다.
   - 최초 배치는 transition 없이 수행하고 동일 ID의 geometry 갱신에는 장면 진입 전환을 재생하지 않는다.
   - resize, visibility, Reduce Motion과 destroy를 관리한다.

2. Journey callback
   - createJourneyController가 onActiveChange와 onGeometryChange callback을 선택적으로 받도록 확장한다.
   - 기존 active ID가 실제로 바뀐 경우에만 onActiveChange를 호출한다.
   - publication 필터·검색이나 resize로 geometry가 다시 계산되면 최신 snapshot을 Scene controller에 전달한다.
   - Journey가 Scene DOM이나 CSS 변수를 직접 수정하지 않는다.

3. Card controller
   - research-card, lab-profile, professor-card, current member person-card와 contact-block을 수집한다.
   - 정밀 포인터와 Reduce Motion 조건을 확인한 뒤 listener를 등록한다.
   - active card 하나, cached bounds 하나와 animation frame 하나만 유지한다.
   - scroll과 resize에서는 bounds dirty flag만 기록하고 다음 포인터 입력에서 필요할 때 한 번 다시 측정한다.
   - pointerleave, viewport 이탈, document hidden, media query 변경과 destroy 시 모든 변수를 복구한다.

Join CTA의 gradient·halo 강조는 CSS hover와 focus-visible로 처리하며 Card controller의 tilt 대상에는 포함하지 않는다.

4. Motion lifecycle
   - Scene, Card, Journey와 Hero 컨트롤러를 최상위 initializer가 소유한다.
   - 실행 중 Reduce Motion 전환 시 모든 컨트롤러를 안전한 정적 상태로 전환한다.
   - 한 컨트롤러의 초기화 실패가 다른 컨트롤러와 콘텐츠 렌더링을 막지 않도록 경계를 둔다.

### 9.4 변경하지 않는 파일

- content.js
- script.js
- assets/lab-hero.png
- publication, patent, member, research 및 contact 데이터
- .github/workflows/pages.yml

콘텐츠는 현재와 같이 content.js, script.js 순서로 렌더링되고 assets/motion.js가 뒤에서 초기화되므로 동적으로 생성된 카드도 초기 수집 시점에 존재한다.

## 10. 데이터 흐름

### 장면

1. script.js가 콘텐츠를 렌더링한다.
2. assets/motion.js가 Scene controller를 만들고 ambient 레이어를 확인한다.
3. Journey controller가 checkpoint geometry를 계산한다.
4. Journey가 현재 active checkpoint ID와 geometry snapshot을 Scene controller에 전달한다.
5. Scene controller가 해당 ID의 scene bounds를 계산하고 main의 scene 상태와 ambient CSS 변수를 갱신한다.
6. 역방향 스크롤에서는 승인된 장면 전환을 재생하고, 동일 ID의 geometry 재계산에서는 진입 효과 없이 위치만 동기화한다.

### 카드

1. Card controller가 허용된 selector와 정밀 포인터 조건을 확인한다.
2. pointerenter에서 카드 경계를 측정하고 active card를 저장한다.
3. pointermove에서 목표 x·y만 계산한다.
4. 예약된 한 frame이 tilt, spotlight와 lift CSS 변수를 기록한다.
5. pointerleave, viewport 이탈 또는 document hidden에서 frame을 취소하고 중앙값으로 복귀한다.

## 11. 성능 정책

- 장면 상태는 active checkpoint 변경 또는 geometry invalidation 때만 갱신한다.
- 스크롤마다 색상이나 위치를 연속 보간하지 않는다.
- Scene과 Card가 상시 반복 animation frame을 만들지 않는다.
- Card는 한 시점에 frame 하나와 cached bounds 하나만 사용한다.
- 큰 blur filter나 화면 전체를 덮는 고비용 backdrop-filter를 사용하지 않는다.
- 애니메이션 속성은 transform, opacity, shadow 강도와 소수의 CSS 변수로 제한한다.
- ambient SVG path와 node 수는 HTML에 고정하며 런타임에 요소를 계속 생성하지 않는다.
- document hidden, Reduce Motion 또는 정밀 포인터 미지원 상태에서는 관련 frame과 listener를 비활성화한다.
- 새 외부 요청, CDN 또는 애니메이션 라이브러리를 추가하지 않는다.

## 12. 실패 대응

- ambient 레이어 누락: Scene controller만 종료하고 Journey와 카드 hover는 유지한다.
- 특정 checkpoint 또는 section 누락: 해당 장면을 건너뛰고 ambient 레이어를 안전한 기본 상태로 둔다.
- Scene geometry 오류: ready 상태를 제거하고 기존 섹션 배경을 표시한다.
- IntersectionObserver 미지원: 카드 viewport 최적화와 동적 장면을 비활성화하고 기존 정적 페이지를 유지한다.
- ResizeObserver 미지원: 기존 Journey 정책에 따라 동적 경로를 숨기고 Scene은 활성 ID 변경 시점의 단순 상태만 사용하거나 안전하게 종료한다.
- 정밀 포인터 미지원: Card controller를 시작하지 않는다.
- 실행 중 controller 오류: 해당 controller의 임시 class, CSS 변수, listener와 frame을 정리하고 다른 기능은 유지한다.
- assets/motion.js 로드 실패: scene-ambient는 기본 숨김 상태이고 콘텐츠, 통계, 메뉴, 검색, 필터와 링크는 그대로 동작한다.

## 13. 검증 계획

### 장면과 Journey

- About, Research, Publications, Members, Join, Contact 순서로 scene ID가 전환되는지 확인한다.
- 아래와 위 방향 스크롤에서 장면과 Journey 활성 노드가 동일한 checkpoint를 가리키는지 확인한다.
- 전환 중 중간 장면이 깜빡이거나 두 장면이 동시에 활성화되지 않는지 확인한다.
- ambient 레이어가 제목, 본문, 카드, 필터와 링크의 가독성을 침해하지 않는지 확인한다.
- Publications 제목·필터만 반응하고 긴 목록은 정적인지 확인한다.
- Publications ambient가 controls 하단 36px 이내에서 흐려지고 목록 위로 이어지지 않는지 확인한다.
- Members ambient가 현재 구성원 묶음 아래에서 흐려지고 Alumni 영역 위로 이어지지 않는지 확인한다.
- Contact에서 장면이 반복 pulse 없이 안정된 상태로 끝나는지 확인한다.
- 깊은 위치에서 새로고침했을 때 ambient가 페이지를 가로질러 이동하지 않고 현재 장면에 바로 배치되는지 확인한다.

### 카드

- Research 카드의 네 모서리와 중앙에서 spotlight와 tilt 방향이 자연스러운지 확인한다.
- Research 카드가 약 2도와 4px 범위를 넘지 않는지 확인한다.
- 정보 카드 그룹이 더 낮은 약 1.2도 범위를 사용하는지 확인한다.
- 카드 사이를 빠르게 이동해도 이전 카드의 CSS 변수가 남지 않는지 확인한다.
- 기존 hover lift와 새 tilt가 transform을 덮어쓰지 않고 하나의 합성 값으로 적용되는지 확인한다.
- pointerleave와 viewport 이탈 후 약 200ms 안에 정적 상태로 돌아오는지 확인한다.
- Join CTA가 위치 이동 없이 gradient와 halo만 강화되는지 확인한다.
- publication item에 새 spotlight와 tilt가 적용되지 않는지 확인한다.

### 반응형과 접근성

- 1440px와 1024px에서 장면 레이어가 외곽 안전 영역과 콘텐츠 계층을 지키는지 확인한다.
- 768px와 390px에서 카드 tilt·포인터 listener가 없고 약한 장면만 표시되는지 확인한다.
- 모든 기준 viewport에서 가로 overflow와 layout shift가 없는지 확인한다.
- 키보드 focus 순서와 focus-visible outline이 기존과 동일한지 확인한다.
- focus-within glow가 focus outline을 가리지 않는지 확인한다.
- 초기 Reduce Motion과 실행 중 Reduce Motion 전환 후 이동·추적 효과가 모두 제거되는지 확인한다.
- 장식 SVG가 접근성 트리에 나타나지 않는지 확인한다.
- WCAG A/AA 자동 검사와 키보드 수동 검사를 수행한다.

### 기존 기능 회귀

- 통계 최종값이 Journals 51, Conferences 11, Patents 34, Research Tracks 4인지 확인한다.
- Publications의 All, Journals, Conferences, Patents 필터와 검색을 확인한다.
- 필터·검색으로 목록 높이가 바뀐 뒤 Journey와 Members 이후 장면 위치가 재정렬되는지 확인한다.
- 모바일 메뉴, active navigation, Hero 모션, 최초 reveal과 count-up을 확인한다.
- 이메일, 전화, publication과 CTA 링크를 확인한다.

### 실패와 성능

- ambient 레이어, checkpoint와 Observer를 각각 제거한 조건에서 콘텐츠가 숨지 않는지 확인한다.
- motion 파일 실패 시 메뉴, 검색, 필터와 링크가 정상인지 확인한다.
- 스크롤 중 Card controller가 반복 layout 측정을 하지 않는지 확인한다.
- active scene 변경이 없을 때 Scene controller가 style을 반복 기록하지 않는지 확인한다.
- Card controller가 동시에 하나보다 많은 frame을 예약하지 않는지 확인한다.
- document hidden과 viewport 이탈 시 예정된 frame이 취소되는지 확인한다.
- 콘솔 오류와 새 외부 네트워크 요청이 없는지 확인한다.

## 14. 구현 범위

변경 예정 파일:

- index.html
- styles.css
- assets/motion.js

문서 외의 파일은 이 설계 단계에서 변경하지 않는다.

## 15. 완료 기준

- 활성 Journey checkpoint와 장면 상태가 항상 일치한다.
- 모든 섹션 장면이 승인된 중간 강도와 순서로 전환된다.
- 주요 카드가 승인된 범위 안에서 spotlight·tilt·glow에 반응한다.
- Publications 목록과 기존 읽기 흐름은 차분하게 유지된다.
- 모바일, 키보드와 Reduce Motion에서 승인된 대체 동작을 제공한다.
- 콘텐츠 데이터, 기존 기능, 접근성 및 성능 회귀가 없다.
- JavaScript 또는 관련 API 실패 시 핵심 콘텐츠와 기능을 계속 사용할 수 있다.
