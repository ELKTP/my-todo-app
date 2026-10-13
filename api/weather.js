// ===============================================
// 날씨 웹앱 - Vercel 서버리스 함수
// Vercel에 배포하면 /api/weather?city=서울 주소로 호출됩니다.
// 실제 날씨 조회 로직은 backend/weather.js에 있습니다.
// ===============================================

const { getWeatherForCity } = require("../backend/weather");

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const { status, body } = await getWeatherForCity(url.searchParams.get("city"));

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
};
