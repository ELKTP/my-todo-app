// ===============================================
// 날씨 웹앱 - 로컬 실행용 백엔드 서버
// Node.js 기본 모듈만 사용 (npm 설치 필요 없음)
// 실행: node backend/server.js → http://localhost:3000
// (Vercel 배포 시에는 이 파일 대신 api/weather.js가 사용됩니다.)
// ===============================================

const http = require("http");
const fs = require("fs");
const path = require("path");
const { getWeatherForCity } = require("./weather");

const PORT = 3000;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// 정적 파일의 Content-Type
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
};

// /api/weather?city=서울 요청 처리
async function handleWeatherApi(res, url) {
  const { status, body } = await getWeatherForCity(url.searchParams.get("city"));
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
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
    handleWeatherApi(res, url);
  } else {
    serveStaticFile(res, url.pathname);
  }
});

server.listen(PORT, () => {
  console.log(`날씨 앱 서버 실행 중: http://localhost:${PORT}`);
});
