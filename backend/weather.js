// ===============================================
// 날씨 웹앱 - 백엔드 공통 로직
// 로컬 서버(backend/server.js)와 Vercel 함수(api/weather.js)가 함께 사용합니다.
// 외부 API: Open-Meteo (무료, API Key 필요 없음)
// ===============================================

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

// 도시 이름을 받아 { status, body } 형태로 결과를 돌려줍니다.
async function getWeatherForCity(rawCity) {
  const city = (rawCity || "").trim();
  if (!city) {
    return { status: 400, body: { error: "도시 이름을 입력해 주세요." } };
  }

  try {
    const place = await findCity(city);
    if (!place) {
      return { status: 404, body: { error: `'${city}' 도시를 찾을 수 없습니다.` } };
    }

    const current = await getCurrentWeather(place.latitude, place.longitude);
    const [description, icon] = WEATHER_CODES[current.weather_code] || ["알 수 없음", "❓"];

    return {
      status: 200,
      body: {
        city: place.name,
        country: place.country || "",
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        description,
        icon,
        time: current.time,
      },
    };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "날씨 정보를 가져오는 중 오류가 발생했습니다." } };
  }
}

module.exports = { getWeatherForCity };
