// ===============================================
// 날씨 웹앱 - 프론트엔드 스크립트
// 사용자가 입력한 도시 이름을 백엔드(/api/weather)로 보내고
// 받은 결과를 화면에 보여줍니다.
// ===============================================

const form = document.getElementById("weather-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const message = document.getElementById("message");
const result = document.getElementById("result");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // 페이지 새로고침 막기

  const city = cityInput.value.trim();
  if (!city) {
    showMessage("도시 이름을 입력해 주세요.");
    return;
  }

  showMessage("날씨 정보를 불러오는 중...", true);
  result.classList.add("hidden");
  searchButton.disabled = true;

  try {
    // 백엔드에 날씨 요청
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "날씨 정보를 가져오지 못했습니다.");
      return;
    }

    showWeather(data);
    showMessage("");
  } catch (error) {
    showMessage("서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해 주세요.");
  } finally {
    searchButton.disabled = false;
  }
});

function showMessage(text, isLoading = false) {
  message.textContent = text;
  message.classList.toggle("loading", isLoading);
}

function showWeather(data) {
  document.getElementById("city-name").textContent =
    data.country ? `${data.city}, ${data.country}` : data.city;
  document.getElementById("weather-icon").textContent = data.icon;
  document.getElementById("temperature").textContent = `${Math.round(data.temperature)}°C`;
  document.getElementById("description").textContent = data.description;
  document.getElementById("feels-like").textContent = `${Math.round(data.feelsLike)}°C`;
  document.getElementById("humidity").textContent = `${data.humidity}%`;
  document.getElementById("wind-speed").textContent = `${data.windSpeed} km/h`;
  document.getElementById("updated-time").textContent =
    `기준 시각(현지): ${data.time.replace("T", " ")}`;

  result.classList.remove("hidden");
}
