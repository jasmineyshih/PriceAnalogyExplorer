function drawChartWithTimeComponent (dataset) {
    monthArray.push(0.23);   // a week
    for (let i = 1; i <= 60; i++) {
        monthArray.push(i);
    }
    x = d3.scaleLog()
        .domain([minPopulation/2, maxPopulation])
        .range([0, width]);
    let xAxis = timeCompSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .classed("xAxisGroup", true)
        .call(d3.axisBottom(x).tickValues(populationData.map(d => d.population)).tickFormat((d, i) => `${populationData[i].population_text} (${populationData[i].population.toLocaleString()})`));
    xAxis.append("text")
        .attr("x", width + 10)
        .attr("y", 5)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Population →");

        // Add Y axis
    y = d3.scaleLog()
        .domain([0.23, 5 * 12])
        .range([height, 0]);
    let yAxis = timeCompSvg.append("g")
        .call(d3.axisLeft(y).tickValues([]));
    yAxis.append("text")
        .attr("x", -margin.left)
        .attr("y", -10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Time");

    // y-axis labels
    let months = [1, 3, 6, 12, 18, 24, 36, 48, 60];
    for (let i = 0; i < months.length; i++) {
        let month = months[i];
        let yPos = y(month);
        timeCompSvg.append("line")
            .attr("x1", -15)
            .attr("y1", yPos)
            .attr("x2", width)
            .attr("y2", yPos)
            .attr("stroke", "gray")
            .classed("dashedLines", true);
        let text = `${month} Month${month > 1 ? "s" : ""}`;
        if (month % 12 == 0) {
            text = `${month / 12} Year${month / 12 > 1 ? "s" : ""}`;
        }
        monthToStringMap[month] = text;
        timeCompSvg.append("text")
            .attr("x", -20)
            .attr("y", yPos + 3)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(text)
            .classed("axisLabel", true);
    }
    dotsArray = [];
    months.forEach(month => {
        dataset.forEach(d => {
            let entry = {
                time: month,
                population: d.population,
                population_text: d.population_text,
                amountTo: d.population * monthlyCostInput * month,
                //population_multiplier: parseFloat((amount / d.cost / month / d.population).toFixed(2)),
                id: d.id
            }
            entry.multipler = entry.amountTo / amount;
            dotsArray.push(entry);
        });
    });
    drawPopulationLines(timeCompSvg, x);
    timeCompSvg.append("g").classed("gridDotsGroup", true);
    drawOrUpdateDots();
    findClosestAnalogy();

    monthArray.forEach(m => {
        let xVal = amount / monthlyCostInput / m;
        if (xVal >= minPopulation / 2 && xVal <= maxPopulation) {
            costLineArray.push({x: xVal, y: m});
        }
    });
    console.log(costLineArray)
    timeCompSvg.append("path")
        .attr("fill", "none")
        .attr("stroke", monthlyCostLineColor)
        .attr("stroke-width", 3)
        .attr("d", lineFunct(costLineArray, x, y, "x", "y"))
        .attr("id", "costCurve");
}

function drawOrUpdateDots() {
    timeCompSvg.select(".gridDotsGroup").selectAll(".dots")
        .data(dotsArray)
        .join(
            enter => { 
                return enter.append("circle")
                    .attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(d.time); })
                    .attr("r", 8)
                    .style("fill", dotFill)
                    .style("opacity", 0)
                    .classed("dots", true)
                    .on('mouseover', tooltipMouseover)
                    .on('mouseleave', tooltipMouseleave)
                    .attr("id", d => `c${d.time}c${d.id}`);
            },
            update => {
                return update.attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(d.time); })
                    .attr("r", d => d.population_multiplier === 0 ? 0 : r(d.population_multiplier));
            },
            exit => {
                return exit.remove();
            }
        );
}
function drawOrUpdateOneTimeDots() {
    oneTimeSvg.select(".gridDotsGroup").selectAll(".dots")
        .data(onetimeDotsArray)
        .join(
            enter => { 
                return enter.append("circle")
                    .attr("cx", function (d) { return xOnetime(d.population); })
                    .attr("cy", function (d) { return yOnetime(amount); })
                    .attr("r", 8)
                    .style("fill", dotFill)
                    .style("opacity", 0)
                    .classed("dots", true)
                    .on('mouseover', tooltipMouseover)
                    .on('mouseleave', tooltipMouseleave)
                    .attr("id", d => `o${d.id}`);
            },
            update => {
                return update.attr("cy", function (d) { console.log("here");return yOnetime(amount); });
            },
            exit => {
                return exit.remove();
            }
        );
}
function updateAmount() {
    amount = parseInt(document.getElementById('amountField').value, 10);
    let amountYpos = yOnetime(amount);
    oneTimeSvg.select("#onetimeCurrAmountLine")
        .attr("x1", -100)
        .attr("y1", amountYpos)
        .attr("x2", widthOnetime)
        .attr("y2", amountYpos);
    oneTimeSvg.select("#onetimeCurrAmountText")
        .attr("y", amountYpos -3)
        .text(amount.toLocaleString());
    updateOneTimeDots();
    updateMonthlyCost();
}
function updateMonthlyCost() {
    monthlyCostInput = parseInt(document.getElementById('costField').value, 10);
    costLineArray = [];
    monthArray.forEach(m => {
        let xVal = amount / monthlyCostInput / m;
        if (xVal >= minPopulation / 2 && xVal <= maxPopulation) {
            costLineArray.push({x: xVal, y: m});
        }
    });
    console.log(costLineArray);
    timeCompSvg.select("#costCurve")
        .attr("d", lineFunct(costLineArray, x, y, "x", "y"));
    updateDots();
}
function updateDots() {
    dotsArray.forEach(dot => {
        dot.amountTo = dot.population * monthlyCostInput * dot.time;
        dot.multipler = dot.amountTo / amount;
    });
    findClosestAnalogy();
}
function updateOneTimeDots() {
    onetimeDotsArray.forEach(dot => {
        dot.freePrize = amount / dot.population;
    });
    drawOrUpdateOneTimeDots();
    findClosestOnetimeAnalogy();
}
function lineFunct(data, xScale, yScale, xAttr, yAttr) {
    return d3.line().x(d => xScale(d[xAttr])).y(d => yScale(d[yAttr]))(data);
}
function drawOnetimeCostLine(obj) {
    let points = [];
    for (let i = minPopulation / 2; i <= maxPopulation; i += (maxPopulation / 20)) {
        if (Math.round(i * obj.cost) <= maxOnetimeAmount) {
            points.push({id: obj.id, x: Math.round(i), y: Math.round(i * obj.cost)});
        }
    }
    oneTimeSvg.datum(obj)
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colorMap[obj.type])
        .attr("stroke-width", 1.25)
        .attr("d", lineFunct(points, xOnetime, yOnetime, "x", "y"))
        .classed("onetimeCostLine", true)
        .on("mouseover", showOnetimeCostTooltip)
        .on("mouseout", hideOnetimeCostTooltip);
}
function drawPopulationLines(svgObj, xScale) {
    svgObj.append("g").classed("populationLines", true);
    svgObj.append("g").classed("populationLabels", true);
    for (let i = 0; i < populationData.length; i++) {
        let xPos = xScale(populationData[i].population);
        svgObj.select(".populationLines").append("line")
            .attr("x1", xPos)
            .attr("y1", height)
            .attr("x2", xPos)
            .attr("y2", 0)
            .attr("stroke", "gray")
            .classed("dashedLines", true);
        svgObj.select(".xAxisGroup")
            .selectAll("g")
            .select("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-40)")
    }
}

