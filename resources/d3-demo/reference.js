// margin convention
const svgWidth = 600,
    svgHeight = 560,
    margin = { top: 30, right: 30, bottom: 60, left: 60 },
    width = svgWidth - margin.left - margin.right,
    height = svgHeight - margin.top - margin.bottom;

// svgs
let scatterSvg = d3.select("#scatterplot-container").append("svg") // revision: this variable name used to be svgScatter and it used to point to what is now scatterGroup (a confusing choice)
    .attr("width", svgWidth)
    .attr("height", svgHeight);
let scatterGroup = scatterSvg.append("g") // revision: the group element that holds our circles now has a better variable name
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let barSvg = d3.select("#bar-container").append("svg") // revision: this variable name used to be svgBarRoot
        .attr("width", svgWidth)
        .attr("height", svgHeight);
let barGroup = barSvg.append("g") // revision: this variable name used to be svgBar (a confusing choice)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
let barOverlayGroup = barSvg.append("g") // inclass: add // revision: this variable name used to be svgBar (a confusing choice) svgBarOverlay
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

let brush = d3.brush() // inclass: add
    .on("start brush", brushFxn)
    .on("end", updateBars);

let scatterData = [], // inclass: add
    filteredBarData = [], // inclass: add
    points, // inclass: add
    xScaleScatter,
    yScaleScatter,
    xScaleBar,
    yScaleBar;

d3.csv("cars.csv")
    .then(function (data) {
        console.log(data);

        // cast strings as numbers
        scatterData = deepCopy(data); // inclass: add
        for (let i = 0; i < scatterData.length; i++) { // inclass: change var name
            scatterData[i].hp = +scatterData[i].hp;    // inclass: change var name
            scatterData[i].mpg = +scatterData[i].mpg;  // inclass: change var name
        }

        // reformat data
        let barData = getBarData(scatterData); // inclass: change var name
        
        // scatterplot:
        // create scales
        xScaleScatter = d3.scaleLinear()
            .domain(d3.extent(scatterData, (d) => d.hp)) // inclass: change var name
            .range([0, width]); 
        yScaleScatter = d3.scaleLinear()
            .domain(d3.extent(scatterData, (d) => d.mpg)) // inclass: change var name
            .range([height, 0]);

        // create our axes
        let xAxisScatter = scatterSvg.append("g") // revision: this used to place the xAxisScatter group element inside of scatterGroup (this was a mistake that resulted from bad variable naming); this now places xAxisScatter inside of scatterSvg where it belongs
            .attr("class", "axis")
            .attr("transform", `translate(${margin.left}, ${margin.top + height})`) // revision: we now have to translate this element (margin.left, margin.top) pixels extra because we are no longer placing this element inside of scatterGroup
            .call(d3.axisBottom(xScaleScatter));
        let yAxisScatter = scatterSvg.append("g") // revision: this used to place the yAxisScatter group element inside of scatterGroup (this was a mistake that resulted from bad variable naming); this now places xAxisScatter inside of scatterSvg where it belongs
            .attr("class", "axis")
            .attr("transform", `translate(${margin.left}, ${margin.top})`) // revision: we now have to translate this element (margin.left, margin.top) pixels extra because we are no longer placing this element inside of scatterGroup
            .call(d3.axisLeft(yScaleScatter));

        // label our axes
        xAxisScatter.append("text")
            .attr("class", "label")
            .attr("transform", `translate(${width / 2}, 40)`)
            .text("Horsepower")
        yAxisScatter.append("text")
            .attr("class", "label")
            .attr("transform", `translate(-40, ${2 * height / 5}) rotate(-90)`)
            .text("Miles per gallon")

        // plot data
        points = scatterGroup.selectAll("circle") // inclass: assign selection to points var
            .data(scatterData) // inclass: change var name
            .join("circle")
            .attr("cx", (d) => xScaleScatter(d.hp))
            .attr("cy", (d) => yScaleScatter(d.mpg))
            .attr("r", 5)
            .attr("class", "non-brushed");

        // brush
        scatterGroup.append("g") // inclass: add
            .call(brush);



        // bar chart:
        // set up scales
        xScaleBar = d3.scaleBand()
            .domain(barData.map((d) => d.cyl))
            .range([0, width])
            .padding(0.1);
        yScaleBar = d3.scaleLinear()
            .domain([0, d3.max(barData, (d) => d.count)])
            .range([height, 0]);

        // axes
        let xAxisBar = barSvg.append("g") // revision: I made the same mistakes here as above, placing the axes inside of the mark group instead of alongside it in the svg
            .attr("transform", `translate(${margin.left}, ${margin.top + height})`)
            .call(d3.axisBottom(xScaleBar));
        let yAxisBar = barSvg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScaleBar));

        // label our axes
        xAxisBar.append("text")
            .attr("class", "label")
            .attr("transform", `translate(${width / 2}, 40)`)
            .text("Cylinders")
        yAxisBar.append("text")
            .attr("class", "label")
            .attr("transform", `translate(-40, ${2 * height / 5}) rotate(-90)`)
            .text("Number of records")

        // render bars
        // background bars
        barGroup.selectAll("rect")
            .data(barData)
            .join("rect")
            .attr("class", "non-brushed")
            .attr("x", (d) => xScaleBar(d.cyl))
            .attr("y", (d) => yScaleBar(d.count))
            .attr("width", xScaleBar.bandwidth())
            .attr("height", (d) => height - yScaleBar(d.count));

    })
    .catch(function (err) {
        console.error(err);
    });

