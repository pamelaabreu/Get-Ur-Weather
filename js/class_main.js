const GETRequest = (url, cb) => {
    let request = new XMLHttpRequest();
    request.open('GET', url);
    request.addEventListener('load', response => {
        const data = JSON.parse(response.currentTarget.response);
        cb(data)
    });
    request.send();
}

const getGifs = (search, cb) => {
    if (search === "" || search.trim() === "") {
        return;
    }

    const api_key = '8f3eb84662f4c5f513235cab541056dd';
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${api_key}&q=${search}`;

    GETRequest(url, data => {
        const gifArray = [];
        let url = data.data.images.original.url[0];
        data.data.forEach(currentGif => {
            const url = currentGif.images.original.url;
            gifArray.push(url);
        });

        cb(url);
    });
}

const getWeather = (lat, lng, cb) => {
    // TODO; apply some validation to lat, lng

    const URL_BASE = 'https://wt-taqqui_karim-gmail_com-0.sandbox.auth0-extend.com/darksky'
    const api_key = `0620f6bb9d523aed8286e6574275de47`;
    const url = `${URL_BASE}?api_key=${api_key}&lat=${lat}&lng=${lng}`

    GETRequest(url, data => {
        const forecast = JSON.parse(data.res.text);
        cb(forecast);
    });
}


const state = {
    locations: [],
    gifs: {
        'partly-cloudy-day': 'https://media2.giphy.com/media/1uLQUtPLbJMQ0/giphy.gif',
        'not-loaded': 'https://media1.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif',
    },
}

const getDayName = (datetime) => {
    const day = new Date(datetime * 1000).getDay();
    const days = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur"]
    return days[day] + "day";
}

const renderForecastItem = (forecastItem, state, index) => {
    const day = getDayName(forecastItem.datetime)
    let iconURL = state.gifs[forecastItem.icon];
    if (typeof iconURL === "undefined") {
        iconURL = state.gifs['not-loaded']
    }
    return `<div class="column">
        <div class="ui card fluid">
            <div class="image">
            <img src="${iconURL}">
            </div>
            <div class="content">
            <a class="header">${Math.floor(forecastItem.hi)} &deg; F / ${Math.floor(forecastItem.lo)} &deg; F</a>
            <div class="meta">
                <span class="date">${day}</span>
            </div>
            <div class="description">
                ${forecastItem.desc}
            </div>
            </div>
        </div>
    </div>`;
}

const render = state => {
    const weatherContainer = document.querySelector('.js-weather');
    let html = '';
    for (let location of state.locations) {
        let forecastHTML = '';

        for (let i = 0; i < 5; i++) {
            let forecastItem = location.forecast[i];
            forecastHTML += renderForecastItem(forecastItem, state);
        }

        html += `<div class="ui five column grid centered">
            <h1 style="width:100%;">${location.lat}, ${location.lng}</h1>
            ${forecastHTML}
        </div>`;
    }

    weatherContainer.innerHTML = html;
}
render(state)

const searchBtn = document.querySelector('.js-search');
const locationInput = document.querySelector('.js-input');

const convertTime = (datetime) => {
    let data = new Date(datetime * 1000);
    let daysofWeek = data.getDay();
    const days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Friyay", "Sat"];
    return {
        daysofWeek: days[daysofWeek],
        month: data.getMonth() + 1,
        date: data.getDate()
    }
}

searchBtn.addEventListener('click', e => {
    const val = locationInput.value;
    locationInput.value = "";

    const parts = val.split(',');
    const lat = parts[0].trim();
    const lng = parts[1].trim();

    getWeather(lat, lng, (data) => {
        let location = {};
        location.lat = data.latitude;
        location.long = data.longitude;
        location.timezone = data.timezone;
        location.forecast = [];

        let forecast = data.daily.data;
        let count = 0;

        for (let day of forecast) {
            let forecastObj = {}

            forecastObj.icon = day.icon;
            forecastObj.hi = day.temperatureHigh;
            forecastObj.lo = day.temperatureLow;
            forecastObj.desc = day.summary;
            forecastObj.datetime = day.time;

            const dateObj = convertTime(forecastObj.datetime);
            let daysofWeek = dateObj.daysofWeek;
            const monthDate = dateObj.month + '/' + dateObj.date;

            forecastObj.daysofWeek = daysofWeek;
            forecastObj.monthDate = monthDate;

            if(typeof state.gifs[forecastObj.icon] === 'undefined'){
                getGifs(forecastObj.icon, cb => {

                    console.log(typeof state.gifs[forecastObj.icon]);
                    // state.gifs[forecastObj.icon] = cb;
                    // render(state);
                })
            }


            location.forecast.push(forecastObj);
            count++
            if (count > 4) break;
        };

        
        state.locations.unshift(location);
        // storage.save(state);
        
        render(state);
    });
});