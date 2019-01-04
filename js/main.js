class Storage {
    constructor(key) {
        this.key = key;
    }
    getStorage() {
        const data = window.localStorage.getItem(this.key);
        if (data) {
            return JSON.parse(data);
        }
        return data;
    }
    save(data) {
        window.localStorage.setItem(this.key, JSON.stringify(data))
    }
}

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

    const api_key = 'ciBFTRSeCJhHXdYrnJpM7eVlDfjNvfa1';
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${api_key}&q=${search}`;

    GETRequest(url, data => {
        const gifUrl = data.data[0].images.original.url;
        cb(gifUrl);
    });
}

const getWeather = (lat, lng, cb) => {
    // TODO; apply some validation to lat, lng

    const URL_BASE = 'https://wt-taqqui_karim-gmail_com-0.sandbox.auth0-extend.com/darksky'
    const api_key = `e6555822310158b5834ba11cf3c06549`;
    const url = `${URL_BASE}?api_key=${api_key}&lat=${lat}&lng=${lng}`

    GETRequest(url, data => {
        const forecast = JSON.parse(data.res.text);
        cb(forecast);
    });
}

const storage = new Storage('app-state');

let state = {
    locations: [],
    gifs: {
        'partly-cloudy-day': 'https://media.giphy.com/media/M2Z8Td8gjo64/giphy.gif',
        'not-loaded': 'https://media.giphy.com/media/51Uiuy5QBZNkoF3b2Z/giphy.gif',
        'partly-cloudy-night':'https://media.giphy.com/media/3o6Zt93byJYeHqvrwc/giphy.gif'
    },
}

// const getDayName = (datetime) => {
//     const day = new Date(datetime * 1000).getDay();
//     const days = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur"]
//     return days[day] + "day";
// }

//OBJECTS
const searchBox = document.querySelector('.js-search-box');
const weatherBar = document.querySelector('.js-weather-bar');
const locationTitle = document.querySelector('.js-location-title');
let weather = document.querySelector('.js-weather');

//HELPER
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

const convertTimeZone = (timezone) => {
    let splitCity = timezone.split('/');
    let city = splitCity[1].trim();
    if(city.includes('_')){
        let part2 = city.split('_');
        city = `${part2[0]} ${part2[1]}`;
    }

    return city;

}

const removeDashes = icon => {
    const splitIcon = icon.split('-');
    if(splitIcon > 1){
        for(let i=0; i<splitIcon.length; i++){

        }
    }
    
}

const renderForecastItem = (forecastItem, state, i) => {
    // const day = getDayName(forecastItem.datetime)
    let iconURL = state.gifs[forecastItem.icon];
    if (typeof iconURL === "undefined") {
        iconURL = state.gifs['not-loaded']
    }
    console.log(forecastItem.daysofWeek);
    return `<div class="row row-center col-5 weather-day border-${i}">
        <h3 class='date-title'>${forecastItem.monthDate}</h3>
        <h3 class='day-title'>${forecastItem.daysofWeek}</h3>
        <img class='img' src="${iconURL}">
        <p class='weather-condition'><em>${forecastItem.icon}</em></p>
        <p class='weather-temp'>${forecastItem.hi}&deg; F</p>
        <p class='weather-temp-feels'>Feels like: ${forecastItem.lo} &deg; F</p>
    </div>`
}

const renderLocation = (timezone, weatherBar) => {
    return ` <section class="row location-bar">
    <h2 class='js-location-title location-title'>
    <span class="location-title-span">${timezone}</span>
    </h2>
    </section>
    <section class='row row-space js-weather-bar weather-bar'>
            ${weatherBar}
        </section>`
}

const render = state => {
    let html = '';
    for (let location of state.locations){
        let forecastHTML = '';

        for (let i = 0; i < 5; i++) {
            let forecastItem = location.forecast[i];
            forecastHTML += renderForecastItem(forecastItem, state, i);
        }
        // weatherBar.innerHTML = forecastHTML;

        html += renderLocation(location.timezone, forecastHTML);
    }

    weather.innerHTML = html;

}

render(state)


searchBox.addEventListener('keydown', e => {
    const {
        key,
        target
    } = e;

    if (key === 'Enter') {
        let val = target.value;

        const parts = val.split(',');
        target.value = '';

        const lat = parts[0].trim();
        const lng = parts[1].trim();

        getWeather(lat, lng, (data) => {
            let location = {};
            location.lat = data.latitude;
            location.long = data.longitude;
            location.timezone = convertTimeZone(data.timezone);
            location.forecast = [];

            let forecast = data.daily.data;
            let count = 0;

            for (let day of forecast) {
                let forecastObj = {}

                forecastObj.icon = day.icon;
                forecastObj.hi = Math.floor(day.temperatureHigh);
                forecastObj.lo = Math.floor(day.temperatureLow);
                forecastObj.desc = day.summary;
                forecastObj.datetime = day.time;

                const dateObj = convertTime(forecastObj.datetime);
                let daysofWeek = dateObj.daysofWeek;
                const monthDate = dateObj.month + '/' + dateObj.date;

                forecastObj.daysofWeek = daysofWeek;
                forecastObj.monthDate = monthDate;

                if(typeof state.gifs[forecastObj.icon] === 'undefined'){
                    getGifs(forecastObj.icon, cb => {
                        state.gifs[forecastObj.icon] = cb;
                        render(state);
                    })
                }

                location.forecast.push(forecastObj);
                count++
                if (count > 4) break;
            };

            state.locations.unshift(location);
            storage.save(state);
            render(state);
        });
    }
});

// Checking if there is anything in the local storage
const stored_state = storage.getStorage();
if (stored_state) {
    // If there is then apply that to my state in Memory
    state = stored_state;
}

render(state);


