/*
 © Copyright 2021 Visiblelanguage
*/
/*BRANDON!!!
When you inevitably run into problems with this, you'll need to change lines 9 and 26.
*/

function getChartData(dataset, chartType) {
  const url = new URL(`json/json/${dataset}/${chartType}.json`, window.location.href).toString();

  const req = new XMLHttpRequest();

  req.open("GET", url, false);
  req.send(null);

  return JSON.parse(req.response);
}

function getSpeakerDataJSON(dataset) {
  // dataset is speaker
  const url = new URL(`speakerData/${dataset}.json`, window.location.href).toString();
  const req = new XMLHttpRequest();

  req.open("GET", url, false);
  req.send(null);

  return JSON.parse(req.response);
}
