const fs = require('fs');
const express = require('express');
const { Console } = require('console');
const https = require('follow-redirects').https;
const app = express();
const useragent = require('express-useragent');
const axios = require('axios');


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/css/'));
app.use(useragent.express());

const port = 80;

halls = {};

function sortData(hall) {
  var sorted = {};
  for (var k = 0; k < hall.length; k++) {

    sorted[hall[k].date.substring(0,10)] = {};

    // Add to breakfast, lunch, or dinner
    for (var i = 0; i < hall[k].menuItems.length; i++) {
      if (!Object.hasOwn(sorted[hall[k].date.substring(0,10)], hall[k].menuItems[i].meal)) {
        sorted[hall[k].date.substring(0,10)][hall[k].menuItems[i].meal] = {};
      }

      if (!Object.hasOwn(sorted[hall[k].date.substring(0,10)][hall[k].menuItems[i].meal], hall[k].menuItems[i].course)) {
        sorted[hall[k].date.substring(0,10)][hall[k].menuItems[i].meal][hall[k].menuItems[i].course] = [];
      }

      sorted[hall[k].date.substring(0,10)][hall[k].menuItems[i].meal][hall[k].menuItems[i].course].push(hall[k].menuItems[i].formalName);

    }
  }

  //console.log(sorted)
  return sorted;

}

app.get('/', (req, res) => {
  console.log("FOUND!")
  res.redirect('/menu/commons')
})

function emptyHalls() {
  Object.keys(halls).forEach(k => delete halls[k])
}

function addZero(deg) {
  return ('0' + deg).slice(-2);
}

function getData(callback) {

  let date = new Date();
  let year = date.getFullYear();
  let day = ('0' + (date.getDate() - 1)).slice(-2);
  let month = ('0' + (date.getMonth() + 1)).slice(-2);

  if (date.getDate() + 8 > daysInThisMonth()) {
      plusNine = date.getDate() + 8 - daysInThisMonth();
      plusNineM = ('0' + (date.getMonth() + 2)).slice(-2);
  } else {
      plusNine = date.getDate() + 8;
      plusNineM = month;
  }
  link = `/renderedmenu/1/${year}/${date.getMonth() + 1}/${date.getDate() - 1}/bite9daymenu/76929001/nomenuid-False-${year}-${month}-${day}-${year}-${plusNineM}-${plusNine}-en-US-auth-3.json`;
  var config = {
      method: 'get',
      url: "https://sodexoitzstorage.blob.core.windows.net" + link,
      headers: {}
  };

  axios(config)
      .then(function (response) {
          fs.writeFile("data.json", JSON.stringify(response.data), function (err) {
              if (err) {
                  return console.log(err);
              }
              callback();
          });
      })
      .catch(function (error) {
          console.log(error);
      });
}


function daysInThisMonth() {
  var now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function update() {

  
  getData(function() {
    let rawdata = fs.readFileSync('data.json');
    menus = JSON.parse(rawdata).menus;
    emptyHalls();
    console.log("UPDATING")
    
    // Getting dates
    let date = new Date();
    
    halls.updated = date.getDate();

    for (var i = 0; i < menus.length; i++) {
      halls[menus[i].name] = (sortData(menus[i].menuDays));
      halls[menus[i].name].today = date.getFullYear() + "-" + addZero(date.getMonth()+1) + "-" + addZero(date.getDate());
      halls[menus[i].name].yesterday = date.getFullYear() + "-" + addZero(date.getMonth()+1) + "-" + addZero(date.getDate()-1);
      halls[menus[i].name].tomorrow = date.getFullYear() + "-" + addZero(date.getMonth()+1) + "-" + addZero(date.getDate()+1);
    }
  })
  
}


app.get('/menu/:hall', (req, res) => {

  let date = new Date();
  if (date.getDate() != halls.updated) update();
  
  switch (req.params.hall) {
    case ("commons"):
      hallID = "COMMONS DINING HALL";
      break;
    case ("sage"):
      hallID = "RPI - SAGE DINING HALL";
      break;
    case ("blitman"):
      hallID = "RPI - BLITMAN DINING HALL";
      break;
    case ("barh"):
      hallID = "RPI - BAR H DINING HALL";
      break;
    default:
      hallID = "";
      break;
  }

  if (hallID == "") {
    res.redirect('/');
  }
  menu = halls[hallID];
  //console.log(menu)
  //console.log(menu);
  if (req.useragent.isMobile) res.render('pages/mobile', {menu:menu});
  else res.render('pages/index', {menu:menu});
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})


update()
