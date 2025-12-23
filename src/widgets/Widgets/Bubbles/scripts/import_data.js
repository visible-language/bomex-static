/*
 © Copyright 2021 Visiblelanguage
*/
/*BRANDON!!! 
When you inevitably run into problems with this, you'll need to change lines 9 and 26. 
*/

function getChartData(dataset, chartType) {
  const urlBase = '/Widgets/Bubbles/json/json'; // Online Server
  // const urlBase = './graphs/json/json'; // local Server
  const url = `${location.origin}/${urlBase}/${dataset}/${chartType}.json`; 
  // const url = `${location.origin}/${urlBase}/Nephi/${chartType}.json`; 
  
  const req = new XMLHttpRequest();

  req.open("GET", url, false);
  req.send(null);
 
  return JSON.parse(req.response);
}

function getSpeakerDataJSON(dataset) {
  // dataset is speaker
  // const urlBase = './graphs/speakerData';
  const urlBase = '/Widgets/Bubbles/speakerData';
  const url = `${location.origin}/${urlBase}/${dataset}.json`; 
  const req = new XMLHttpRequest();

  req.open("GET", url, false);
  req.send(null);
  
  return JSON.parse(req.response);
}