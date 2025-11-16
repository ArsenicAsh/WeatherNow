// WeatherNow - script.js
// Needs OPENWEATHER_API_KEY from config.js (see README)

// Safety check: API key present
if (typeof OPENWEATHER_API_KEY === 'undefined' || !OPENWEATHER_API_KEY) {
  console.warn('OPENWEATHER_API_KEY not found. Create config.js from config.example.js and add your key.');
}

const elements = {
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),
  result: document.getElementById('result'),
  cityName: document.getElementById('cityName'),
  localTime: document.getElementById('localTime'),
  temp: document.getElementById('temp'),
  desc: document.getElementById('desc'),
  feels: document.getElementById('feels'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  error: document.getElementById('error'),
  useLast: document.getElementById('useLast'),
};

const API_KEY = "53e86d19adc46235eabb7df5053dda0b";

function showError(msg) {
  elements.error.textContent = msg;
  elements.error.classList.remove('hidden');
  elements.result.classList.add('hidden');
}

function hideError() {
  elements.error.classList.add('hidden');
}

// Build the OpenWeather current weather URL (by city name)
function buildUrl(city) {
  const encoded = encodeURIComponent(city);
  // metric units for Celsius
  return `https://api.openweathermap.org/data/2.5/weather?q=${encoded}&units=metric&appid=${API_KEY}`;
}

async function fetchWeather(city) {
  if (!API_KEY) {
    showError('API key missing. See README to add OPENWEATHER_API_KEY.');
    return;
  }

  hideError();
  elements.searchBtn.disabled = true;
  elements.searchBtn.textContent = 'Searching...';

  try {
    const url = buildUrl(city);
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) throw new Error('City not found.');
      throw new Error(`API error: ${res.status}`);
    }
    const data = await res.json();
    render(data);
    // save last search
    localStorage.setItem('weathernow_lastCity', city);
  } catch (err) {
    showError(err.message || 'Failed to fetch weather.');
    console.error(err);
  } finally {
    elements.searchBtn.disabled = false;
    elements.searchBtn.textContent = 'Search';
  }
}

function render(data) {
  // Basic fields safety
  const name = `${data.name}${data.sys && data.sys.country ? ', ' + data.sys.country : ''}`;
  const temp = Math.round(data.main.temp);
  const desc = data.weather && data.weather[0] ? capitalize(data.weather[0].description) : '—';
  const feels = Math.round(data.main.feels_like) + '°C';
  const humidity = (data.main.humidity !== undefined) ? (data.main.humidity + '%') : '—';
  const wind = (data.wind && data.wind.speed !== undefined) ? (data.wind.speed + ' m/s') : '—';

  elements.cityName.textContent = name;
  elements.temp.textContent = `${temp}°C`;
  elements.desc.textContent = desc;
  elements.feels.textContent = feels;
  elements.humidity.textContent = humidity;
  elements.wind.textContent = wind;

  // local time using timezone offset (seconds)
  if (typeof data.timezone === 'number') {
    const local = new Date(Date.now() + (data.timezone * 1000));
    elements.localTime.textContent = local.toLocaleString([], { weekday:'short', hour:'2-digit', minute:'2-digit' });
  } else {
    elements.localTime.textContent = '';
  }

  // dynamic background shading based on weather id or main
  const main = data.weather && data.weather[0] ? data.weather[0].main.toLowerCase() : '';
  applyTheme(main);

  elements.result.classList.remove('hidden');
  elements.error.classList.add('hidden');
}

function applyTheme(main) {
  // simple mapping: clear -> warm, clouds -> cool, rain/snow -> grayish
  const body = document.body;
  body.classList.remove('clear','clouds','rain','snow','thunder','mist');
  if (main.includes('clear')) body.classList.add('clear');
  else if (main.includes('cloud')) body.classList.add('clouds');
  else if (main.includes('rain') || main.includes('drizzle')) body.classList.add('rain');
  else if (main.includes('snow')) body.classList.add('snow');
  else if (main.includes('thunder')) body.classList.add('thunder');
  else body.classList.add('mist');
}

// small helper
function capitalize(s='') { return s.charAt(0).toUpperCase() + s.slice(1); }

// event handlers
elements.searchBtn.addEventListener('click', () => {
  const city = elements.cityInput.value.trim();
  if (!city) return showError('Please type a city name.');
  fetchWeather(city);
});
elements.cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') elements.searchBtn.click();
});

elements.useLast.addEventListener('click', () => {
  const last = localStorage.getItem('weathernow_lastCity');
  if (last) {
    elements.cityInput.value = last;
    fetchWeather(last);
  } else {
    showError('No last city saved yet.');
  }
});

// try to auto-load last city on start
window.addEventListener('load', () => {
  const last = localStorage.getItem('weathernow_lastCity');
  if (last) {
    elements.cityInput.value = last;
    // don't auto-fetch; user can click 'Use last'
  }
});
