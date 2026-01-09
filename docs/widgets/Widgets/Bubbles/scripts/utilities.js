/*
 © Copyright 2021 Visiblelanguage
*/

/*
* Methods to calculate text dimensions using a test div
*/


function generateTestDiv(fontSize, text) {
    const testDiv = document.createElement('div');
    testDiv.id = "test";
    testDiv.style.fontSize = `${fontSize}px`;
    testDiv.textContent = String(text);

    return testDiv;
}

function getTextWidth(fontSize, text, padding = 20) {
    const testDiv = generateTestDiv(fontSize, text);
    document.querySelector('body').appendChild(testDiv);
    const width = testDiv.clientWidth;
    testDiv.remove();
    return width + padding;
}

function getTextHeight(fontSize, text) {
    const testDiv = generateTestDiv(fontSize, text);
    document.querySelector('body').appendChild(testDiv);
    const height = testDiv.clientHeight;
    testDiv.remove();
    return height;
}


/*
* Retrieves circle width at a specified height
*/
function getInnerCircleDistance(radius, y) {
    if (y >= radius) {
        return 0;
    }
    return Math.sqrt(Math.pow(radius, 2) - Math.pow(y, 2));
}