function drawOneTimeCostChart () {
    xOnetime = d3.scaleLog()   // x-axis is population
            .domain([minPopulation/2, maxPopulation])
            .range([0, widthOnetime]);
    let xAxisOneTime = oneTimeSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .classed("xAxisGroup", true)
        .call(d3.axisBottom(xOnetime).tickValues(populationData.map(d => d.population)).tickFormat((d, i) => `${populationData[i].population_text} (${populationData[i].population.toLocaleString()})`));;
    xAxisOneTime.append("text")
        .attr("x", widthOnetime + margin.right)
        .attr("y", 35)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text("Population →");
    yOnetime = d3.scaleLog()
        .domain([1, maxOnetimeAmount])
        .range([height, 0]);
    let yAxisOnetime = oneTimeSvg.append("g")
        .call(d3.axisLeft(yOnetime));
    yAxisOnetime.append("text")
        .attr("x", -margin.left + 20)
        .attr("y", -10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("↑ Amount of Money");
    onetimeData.forEach(d => drawOnetimeCostLine(d));
    drawPopulationLines(oneTimeSvg, xOnetime);
    let amountYpos = yOnetime(amount);
    oneTimeSvg.append("line")
        .attr("id", "onetimeCurrAmountLine")
        .attr("x1", -100)
        .attr("y1", amountYpos)
        .attr("x2", widthOnetime)
        .attr("y2", amountYpos)
        .attr("stroke", "gray")
        .classed("dashedLines", true);
    oneTimeSvg.append("text")
        .attr("id", "onetimeCurrAmountText")
        .attr("x", -25)
        .attr("y", amountYpos -3)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text(amount.toLocaleString())
        .classed("axisLabel", true);
    
    onetimeDotsArray = [];
    populationData.forEach(d => {
        let entry = {
            population: d.population,
            population_text: d.population_text,
            freePrize: amount / d.population,
            id: d.id
        }
        onetimeDotsArray.push(entry);
    });
    console.log(onetimeDotsArray);
    oneTimeSvg.append("g").classed("gridDotsGroup", true);
    drawOrUpdateOneTimeDots();
    findClosestOnetimeAnalogy();
}

let tooltipMouseover = function (e, d) {
    let amountTo = d.population * monthlyCostInput * d.time;
    if (d3.select(this).attr("id") != currAnalogyDot.attr("id") && d3.select(this).attr("id") != currOnetimeAnalogyDot.attr("id")) {
        d3.select(this)
            .style("opacity", 0.5);
    }
    let text = "";
    if (currAnalogyType == 0) {
        text = `The population of ${d.population_text}<br>paying $${monthlyCostInput}/month<br>for ${monthToStringMap[d.time]}<br>amounts to $${(amountTo).toLocaleString()} (~${(amountTo / amount).toFixed(1)}x target amount)`;
    } else {
        text = `Everyone in the population of ${d.population_text}<br>gets $${Math.round(d.freePrize)}`;
    }
    d3.select("#timeCompTooltip").style("opacity", 1)
        .html(text)
        .style("left", (e.x + 10) + "px")
        .style("top", (e.y + "px"));
};
let tooltipMouseleave = function (e, d) {
    if (d3.select(this).attr("id") != currAnalogyDot.attr("id") && d3.select(this).attr("id") != currOnetimeAnalogyDot.attr("id")) {
        d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 0);
    }
    d3.select("#timeCompTooltip")
        .transition()
        .duration(100)
        .style("opacity", 0);
};

