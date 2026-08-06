let history = [];

const input = document.getElementById("city");
const dropdown = document.getElementById("dropdown");
const forecastWrapper = document.getElementById("forecast");
const hourlyForecastWrapper = document.getElementById("hourlyForecast");
const weatherIcon = document.getElementById("weatherIcon");
const conditionText = document.getElementById("conditionText");

function showSuggestions(list) {
  dropdown.innerHTML = "";

  if (list.length === 0) {
    hideDropdown();
    return;
  }

  list.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = item;
    div.className = "cursor-pointer px-4 py-2 text-sm text-slate-200 hover:bg-white/10";

    div.onclick = () => {
      input.value = item;
      hideDropdown();
      getWeather();
    };

    dropdown.appendChild(div);
  });

  dropdown.classList.remove("hidden");
}

function hideDropdown() {
  dropdown.classList.add("hidden");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en", { weekday: "short" });
}

function formatTime(value) {
  if (!value) return "--:--";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatHour(value) {
  if (!value) return "--";
  return new Date(value).toLocaleTimeString([], { hour: "numeric" });
}

function getWeatherDetails(code) {
  const map = {
    0: { label: "Clear sky", icon: "☀️" },
    1: { label: "Mainly clear", icon: "🌤️" },
    2: { label: "Partly cloudy", icon: "⛅" },
    3: { label: "Overcast", icon: "☁️" },
    45: { label: "Fog", icon: "🌫️" },
    48: { label: "Rime fog", icon: "🌫️" },
    51: { label: "Light drizzle", icon: "🌦️" },
    53: { label: "Drizzle", icon: "🌦️" },
    55: { label: "Heavy drizzle", icon: "🌧️" },
    61: { label: "Light rain", icon: "🌦️" },
    63: { label: "Rain", icon: "🌧️" },
    65: { label: "Heavy rain", icon: "⛈️" },
    71: { label: "Light snow", icon: "🌨️" },
    73: { label: "Snow", icon: "❄️" },
    75: { label: "Heavy snow", icon: "❄️" },
    95: { label: "Thunderstorm", icon: "⛈️" },
    96: { label: "Thunder with hail", icon: "⛈️" },
    99: { label: "Thunder with hail", icon: "⛈️" }
  };

  return map[code] || { label: "Cloudy", icon: "☁️" };
}

function buildHourlyForecastItems(data) {
  if (Array.isArray(data?.hourly_forecast) && data.hourly_forecast.length > 0) {
    return data.hourly_forecast;
  }

  const hourly = data?.hourly;
  if (!hourly || !Array.isArray(hourly.time)) {
    return [];
  }

  const times = hourly.time.slice(0, 12);
  const temperatures = hourly.temperature_2m || [];
  const codes = hourly.weathercode || [];
  const precip = hourly.precipitation_probability || [];
  const humidity = hourly.relativehumidity_2m || [];
  const pressure = hourly.pressure_msl || [];

  return times.map((time, index) => ({
    time,
    temperature: temperatures[index] ?? null,
    weathercode: codes[index] ?? null,
    precipitation_probability: precip[index] ?? null,
    humidity: humidity[index] ?? null,
    pressure: pressure[index] ?? null
  }));
}

function setForecastLayout() {
  if (!forecastWrapper) return;

  forecastWrapper.style.display = "grid";
  forecastWrapper.style.gridTemplateColumns = window.innerWidth < 640 ? "1fr" : "repeat(2, minmax(0, 1fr))";
  forecastWrapper.style.gap = "0.75rem";
  forecastWrapper.style.alignItems = "start";
  forecastWrapper.style.width = "100%";
  forecastWrapper.style.maxWidth = "100%";
}

function renderForecast(items) {
  forecastWrapper.innerHTML = "";
  setForecastLayout();

  const forecastItems = Array.isArray(items) ? items.slice(0, 8) : [];
  const cardsToRender = forecastItems.length < 8
    ? [...forecastItems, ...Array.from({ length: 8 - forecastItems.length }, () => ({ placeholder: true }))]
    : forecastItems;

  if (cardsToRender.length === 0) {
    forecastWrapper.innerHTML = '<div style="grid-column:1 / -1; min-width:0; border:1px solid rgba(255,255,255,0.1); border-radius:1rem; background:rgba(255,255,255,0.05); padding:1rem; color:#cbd5e1;">No forecast available yet.</div>';
    return;
  }

  cardsToRender.forEach((item) => {
    const isPlaceholder = Boolean(item.placeholder);
    const details = getWeatherDetails(isPlaceholder ? null : item.weathercode);
    const precipitation = item.precipitation_probability ?? item.precipitation_probability_mean ?? null;
    const precipText = precipitation != null ? `${Math.round(precipitation)}% precip` : "Mostly calm";
    const card = document.createElement("div");
    card.style.minWidth = "0";
    card.style.maxWidth = "100%";
    card.style.width = "100%";
    card.style.margin = "0";
    card.style.border = "1px solid rgba(255,255,255,0.12)";
    card.style.borderRadius = "1rem";
    card.style.background = "linear-gradient(135deg, rgba(255,255,255,0.14), rgba(15, 23, 42, 0.34))";
    card.style.padding = "1rem";
    card.style.minHeight = window.innerWidth < 640 ? "10.5rem" : "7.5rem";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "space-between";
    card.style.boxSizing = "border-box";
    card.style.boxShadow = "0 10px 30px -18px rgba(2, 6, 23, 0.75)";

    card.innerHTML = isPlaceholder
      ? `
        <div class="flex items-start justify-between gap-2">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">Upcoming</p>
          <span class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">--</span>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <div class="text-2xl">--</div>
          <div>
            <p class="text-[11px] font-medium text-slate-100">Waiting</p>
            <p class="text-[10px] text-slate-400">No data yet</p>
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between text-[11px] text-slate-200">
          <span>High --°</span>
          <span>Low --°</span>
        </div>
      `
      : `
        <div class="flex items-start justify-between gap-2">
          <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-200">${formatDate(item.date)}</p>
          <span class="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-slate-200">${details.icon}</span>
        </div>
        <div class="mt-2 flex items-center gap-2">
          <div class="text-2xl">${details.icon}</div>
          <div class="min-w-0">
            <p class="text-[11px] font-medium text-slate-100">${details.label}</p>
            <p class="text-[10px] text-slate-400">${precipText}</p>
          </div>
        </div>
        <div class="mt-2 flex items-center justify-between text-[11px] text-slate-200">
          <span>High ${Math.round(item.temperature_max)}°</span>
          <span>Low ${Math.round(item.temperature_min)}°</span>
        </div>
      `;

    forecastWrapper.appendChild(card);
  });
}

function renderHourlyForecast(items) {
  hourlyForecastWrapper.innerHTML = "";

  hourlyForecastWrapper.style.display = "flex";
  hourlyForecastWrapper.style.gap = "0.35rem";
  hourlyForecastWrapper.style.overflowX = "auto";
  hourlyForecastWrapper.style.paddingBottom = "0.2rem";
  hourlyForecastWrapper.style.scrollbarWidth = "none";
  hourlyForecastWrapper.style.msOverflowStyle = "none";

  if (!items || items.length === 0) {
    hourlyForecastWrapper.innerHTML = '<div style="min-width:10rem; border:1px solid rgba(255,255,255,0.1); border-radius:1rem; background:rgba(255,255,255,0.05); padding:1rem; color:#cbd5e1;">No hourly forecast yet.</div>';
    return;
  }

  items.forEach((item) => {
    const details = getWeatherDetails(item.weathercode);
    const card = document.createElement("div");
    card.style.minWidth = "7rem";
    card.style.maxWidth = "9rem";
    card.style.flexShrink = "0";
    card.style.border = "1px solid rgba(255,255,255,0.1)";
    card.style.borderRadius = "0.8rem";
    card.style.background = "rgba(255,255,255,0.05)";
    card.style.padding = "0.6rem";

    card.innerHTML = `
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-white">${formatHour(item.time)}</p>
      <div class="mt-1 text-2xl">${details.icon}</div>
      <p class="mt-1 text-[11px] text-slate-300">${details.label}</p>
      <p class="mt-1 text-xs text-slate-100">${Math.round(item.temperature)}°C</p>
    `;

    hourlyForecastWrapper.appendChild(card);
  });
}

function renderCloudBar(percent) {
  const container = document.getElementById("cloudBar");

  if (percent == null) {
    container.innerHTML = "";
    return;
  }

  const clamped = Math.max(0, Math.min(100, percent));

  container.innerHTML = `
    <div style="height: 8px; border-radius: 999px; background: rgba(255,255,255,0.1); overflow: hidden;">
      <div style="height: 100%; width: ${clamped}%; border-radius: 999px; background: linear-gradient(90deg, #38bdf8, #cbd5e1);"></div>
    </div>
  `;
}

function uvLabelForValue(uv) {
  if (uv == null) return "--";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

function degreesToCompass(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function renderWindCompass(deg) {
  const container = document.getElementById("windCompass");
  const label = document.getElementById("windDirLabel");

  if (deg == null) {
    container.innerHTML = "";
    label.textContent = "--";
    return;
  }

  container.innerHTML = `
    <svg width="70" height="70" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <text x="60" y="16" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)">N</text>
      <text x="108" y="64" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)">E</text>
      <text x="60" y="112" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)">S</text>
      <text x="12" y="64" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.5)">W</text>
      <g transform="rotate(${deg} 60 60)">
        <line x1="60" y1="60" x2="60" y2="24" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <polygon points="60,16 54,30 66,30" fill="#38bdf8"/>
        <line x1="60" y1="60" x2="60" y2="82" stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round"/>
      </g>
      <circle cx="60" cy="60" r="4" fill="white"/>
    </svg>
  `;

  label.textContent = `${degreesToCompass(deg)} · ${Math.round(deg)}°`;
}

function renderUvGauge(uv) {
  const container = document.getElementById("uvGauge");
  const label = document.getElementById("uvLabel");

  if (uv == null) {
    container.innerHTML = "";
    label.textContent = "--";
    return;
  }

  const maxUv = 11;
  const clamped = Math.min(uv, maxUv);
  const arcLength = 144.5;
  const offset = arcLength - (clamped / maxUv) * arcLength;

  container.innerHTML = `
    <svg width="70" height="53" viewBox="0 0 120 90">
      <path d="M14 74 A46 46 0 0 1 106 74" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="10" stroke-linecap="round"/>
      <path d="M14 74 A46 46 0 0 1 106 74" fill="none" stroke="url(#uvgrad)" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${arcLength}" stroke-dashoffset="${offset}"/>
      <defs>
        <linearGradient id="uvgrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4ade80"/>
          <stop offset="35%" stop-color="#facc15"/>
          <stop offset="65%" stop-color="#fb923c"/>
          <stop offset="100%" stop-color="#f43f5e"/>
        </linearGradient>
      </defs>
      <text x="60" y="58" text-anchor="middle" font-size="20" font-weight="600" fill="white">${uv.toFixed(1)}</text>
    </svg>
  `;

  label.textContent = uvLabelForValue(uv);
}

function scrollHourlyForecast(direction) {
  const panel = document.getElementById("hourlyForecast");
  if (!panel) return;

  panel.scrollBy({
    left: direction * panel.clientWidth * 0.9,
    behavior: "smooth"
  });
}

window.addEventListener("resize", setForecastLayout);

input.addEventListener("focus", function () {
  if (history.length > 0) {
    showSuggestions(history);
  }
});

input.addEventListener("input", function () {
  const value = this.value.toLowerCase();

  if (!value) {
    showSuggestions(history);
    return;
  }

  const filtered = history.filter((item) => item.toLowerCase().includes(value));
  showSuggestions(filtered);
});

document.addEventListener("click", function (e) {
  if (!input.contains(e.target) && !dropdown.contains(e.target)) {
    hideDropdown();
  }
});

// Render empty forecast placeholders before any search is performed.
setForecastLayout();
renderForecast([]);
renderHourlyForecast([]);

async function getWeather() {
  const city = document.getElementById("city").value.trim();

  if (!city) {
    alert("Enter a city name");
    return;
  }

  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("result").textContent = "Fetching live weather...";
  weatherIcon.textContent = "--";
  conditionText.textContent = "Loading...";

  const token = localStorage.getItem("access");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  try {
    const requestUrl = `${window.location.origin}/api/v1/weather/?city=${encodeURIComponent(city)}`;
    const response = await fetch(requestUrl, { headers, cache: "no-store" });
    const data = await response.json();

    document.getElementById("loading").classList.add("hidden");

    if (!response.ok) {
      document.getElementById("result").textContent = data.error || "Error";
      renderForecast([]);
      renderHourlyForecast([]);
      return;
    }

    const current = data.current || {};
    const details = getWeatherDetails(current.weathercode);

    document.getElementById("Cityname").textContent = data.city;
    document.getElementById("temp").textContent = `${Math.round(current.temperature)}°C`;
    document.getElementById("L").textContent = `Low ${Math.round(current.temperature_min ?? 0)}°`;
    document.getElementById("H").textContent = `High ${Math.round(current.temperature_max ?? 0)}°`;
    document.getElementById("sunrise").textContent = formatTime(current.sunrise);
    document.getElementById("sunset").textContent = formatTime(current.sunset);

    document.getElementById("wind").textContent = `${current.windspeed ?? "N/A"} m/s`;
    document.getElementById("gust").textContent = `${current.windgust ?? "N/A"} m/s`;
    document.getElementById("humidity").textContent = `${current.humidity ?? "N/A"}%`;
    document.getElementById("precipitation").textContent = `${current.precipitation_probability ?? "N/A"}%`;
    document.getElementById("pressure").textContent = `${current.pressure ?? "N/A"} hPa`;
    document.getElementById("visibility").textContent = current.visibility != null ? `${(current.visibility / 1000).toFixed(1)} km` : "N/A";
    document.getElementById("cloudcover").textContent = `${current.cloudcover ?? "N/A"}%`;
    renderCloudBar(current.cloudcover);
    renderWindCompass(current.wind_direction);
    renderUvGauge(current.uv_index);

    weatherIcon.textContent = details.icon;
    conditionText.textContent = details.label;
    document.getElementById("result").textContent = `${details.label} • feels like ${Math.round(current.temperature)}°C`;

    renderForecast(data.forecast || []);
    renderHourlyForecast(buildHourlyForecastItems(data));

    if (!history.includes(city)) {
      history.unshift(city);
      history = history.slice(0, 5);
    }

    hideDropdown();
  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("result").textContent = "Connection error ⚠️";
    renderForecast([]);
    renderHourlyForecast([]);
  }
}
