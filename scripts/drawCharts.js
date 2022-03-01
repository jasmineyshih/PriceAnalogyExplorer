function drawChartWithTimeComponent (dataset) {
    monthArray.push(0.23);   // a week
    for (let i = 1; i <= 60; i++) {
        monthArray.push(i);
    }
    for (let i = 1; i <= 3; i++) {
        monthArray.push(2.3 * i);   // quarters
    }
    monthArray.sort();
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
    let months = [1, 2.3, 3, 4.6, 6, 6.9, 12, 18, 24, 36, 48, 60];
    for (let i = 0; i < months.length; i++) {
        let month = months[i];
        let yPos = y(month);
        timeCompSvg.append("line")
            .attr("x1", -10)
            .attr("y1", yPos)
            .attr("x2", width)
            .attr("y2", yPos)
            .attr("stroke", "gray")
            .classed("dashedLines", true);
        let text = `${month} Month${month > 1 ? "s" : ""}`;
        if (month % 12 == 0) {
            text = `${month / 12} Year${month / 12 > 1 ? "s" : ""}`;
        } else if ((month * 10) % 23 == 0) {
            text = `${(month * 10) / 23} Quarter${month / 2.3 > 1 ? "s" : ""}`;
        }
        monthToStringMap[month] = text;
        timeCompSvg.append("text")
            .attr("x", -10)
            .attr("y", yPos + 3)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(text)
            .classed("axisLabel", true);
    }
    timeCompSvg.append("text")  // one-time cost text
        .attr("x", -10)
        .attr("y", y(0.23)+5)
        .attr("fill", "currentColor")
        .attr("text-anchor", "end")
        .text("One-Time")
        .classed("axisLabel", true);
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
            entry.multiplier = entry.amountTo / amount;
            dotsArray.push(entry);
        });
    });
    drawPopulationLines(timeCompSvg, x);
    timeCompSvg.append("g").classed("gridDotsGroup", true);
    timeCompSvg.append("g").classed("onetimeCostDotsGroup", true);
    drawOrUpdateDots();
    drawOrUpdateOnetimeCostDots();
    findClosestAnalogy();

    monthArray.forEach(m => {
        let xVal = amount / monthlyCostInput / m;
        if (xVal >= minPopulation / 2 && xVal <= maxPopulation) {
            costLineArray.push({x: xVal, y: m});
        }
    });
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
                    .attr("id", d => `c${Number.isInteger(d.time) ? d.time : d.time * 10}c${d.id}`);
            },
            update => {
                return update.attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(d.time); });
            },
            exit => {
                return exit.remove();
            }
        );
}
function drawOrUpdateOnetimeCostDots() {
    onetimeCostDotsArray = [];
    onetimeData.filter(d => {
        if (d.type == "tuition") {
            return userProfile.school == d.school || (userProfile.level == "undergrad" && d.level == "undergrad");
        } else {
            return true;
        }
    }).forEach(d => {
        let pop = amount / d.cost;
        if (!excludedCategories.has(d.type) && pop >= minPopulation/2 && pop <= maxPopulation) {
            onetimeCostDotsArray.push({
                id: d.id,
                cost: d.cost,
                name: d.name,
                type: d.type,
                population: pop
            });
        }
    });
    timeCompSvg.select(".onetimeCostDotsGroup").selectAll(".dots")
        .data(onetimeCostDotsArray)
        .join(
            enter => { 
                return enter.append("circle")
                    .attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(0.23); })   // draw on pop = 0 line
                    .attr("r", 6)
                    .style("opacity", 0.6)
                    .style("fill", d => colorMap[d.type])
                    .classed("dots", true)
                    .classed("onetimeCostDotsGroup", true)
                    .on('mouseover', tooltipMouseover)
                    .on('mouseleave', tooltipMouseleave)
                    .attr("id", d => `oc${d.id}`);
            },
            update => {
                return update.attr("cx", function (d) { return x(d.population); })
                    .style("fill", d => colorMap[d.type])
                    .attr("id", d => `oc${d.id}`);
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
                return update.attr("cy", function (d) { return yOnetime(amount); });
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
    drawOrUpdateOnetimeCostDots();
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
    timeCompSvg.select("#costCurve")
        .attr("d", lineFunct(costLineArray, x, y, "x", "y"));
    updateDots();
}
function updateDots() {
    dotsArray.forEach(dot => {
        dot.amountTo = dot.population * monthlyCostInput * dot.time;
        dot.multiplier = dot.amountTo / amount;
    });
    findClosestAnalogy();
}
function updateOneTimeDots() {
    onetimeDotsArray.forEach(dot => {
        dot.freePrize = amount / dot.population;
    });
    drawOrUpdateOneTimeDots();
    //findClosestOnetimeAnalogy();
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
        .attr("class", `${obj.type}CostLine`)
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
    oneTimeSvg.append("g").classed("gridDotsGroup", true);
    drawOrUpdateOneTimeDots();
    //findClosestOnetimeAnalogy();
}