let showOnetimeCostTooltip = function (e, d) {
    d3.select("#costTooltip").style("opacity", 1)
        .html(`Cost of ${d.name}: $${d.cost.toLocaleString()}`)
        .style("left", (e.x + 10) + "px")
        .style("top", (e.y + "px"));
};
let hideOnetimeCostTooltip = function () {
    d3.select("#costTooltip")
        .transition()
        .duration(100)
        .style("opacity", 0);
};

function findClosestAnalogy () {
    let smallestMultDiff = Infinity;
    let closestMultDot = null;
    dotsArray.forEach(dot => {
        let multDiff = Math.abs(dot.multipler - 1);
        if (multDiff < smallestMultDiff) {
            smallestMultDiff = multDiff;
            closestMultDot = dot;
        }
    });
    d3.select("#analogyAmount").html(amount.toLocaleString());
    d3.select("#analogyPop").html(closestMultDot.population_text);
    d3.select("#analogyTime").html(monthToStringMap[closestMultDot.time]);
    d3.select("#monthlyCostAmount").html(monthlyCostInput.toLocaleString());
    d3.select("#popNumber").html(closestMultDot.population.toLocaleString());
    if (currAnalogyDot != null) {
        currAnalogyDot.style('opacity', 0);
    }
    currAnalogyDot = d3.select(`#c${closestMultDot.time}c${closestMultDot.id}`).style('opacity', 0.8);
}

function findClosestOnetimeAnalogy () {
    let smallestMultDiff = Infinity;
    let closestMultDot = null;
    let type = null;
    onetimeDotsArray.forEach(dot => {
        onetimeData.forEach(d => {
            let multDiff = Math.abs(dot.freePrize - d.cost);
            if (multDiff < smallestMultDiff) {
                smallestMultDiff = multDiff;
                closestMultDot = dot;
                type = d;
            }
        })
    });
    d3.select("#analogyAmountOnetime").html(amount.toLocaleString());
    d3.select("#analogyPopOnetime").html(closestMultDot.population_text);
    d3.select("#analogyCostType").html(`${type.name} ($${type.cost.toLocaleString()})`);
    if (currOnetimeAnalogyDot != null) {
        currOnetimeAnalogyDot.style('opacity', 0);
    }
    currOnetimeAnalogyDot = d3.select(`#o${closestMultDot.id}`).style('opacity', 0.8);
}

function switchAnalogyType () {
    currAnalogyType = (currAnalogyType + 1) % 2;
    d3.select("#switchButtonText").html(currAnalogyType == 0 ? "One-time Cost Analogy" : "Monthly Cost Analogy");
    if (currAnalogyType == 1) {
        hideOrShowById("monthlyCostInput", false);
        hideOrDisplayById("viz", false);
        hideOrDisplayById("analogySentence", false);
        hideOrDisplayById("analogySentenceOnetime");
        hideOrDisplayById("oneTimeCostViz");
    } else {
        hideOrShowById("monthlyCostInput");
        hideOrDisplayById("viz");
        hideOrDisplayById("analogySentence");
        hideOrDisplayById("analogySentenceOnetime", false);
        hideOrDisplayById("oneTimeCostViz", false);
    }
}

function hideOrShowById(id, show=true) {
    if (show) {
        d3.select("#"+id).style("visibility", "visible");
    } else {
        d3.select("#"+id).style("visibility", "hidden");
    }
}
function hideOrDisplayById(id, show=true) {
    if (show) {
        d3.select("#"+id).style("display", "block");
    } else {
        d3.select("#"+id).style("display", "none");
    }
}