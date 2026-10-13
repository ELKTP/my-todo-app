// ===============================================
// 날씨 웹앱 - 백엔드 서버
// Node.js 기본 모듈만 사용 (npm 설치 필요 없음)
// 외부 API: Open-Meteo (무료, API Key 필요 없음)
// ===============================================

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// 날씨 코드(WMO) → 한국어 설명 + 아이콘
const WEATHER_CODES = {
  0: ["맑음", "☀️"],
  1: ["대체로 맑음", "🌤️"],
  2: ["구름 조금", "⛅"],
  3: ["흐림", "☁️"],
  45: ["안개", "🌫️"],
  48: ["짙은 안개", "🌫️"],
  51: ["약한 이슬비", "🌦️"],
  53: ["이슬비", "🌦️"],
  55: ["강한 이슬비", "🌧️"],
  56: ["어는 이슬비", "🌧️"],
  57: ["강한 어는 이슬비", "🌧️"],
  61: ["약한 비", "🌦️"],
  63: ["비", "🌧️"],
  65: ["강한 비", "🌧️"],
  66: ["어는 비", "🌧️"],
  67: ["강한 어는 비", "🌧️"],
  71: ["약한 눈", "🌨️"],
  73: ["눈", "🌨️"],
  75: ["강한 눈", "❄️"],
  77: ["싸락눈", "🌨️"],
  80: ["약한 소나기", "🌦️"],
  81: ["소나기", "🌧️"],
  82: ["강한 소나기", "⛈️"],
  85: ["약한 눈보라", "🌨️"],
  86: ["강한 눈보라", "❄️"],
  95: ["뇌우", "⛈️"],
  96: ["우박을 동반한 뇌우", "⛈️"],
  99: ["강한 우박을 동반한 뇌우", "⛈️"],
};

// 정적 파일의 Content-Type
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

// JSON 응답을 보내는 도우미 함수
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

// 1단계: 도시 이름 → 위도/경도 (Open-Meteo Geocoding API)
async function searchCity(name) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(name)}&count=5&language=ko&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("도시 검색 API 호출 실패");
  const data = await response.json();
  return data.results || [];
}

// "서울", "대구" 같은 한국 대도시는 "서울특별시", "대구광역시"로 등록되어 있어서
// 한글 이름이면 행정구역 이름을 붙인 검색도 함께 하고,
// 그중 인구가 가장 많은 곳(= 가장 큰 도시)을 고릅니다.
async function findCity(city) {
  const names = /[가-힣]$/.test(city)
    ? [city, city + "특별시", city + "광역시", city + "시"]
    : [city];

  const resultLists = await Promise.all(names.map(searchCity));
  const places = resultLists.flat();
  if (places.length === 0) return null;

  return places.reduce((best, place) =>
    (place.population || 0) > (best.population || 0) ? place : best
  );
}

// 2단계: 위도/경도 → 현재 날씨 (Open-Meteo Forecast API)
async function getCurrentWeather(latitude, longitude) {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
    "&timezone=auto";
  const response = await fetch(url);
  if (!response.ok) throw new Error("날씨 API 호출 실패");
  const data = await response.json();
  return data.current;
}

// /api/weather?city=서울 요청 처리
async function handleWeatherApi(req, res, url) {
  const city = (url.searchParams.get("city") || "").trim();
  if (!city) {
    return sendJson(res, 400, { error: "도시 이름을 입력해 주세요." });
  }

  try {
    const place = await findCity(city);
    if (!place) {
      return sendJson(res, 404, { error: `'${city}' 도시를 찾을 수 없습니다.` });
    }

    const current = await getCurrentWeather(place.latitude, place.longitude);
    const [description, icon] = WEATHER_CODES[current.weather_code] || ["알 수 없음", "❓"];

    sendJson(res, 200, {
      city: place.name,
      country: place.country || "",
      temperature: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      description,
      icon,
      time: current.time,
    });
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "날씨 정보를 가져오는 중 오류가 발생했습니다." });
  }
}

// 프론트엔드 파일(index.html, style.css, script.js) 제공
function serveStaticFile(res, pathname) {
  const fileName = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.join(FRONTEND_DIR, fileName);

  // frontend 폴더 밖의 파일은 읽지 못하도록 막기
  if (!filePath.startsWith(FRONTEND_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("파일을 찾을 수 없습니다.");
    }
    const contentType = MIME_TYPES[path.extname(filePath)] || "text/plain; charset=utf-8";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/weather") {
    handleWeatherApi(req, res, url);
  } else {
    serveStaticFile(res, url.pathname);
  }
});

server.listen(PORT, () => {
  console.log(`날씨 앱 서버 실행 중: http://localhost:${PORT}`);
});
