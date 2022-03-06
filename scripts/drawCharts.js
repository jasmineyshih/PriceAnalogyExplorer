function drawChartWithTimeComponent (dataset) {
    let maxMonths = 50 * 12;
    monthArray.push(0.23);   // a week
    for (let i = 1; i <= maxMonths; i++) {
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
        .domain([0.23, maxMonths])
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
    months = [1, 2.3, 3, 4.6, 6, 6.9, 12, 18, 24, 36, 48, 60, 120, 180, 240, 300, 360, 600];
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
    updateDots();
    timeCompSvg.append("g").classed("populationLines", true);
    timeCompSvg.append("g").classed("populationLabels", true);
    drawPopulationLines(timeCompSvg, x);
    timeCompSvg.append("g").classed("gridDotsGroup", true);
    timeCompSvg.append("g").classed("onetimeCostDotsGroup", true);
    d3.select("#analogyAmount").html(amount.toLocaleString());
    findClosestAnalogy();

    /*monthArray.forEach(m => {
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
        .attr("id", "costCurve");*/
}

function drawOrUpdateDots() {
    let dotsSet = new Set();
    let uniqueDots = [];
    analogyBank.filter(dot => dot.analogyType == "recurring").forEach(dot => {
        let dotId = `${dot.time},${dot.population}`;
        if (!dotsSet.has(dotId)) {
            uniqueDots.push(dot);
            dotsSet.add(dotId);
        }
    });
    timeCompSvg.select(".gridDotsGroup").selectAll(".dots")
        .data(uniqueDots)
        .join(
            enter => { 
                return enter.append("circle")
                    .attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(d.time); })
                    .attr("r", 6)
                    .style("fill", (d) => d.isTop5 ? dotFill : "gray")
                    .style("opacity", 0.6)
                    .classed("dots", true)
                    .on('mouseover', tooltipMouseover)
                    .on('mouseleave', tooltipMouseleave)
                    .attr("id", d => `c${Number.isInteger(d.time) ? d.time : d.time * 10}c${d.id}`);
            },
            update => {
                return update.attr("cx", function (d) { return x(d.population); })
                    .attr("cy", function (d) { return y(d.time); })
                    .style("fill", (d) => d.isTop5 ? dotFill : "gray")
                    .attr("id", d => `c${Number.isInteger(d.time) ? d.time : d.time * 10}c${d.id}`);
            },
            exit => {
                return exit.remove();
            }
        );
}
function drawOrUpdateOnetimeCostDots() {
    let onetimeAnalogies = analogyBank.filter(a => a.analogyType == "onetime");
    timeCompSvg.select(".onetimeCostDotsGroup").selectAll(".dots")
        .data(onetimeAnalogies)
        .join(
            enter => { 
                return enter.append("circle")
                    .attr("cx", function (d) { return d.isTop5 ? x(d.populationObj.population) : x(d.population); })
                    .attr("cy", function (d) { return y(0.23); })   // draw on pop = 0 line
                    .attr("r", 6)
                    .style("opacity", 0.6)
                    .style("fill", d => d.isTop5 ? dotFill : "gray")//colorMap[d.type])
                    .classed("dots", true)
                    .classed("onetimeCostDotsGroup", true)
                    .on('mouseover', tooltipMouseover)
                    .on('mouseleave', tooltipMouseleave)
                    .attr("id", d => `oc${d.id}`);
            },
            update => {
                return update.attr("cx", function (d) { return d.isTop5 ? x(d.populationObj.population) : x(d.population); })
                    .style("fill", d => d.isTop5 ? dotFill : "gray")//colorMap[d.type])
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
function updateAmount(newAmount) {
    amount = newAmount; //parseInt(document.getElementById('amountField').value, 10);
    d3.select("#analogyAmount").html(amount.toLocaleString());
    let amountYpos = yOnetime(amount);
    oneTimeSvg.select("#onetimeCurrAmountLine")
        .attr("x1", -100)
        .attr("y1", amountYpos)
        .attr("x2", widthOnetime)
        .attr("y2", amountYpos);
    oneTimeSvg.select("#onetimeCurrAmountText")
        .attr("y", amountYpos -3)
        .text(amount.toLocaleString());
    updateDots();
    updateOneTimeDots();
    //updateMonthlyCost();
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
    dotsArray = [];
    months.forEach(month => {
        populationData.forEach(d => {
            recurringData.forEach(rec => {
                if (rec.max_time == undefined || month <= rec.max_time) {
                    if ((rec.time_unit == 1 && ((month * 10) % 23 != 0)) || (rec.time_unit == 2.3 && ((month * 10) % 23 == 0))) {
                        if (rec.level == undefined || (rec.level != undefined && rec.level == userProfile.level)) {
                            if ((d.school == undefined && !rec.studentonly) || (d.school && !rec.nonstudent)) {
                                let entry = {
                                    time: month,
                                    populationObj: d,
                                    population: d.population,
                                    population_text: d.population_text,
                                    amountTo: d.population * rec.cost * month,
                                    timeUnit: rec.time_unit,
                                    unitCost: rec.cost,
                                    costName: rec.cost_name,
                                    //population_multiplier: parseFloat((amount / d.cost / month / d.population).toFixed(2)),
                                    id: d.id
                                }
                                entry.multiplier = entry.amountTo / amount;
                                dotsArray.push(entry);
                            }
                        }
                    }
                }
            });
        });
    });
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
    svgObj.select(".populationLines").selectAll("*").remove();
    svgObj.select(".populationLabels").selectAll("*").remove();
    svgObj.select(".xAxisGroup").remove();
    svgObj.append("g")
        .attr("transform", `translate(0, ${height})`)
        .classed("xAxisGroup", true)
        .call(d3.axisBottom(xScale).tickValues(populationData.map(d => d.population)).tickFormat((d, i) => `${populationData[i].population_text} (${populationData[i].population.toLocaleString()})`));
    d3.select(".xAxisGroup").append("text")
        .attr("x", width + 10)
        .attr("y", 5)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text("Population →");
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
    d3.select(this)
        .style("opacity", 0.9);
    let text = "";
    if (d.analogyType == "recurring") {
        text = `${monthToStringMap[d.time]} of ${d.costName} for ${d.population_text} amounts to $${(d.amountTo).toLocaleString()} (~${(d.amountTo / amount).toFixed(1)}x target amount)`;
    } else {
        let amountTo = d.cost * d.populationObj.population;
        text = d.isTop5 ? 
            `${d.population_text} getting ${d.name} ($${d.cost.toLocaleString()}) amounts to $${amountTo.toLocaleString()} (~${(amountTo / amount).toFixed(1)}x target amount)`
            : `${Math.round(d.population).toLocaleString()} people get ${d.name} ($${d.cost.toLocaleString()})`;
    }
    let tp = d3.select("#timeCompTooltip").style("display", "block")
        .html(text)
        .style("left", (e.x + 10) + "px")
        .style("top", (e.y + "px"));
    if (d.isTop5) {
        d3.select(`#analogy${d.rank}`).classed("highlightedAnalogy", true);
    }
};
let tooltipMouseleave = function (e, d) {
    d3.selectAll(".highlightedAnalogy").classed("highlightedAnalogy", false);
    d3.select(this)
        .style("opacity", 0.6);
    d3.select("#timeCompTooltip")
        .transition()
        .duration(100)
        .style("display", "none");
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
        obj.populationObj = closestPopDot;
        obj.population_text = closestPopDot.population_text;
        obj.pop = closestPopDot.population;
        obj.analogyType = "onetime";
        analogyBank.push(obj);
    });
    applyEnergyFunction(analogyBank);
    analogyBank.sort((a, b) => {
        if (userProfile.school == "")
            return a.diff - b.diff;
        let scoreDiff = a.score.total - b.score.total;
        if (scoreDiff != 0) return scoreDiff;
        let popDiff = a.score.populationScore - b.score.populationScore;
        if (popDiff != 0) return popDiff;
        return a.diff - b.diff;
    });
    analogyBank.forEach((a, ind) => {
        a.isTop5 = ind < 5 ? true : false;
        a.rank = ind;
    })
    currBestAnalogies = analogyBank.slice(0, 5);
    updateAnalogies();
    drawOrUpdateDots();
    drawOrUpdateOnetimeCostDots();
}

function applyEnergyFunction(analogies) {
    analogies.forEach(analogy => {
        // amount accuracy
        let accuracyScore = 0;
        if (analogy.diff >= 0.05 && analogy.diff < 0.1) {
            accuracyScore = 1; 
        } else if (analogy.diff >= 0.1) {
            accuracyScore = analogy.diff * 20;
        }
        // population
        let populationScore = 0;
        if (analogy.populationObj.major == userProfile.major) {
            if (analogy.populationObj.level == userProfile.level && analogy.populationObj.gender == userProfile.gender) {
                populationScore = 0;
            } else if (analogy.populationObj.level == userProfile.level) {
                populationScore = 0.5;
            } else {
                populationScore = 1;
            }
        } else {
            if (["All Stanford Students", "The State of California Population"].includes(analogy.populationObj.population_text)) {
                populationScore = 1;
            } else if (analogy.populationObj.school == userProfile.school) {
                populationScore = 2;
            } else if (analogy.populationObj.school != undefined) {
                populationScore = 3;
            } else {
                populationScore = 4;
            }
        }
        // time
        let timeScore = 0;  // one-time costs get no penalty
        if (analogy.analogyType == "recurring") {
            if (analogy.time == 1 || analogy.time == 2.3) {
                timeScore = 0;
            } else if ((analogy.time * 10) % 23 == 0 || analogy.time == 12 || analogy.time == 24) { // multiple of a quarter
                timeScore = 1;
            } else if (analogy.populationObj.level == "undergrad" && (analogy.time == 36 || analogy.time == 48)) {
                timeScore = 1;
            } else {
                timeScore = 2;
            }
        }
        // car
        let carScore = 0;
        if (userProfile.car == "no") {
            if (analogy.name == "12 gallons of gas") {  // gas not useful to non car owners
                carScore = 3;
            }
        } else {    // car owners less aware of car prices
            if (["a Toyota Corolla", "a Toyota Prius", "a Tesla Model 3"].includes(analogy.name)) {
                carScore = 2;
            }
        }
        analogy.score = {
            total: accuracyScore + populationScore + timeScore + carScore,
            accuracyScore: accuracyScore,
            populationScore: populationScore,
            timeScore: timeScore,
            carScore: carScore
        };
    });
}

function updateAnalogies() {
    currBestAnalogies.forEach((analogy, index) => {
        let elementId = "analogy" + index;
        if (analogy.analogyType == "recurring") {
            d3.select(`#${elementId}`).select(".analogySentenceOnetime").style("display", "none");
            d3.select(`#${elementId}`).select(".analogySentence").style("display", "block");
            d3.select(`#${elementId}`).select(".analogyPop").html(analogy.population_text);
            d3.select(`#${elementId}`).select(".analogyTime").html(monthToStringMap[analogy.time]);
            d3.select(`#${elementId}`).select(".monthlyCostAmount").html(`${analogy.costName} ($${analogy.unitCost.toLocaleString()} per ${analogy.timeUnit == 1 ? "month" : "quarter"})`);
            d3.select(`#${elementId}`).select(".popNumber").html(analogy.population.toLocaleString());
            //currAnalogyDot = d3.select(`#c${Number.isInteger(currBestAnalogy.time) ? currBestAnalogy.time : currBestAnalogy.time * 10}c${currBestAnalogy.id}`).style('opacity', 0.8);
        } else {
            d3.select(`#${elementId}`).select(".analogySentenceOnetime").style("display", "block");
            d3.select(`#${elementId}`).select(".analogySentence").style("display", "none");
            d3.select(`#${elementId}`).select(".analogyPopOnetime").html(analogy.population_text);
            d3.select(`#${elementId}`).select(".analogyCostType").html(`${analogy.name} ($${analogy.cost.toLocaleString()})`);
            d3.select(`#${elementId}`).select(".popNumber").html(analogy.pop.toLocaleString());
            d3.select("#analogyCostType").html(`${analogy.name} ($${analogy.cost.toLocaleString()})`);
        }
    });
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

function switchDisplayType () {
    currAnalogyType = (currAnalogyType + 1) % 2;
    d3.select("#switchButtonText").html(currAnalogyType == 0 ? "Visualization View" : "Tweet View");
    if (currAnalogyType == 1) {
        hideOrDisplayById("tweetComponent", false);
        hideOrDisplayById("vizContainer");
    } else {
        hideOrDisplayById("tweetComponent");
        hideOrDisplayById("vizContainer", false);
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
    var select = document.getElementById('school');
    userProfile.school = select.options[select.selectedIndex].value;
    select = document.getElementById('gender');
    userProfile.gender = select.options[select.selectedIndex].value;
    select = document.getElementById('level');
    userProfile.level = select.options[select.selectedIndex].value;
    select = document.getElementById('major');
    userProfile.major = select.options[select.selectedIndex].value;
    select = document.getElementById('car');
    userProfile.car = select.options[select.selectedIndex].value;
    let pData = allPopulationData;
    if (userProfile.major != "") {
        pData = pData.concat(majorsData[userProfile.school][userProfile.major]);
    }
    populationData = pData.filter((pop) => {
        if (pop.school == undefined) {  // keep all general populations
            return true;
        }
        return Object.keys(userProfile).filter(infoType => infoType != "car" && infoType != "major").every(infoType => {
            return pop[infoType] == "all" || pop[infoType] == userProfile[infoType];
        });
    });
    drawPopulationLines(timeCompSvg, x);
    recurringData = allRecurringData.filter(recurr => {
        if (recurr.nonstudent) return false;
        if (recurr.type == "tuition") {
            if (recurr.school == "all") {
                return recurr.level == userProfile.level;
            } else {
                return recurr.school == userProfile.school && recurr.level == userProfile.level;
            }
        }
        return true;
    });
    updateDots();
}


let tweetPrefix = "https://twitter.com/x/status/"

function changeTweet(next) {
    currentTweetId = next ? currentTweetId + 1: currentTweetId - 1;
    let tweetObj = tweets[currentTweetId];
    d3.select(".twitter-tweet-rendered").remove();
    d3.select("#tweetContainer").append("blockquote").classed("twitter-tweet", true);
    d3.select("blockquote").append("a").attr("href", `${tweetPrefix}${tweetObj.tweet_id}`);
    updateAmount(parseInt(tweetObj.int_amount));
    twttr.widgets.load(
        document.getElementById("tweetContainer")
    );
}