// helper functions
function deepCopy(inObject) { // inclass: add
    let outObject, value, key;
    if (typeof inObject !== "object" || inObject === null) {
        return inObject; // Return the value if inObject is not an object
    }
    // Create an array or object to hold the values
    outObject = Array.isArray(inObject) ? [] : {};
    for (key in inObject) {
        value = inObject[key];
        // Recursively (deep) copy for nested objects, including arrays
        outObject[key] = deepCopy(value);
    }
    return outObject;
}

function brushFxn(event) { // inclass: add
    // console.log(event);

    // revert points to initial style
    points.attr("class", "non-brushed");

    let brushCoords;
    if (event.selection != null) {
        let brushCoordsD3 = d3.brushSelection(this);
        brushCoords = {
            "x0": brushCoordsD3[0][0],
            "x1": brushCoordsD3[1][0],
            "y0": brushCoordsD3[0][1],
            "y1": brushCoordsD3[1][1]
        }

        // style brushed points
        points.filter(brushFilter)
            .attr("class", "brushed");
        
        // filter bar data
        let filteredScatterData = scatterData.filter(brushFilter);
        filteredBarData = getBarData(filteredScatterData);
        
        // render bars in real time
        updateBars();
    }

    function brushFilter(d) {
        // iterating over data bound to my points
        let cx = xScaleScatter(d.hp),
            cy = yScaleScatter(d.mpg);

        // get only points inside of brush
        return (brushCoords.x0 <= cx && brushCoords.x1 >= cx && brushCoords.y0 <= cy && brushCoords.y1 >= cy);
    }
}

// expects prefiltered data
function getBarData(filteredData) {
    let returnData = [];

    filteredData.forEach((obj) => {
        let uniqueCyl = returnData.reduce((prev, curr) => (prev && curr.cyl != obj.cyl), true);
        if (uniqueCyl) {
            returnData.push({
                "cyl": +obj.cyl,
                "count": 1
            });
        } else {
            let cylIdx = returnData.findIndex((elem) => elem.cyl == +obj.cyl);
            returnData[cylIdx].count++;
        }
    });
    returnData = returnData.sort((a, b) => a.cyl - b.cyl);
    // console.log(returnData);

    return returnData;
}

function updateBars() { // inclass: add
    // foreground bars
    barOverlayGroup.selectAll("rect")
        .data(filteredBarData)
        .join("rect")
        .attr("class", "brushed")
        .attr("x", (d) => xScaleBar(d.cyl))
        .attr("y", (d) => yScaleBar(d.count))
        .attr("width", xScaleBar.bandwidth())
        .attr("height", (d) => height - yScaleBar(d.count));
}