let tooltipMouseover = function (e, d) {
    let amountTo = d.population * monthlyCostInput * d.time;
    let isOnetime = d3.select(this).classed("onetimeCostDotsGroup");
    if (!isOnetime && currAnalogyDot && d3.select(this).attr("id") != currAnalogyDot.attr("id") /*&& d3.select(this).attr("id") != currOnetimeAnalogyDot.attr("id")*/) {
        d3.select(this)
            .style("opacity", 0.5);
    } else if (isOnetime && currOnetimeCostAnalogyDot && d3.select(this).attr("id") != currOnetimeCostAnalogyDot.attr("id")) {
        d3.select(this)
            .style("opacity", 0.85);
    }
    let text = "";
    if (currAnalogyType == 0) {
        text = isOnetime ?
            `${Math.round(d.population).toLocaleString()} people get ${d.name} ($${d.cost.toLocaleString()})`
            :`The population of ${d.population_text}<br>paying $${monthlyCostInput}/month<br>for ${monthToStringMap[d.time]}<br>amounts to $${(amountTo).toLocaleString()} (~${(amountTo / amount).toFixed(1)}x target amount)`;
    } else {
        text = `Everyone in the population of ${d.population_text}<br>gets $${Math.round(d.freePrize)}`;
    }
    let tp = d3.select("#timeCompTooltip").style("opacity", 1)
        .html(text)
        .style("left", (e.x + 10) + "px")
        .style("top", (e.y + "px"));
};
let tooltipMouseleave = function (e, d) {
    let isOnetime = d3.select(this).classed("onetimeCostDotsGroup");
    if (!isOnetime && currAnalogyDot && d3.select(this).attr("id") != currAnalogyDot.attr("id") /*&& d3.select(this).attr("id") != currOnetimeAnalogyDot.attr("id")*/) {
        d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 0);
    } else if (isOnetime && currOnetimeCostAnalogyDot && d3.select(this).attr("id") != currOnetimeCostAnalogyDot.attr("id")) {
        d3.select(this)
            .style("opacity", 0.6);
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
    analogyBank = dotsArray.map(ana => {
        let obj = JSON.parse(JSON.stringify(ana));
        obj.diff = Math.abs(obj.multiplier - 1);
        obj.analogyType = "recurring";
        return obj;
    });
    onetimeCostDotsArray.forEach(dot => {
        let obj = JSON.parse(JSON.stringify(dot));
        let smallestPopDiff = Infinity;
        let closestPopDot = null;
        populationData.forEach(pop => {
            let popDiff = Math.abs(obj.population - pop.population) / pop.population;
            if (popDiff < smallestPopDiff) {
                smallestPopDiff = popDiff;
                closestPopDot = pop;
            }
        });
        obj.diff = Math.abs((obj.cost * closestPopDot.population / amount) - 1);
        obj.popId = closestPopDot.id;
        obj.population_text = closestPopDot.population_text;
        obj.analogyType = "onetime";
        analogyBank.push(obj);
    });
    analogyBank.sort((a, b) => a.diff - b.diff);
    currBestAnalogy = analogyBank[0];
    if (currAnalogyDot != null) {
        currAnalogyDot.style('opacity', 0);
        currAnalogyDot = null;
    }
    if (currOnetimeCostAnalogyDot != null) {
        currOnetimeCostAnalogyDot.style('opacity', 0.6);
        currOnetimeCostAnalogyDot = null;
    }
    if (currBestAnalogy.analogyType == "recurring") {
        hideOrDisplayById("analogySentenceOnetime", false);
        hideOrDisplayById("analogySentence");
        d3.select("#analogyAmount").html(amount.toLocaleString());
        d3.select("#analogyPop").html(currBestAnalogy.population_text);
        d3.select("#analogyTime").html(monthToStringMap[currBestAnalogy.time]);
        d3.select("#monthlyCostAmount").html(monthlyCostInput.toLocaleString());
        d3.select("#popNumber").html(currBestAnalogy.population.toLocaleString());
        currAnalogyDot = d3.select(`#c${Number.isInteger(currBestAnalogy.time) ? currBestAnalogy.time : currBestAnalogy.time * 10}c${currBestAnalogy.id}`).style('opacity', 0.8);
    } else {
        hideOrDisplayById("analogySentence", false);
        hideOrDisplayById("analogySentenceOnetime");
        d3.select("#analogyAmountOnetime").html(amount.toLocaleString());
        d3.select("#analogyPopOnetime").html(currBestAnalogy.population_text);
        d3.select("#analogyCostType").html(`${currBestAnalogy.name} ($${currBestAnalogy.cost.toLocaleString()})`);
        currOnetimeCostAnalogyDot = d3.select(`#oc${currBestAnalogy.id}`).style('opacity', 1);
    }
}

function updateShownCategories (categoryName) {
    if (d3.select(`#${categoryName}Checkbox`).property("checked")) {    // including
        excludedCategories.delete(categoryName);
        d3.selectAll(`.${categoryName}CostLine`).style("display", "block");
    } else {    // excluding
        excludedCategories.add(categoryName);
        d3.selectAll(`.${categoryName}CostLine`).style("display", "none");
    }
    drawOrUpdateOnetimeCostDots();
    //findClosestOnetimeAnalogy();
}

function findClosestOnetimeAnalogy () {
    let smallestMultDiff = Infinity;
    let closestMultDot = null;
    let type = null;
    onetimeDotsArray.forEach(dot => {
        onetimeData.forEach(d => {
            if (!excludedCategories.has(d.type)) {
                let multDiff = Math.abs(dot.freePrize - d.cost) / dot.freePrize;
                if (multDiff < smallestMultDiff) {
                    smallestMultDiff = multDiff;
                    closestMultDot = dot;
                    type = d;
                }
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

function filterPopulationByProfile() {
    populationData = allPopulationData.filter((pop) => {
        if (pop.school == undefined) {  // keep all general populations
            return true;
        }
        return Object.keys(userProfile).every(infoType => {
            return pop[infoType] == "all" || pop[infoType] == userProfile[infoType];
        });
    });
}