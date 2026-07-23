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

  const forecastItems = Array.isArray(items) ? items.slice(0, 7) : [];
  const cardsToRender = forecastItems.length < 7
    ? [...forecastItems, ...Array.from({ length: 7 - forecastItems.length }, () => ({ placeholder: true }))]
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
    document.getElementById("uvIndex").textContent = current.uv_index != null ? `${current.uv_index}` : "N/A";
    document.getElementById("cloudcover").textContent = `${current.cloudcover ?? "N/A"}%`;

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
