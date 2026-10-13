# 날씨 확인 웹앱

도시 이름을 입력하고 **날씨 확인** 버튼을 누르면 현재 날씨를 보여주는 웹앱입니다.

- 프론트엔드: HTML, CSS, JavaScript (프레임워크 없음)
- 백엔드: Node.js 기본 모듈만 사용 (npm 설치 필요 없음)
- 날씨 데이터: [Open-Meteo](https://open-meteo.com/) (무료, **API Key 필요 없음**)

## 폴더 구조

```
날씨실습/
├── backend/
│   └── server.js      ← 백엔드: 외부 날씨 API 호출 + 프론트엔드 파일 제공
├── frontend/
│   ├── index.html     ← 화면 구조
│   ├── style.css      ← 디자인
│   └── script.js      ← 버튼 클릭 → 백엔드에 요청 → 결과 표시
└── README.md
```

## 동작 흐름

```
[브라우저] --(도시 이름)--> [백엔드 /api/weather]
                               ├─ 1) Open-Meteo Geocoding API: 도시 이름 → 위도/경도
                               └─ 2) Open-Meteo Forecast API: 위도/경도 → 현재 날씨
[브라우저] <--(날씨 JSON)-- [백엔드]
```

## 실행 방법

1. **Node.js 설치 확인**
   터미널(PowerShell 또는 VS Code 터미널)에서 아래 명령을 입력합니다.
   ```
   node --version
   ```
   버전(예: `v20.x.x`)이 나오면 됩니다. 나오지 않으면 https://nodejs.org 에서 LTS 버전을 설치합니다. (Node.js 18 이상 필요)

2. **프로젝트 폴더로 이동**
   ```
   cd "날씨실습 폴더 경로"
   ```
   VS Code에서 이 폴더를 열고 `Ctrl + `` ` (터미널 열기)를 하면 바로 이 폴더에서 시작합니다.

3. **백엔드 서버 실행**
   ```
   node backend/server.js
   ```
   `날씨 앱 서버 실행 중: http://localhost:3000` 메시지가 나오면 성공입니다.

4. **브라우저에서 접속**
   주소창에 `http://localhost:3000` 을 입력합니다.

5. **날씨 확인**
   도시 이름(예: `서울`, `부산`, `Tokyo`, `London`)을 입력하고 **날씨 확인** 버튼을 누릅니다.

6. **서버 종료**
   서버를 실행한 터미널에서 `Ctrl + C` 를 누릅니다.

## 참고

- `frontend/index.html` 파일을 더블클릭해서 직접 열면 백엔드와 연결되지 않습니다. 반드시 서버를 실행한 뒤 `http://localhost:3000` 으로 접속하세요.
- 백엔드 API만 따로 확인하려면 브라우저에서 `http://localhost:3000/api/weather?city=서울` 에 접속하면 JSON 결과가 보입니다.
- `서울`, `대구`처럼 짧은 한국어 도시 이름은 Open-Meteo에 `서울특별시`, `대구광역시`로 등록되어 있어서, 백엔드가 이 이름들도 함께 검색한 뒤 가장 큰 도시를 고릅니다.
