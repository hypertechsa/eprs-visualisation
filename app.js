let height = 420;
let width = parseInt(d3.select("#svganchor").style("width"), 10);
let margin = { top: 2, right: 10, bottom: 34, left: 10 };

// Data structure describing chart scales
let Scales = {
  lin: "scaleLinear",
  log: "scaleLog",
};

// Data structure describing volume of displayed data
let Count = {
  total: "Default view",
  perCap: "Member states",
};

// Data structure describing legend fields value
let Legend = {
  total: "Age, ",
  perCap: "Age ",
};

let chartState = {};

chartState.measure = Count.total;
chartState.scale = Scales.lin;
chartState.legend = Legend.total;

// Colors used for circles depending on continent


let parties = d3
  .scaleOrdinal()
  .domain(["S&D", "EPP", "NI", "GUE/NGL", "Renew", "Greens-EFA", "ECR", "ID"])
  .range([
    "#f0001b",
    "#3399fe",
    "#c3c3c3",
    "#b71c1c",
    "#ffd601",
    "#56b45f",
    "#196ba8",
    "#154288",
  ]);



let svg = d3
  .select("#svganchor")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

let xScale = d3
  .scaleLinear()
  .range([margin.left + 50, width - margin.right - 50]);
let yScale = d3.scalePoint();

svg
  .append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + (margin.top + 25) + ")");

svg
  .append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + (margin.left + 50) + ",0)");

let annotationTicksStart = svg.append("line").attr("stroke", "#707070");

let annotationTicksEnd = svg.append("line").attr("stroke", "#707070");

// Create line that connects circle and X,Y axis
let xLine = svg
  .append("line")
  .attr("stroke", "rgb(96,125,139)")
  .attr("stroke-dasharray", "1,2");

let yLine = svg
  .append("line")
  .attr("stroke", "rgb(96,125,139)")
  .attr("stroke-dasharray", "1,2");

//Create tooltip div and make it invisible
let tooltip = d3
  .select("#svganchor")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

let tooltip2 = d3
  .select("#svganchor")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Load and process data
d3.csv("data/mep-data.csv")
  .then(function (data) {
    let dataSet = data;
    let countries = [...new Set(dataSet.map((d) => d.country))];
    let minAge = d3.min(
      d3.extent(data, function (d) {
        return +d.age;
      })
    );

    let maxAge = d3.max(
      d3.extent(data, function (d) {
        return +d.age;
      })
    );

    let agePerCountry = {};

    let currentWidth = parseInt(d3.select("#svganchor").style("width"), 10);
    let radius = Array.apply(null, Array(705)).map(function () {
      return 3;
    });
    xScale = d3
      .scaleLinear()
      .range([margin.left + 80, currentWidth - margin.right - 50]);

    yScale = d3.scalePoint().range([height - margin.bottom, margin.top + 50]);
    xScale.domain([25, 85]);
    yScale.domain(["All"]);
    let centerAnnotation = [
      {
        note: {
          label:
            "The majority of MEPs are aged between 41 and 60 years old. The average MEP age is 52 years old.",
          wrap: 250,
          padding: 10,
        },
        type: d3.annotationXYThreshold,
        color: ["#707070"],
        x: xScale(44),
        y: yScale("All") + 100,
        dy: 50,
        dx: 0,
        subject: {
          x1: xScale(41),
          x2: xScale(60),
          tick: annotationTicksStart

            .attr("x1", xScale(41))
            .attr("y1", yScale("All") + 100)
            .attr("x2", xScale(41))
            .attr("y2", yScale("All") + 100 - 6),
          tick2: annotationTicksEnd
            .attr("x1", xScale(60))
            .attr("y1", yScale("All") + 100)
            .attr("x2", xScale(60))
            .attr("y2", yScale("All") + 100 - 6),
        },
      },
      {
        note: {
          label: `The youngest MEP is  ${minAge} years old.`,
          wrap: 100,
          padding: 10,
        },
        type: d3.annotationCallout,

        x: xScale(25),
        y: yScale("All") + 20,
        dy: 130,
        dx: 0,
      },
      {
        note: {
          label: `The oldest MEP is ${maxAge} years old`,
          wrap: 90,
          padding: 10,
        },
        type: d3.annotationCallout,
        x: xScale(83),
        y: yScale("All") + 20,
        dy: 130,
        dx: 0,
      },
    ];
    
    // Stop simulation from starting automatically

    let defaultSimulation = d3
      .forceSimulation()
      .force(
        "x",
        d3.forceX(function (d) {
          return xScale(+d["age"]); // This is the desired position
        })
      ) // Increase velocity
      .force(
        "y",
        d3.forceY(function (d) {
          return yScale("All");
        })
      ) // // Apply positioning force to push nodes towards center along Y axis
      .force(
        "collide",
        d3.forceCollide().radius((d, i) => radius[i] + 2)
      )
      .stop();

    initialize();

    d3.selectAll(".countries")
      .on("mousemove", function (d) {
        tooltip.html(
          `
              <div style="height:4px;width:100%;background-color: ${parties(
                d["political_group_abb"]
              )};" class="red-line"></div>
              <div class="container">
              <div class="name"><strong>${d["mep_honorific_prefix"]} ${
            d["mep_given_name"]
          } ${d["mep_family_name"]}</strong></div><hr/>
              <div style="display:flex;" class="elected">
                <div style="text-align: left;width:50%;">Elected by</div>
                <div style="text-align: right;width:50%;"><strong>${
                  d["country"]
                }</strong></div>
              </div><hr/>
            <div style="display:flex;" class="party">
              <div style="text-align: left;width:50%;">Party</div>
              <div style="text-align: right;width:50%;"><strong>${
                d["political_group_abb"]
              }</strong></div>
            </div><hr/>
            <div style="display:flex;" class="age">
              <div style="text-align: left;width:50%;">Age</div>
              <div style="text-align: right;width:50%;"><strong>${
                d["age"]
              }</strong></div>
            </div><hr/>
            </div>`
        );
        if (currentWidth > 500 || width > 500) {
          tooltip
            .style("top", d3.event.pageY - 12 + "px")
            .style("left", d3.event.pageX + 25 + "px")
            .style("opacity", 1);
        } else {
          tooltip
            .style("top", "45%")
            .style("left", margin.left + "px")
            .style("opacity", 1);
        }
      })
      .on("mouseout", function (_) {
        tooltip.style("opacity", 0);
        radius = Array.apply(null, Array(706)).map(function () {
          return 3;
        });
        move();
      });

    d3.selectAll(".countries")
      .on("touchmove", (event) => event.preventDefault())
      .on("mouseover", pointed);

    // Listen to click on "total" and "per capita" buttons and trigger redraw when they are clicked
    d3.selectAll(".measure").on("click", function () {
      let thisClicked = this.value;
      chartState.measure = thisClicked;
      if (thisClicked === Count.total) {
        chartState.legend = Legend.total;
      }
      if (thisClicked === Count.perCap) {
        chartState.legend = Legend.perCap;
      }
      redraw();
    });

    // Trigger filter function whenever checkbox is ticked/unticked

    d3.selectAll("select").on("change", filter);

    function pointed(event) {
      let circle = d3.select(this);
      let index = 0;
      for (const d of data) {
        if (circle._groups[0][0].__data__.mep_identifier == d.mep_identifier)
          radius[index] = 20;
        else radius[index] = 3;
        index++;
      }
      move();
    }

    function initialize() {
      countries.map((item) => {
        var temp = dataSet.filter((data) => data.country === item);
        var minAge = d3.min(
          d3.extent(temp, function (d) {
            return +d.age;
          })
        );

        var maxAge = d3.max(
          d3.extent(temp, function (d) {
            return +d.age;
          })
        );

        var midAge = d3.sum(temp, (d) => d.age);

        agePerCountry[item] = {
          name: item,
          minAge: minAge,
          maxAge: maxAge,
          midAge: Math.ceil(midAge / temp.length),
        };
      });
      d3.select(".selectedButton").style("display", "none");

      let xAxis;
      let yAxis;
      //  Set X axis based on new scale.

      xAxis = d3.axisTop(xScale).tickSizeOuter(0);
      yAxis = d3
        .axisLeft(yScale)
        .tickSize(-xScale(85) + 50)
        .tickSizeOuter(0);

      d3.transition(svg)
        .select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);

      d3.transition(svg)
        .select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis);

      d3.selectAll(".legend").style("display", "none");
      if (currentWidth > 800) {
        var makeAnnotations = d3.annotation().annotations(centerAnnotation);

        d3.select("svg")
          .append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations);
      } else {
        annotationTicksEnd.style("display", "none");
        annotationTicksStart.style("display", "none");
      }

      if (currentWidth > 500) {
        // d3.select(".y .axes").style("display","contents")
        d3.select(".y").style("opacity", 1);
      } else {
        d3.select(".y").style("opacity", 0);
      }
      // Create simulation with specified dataset
      defaultSimulation.alphaTarget(0.1);
      defaultSimulation.nodes(data);

      // Manually run simulation
      for (let i = 0; i < dataSet.length; ++i) {
        defaultSimulation.tick();
      }

      // Create country circles

      // fill bubles with color based on whatever we declare
      let countriesCircles = svg
        .selectAll(".countries")
        .data(data, function (d) {
          return d.country;
        });

      countriesCircles
        .enter()
        .append("circle")
        .attr("class", "countries")
        .attr("fill", function (d) {
          if (d.age == minAge) {
            return "#25891A";
          } else if (d.age == maxAge) {
            return "#0E47C";
          } else {
            return "#BCBCBC";
          }
        })
        .merge(countriesCircles)
        .transition()
        .duration(2000)
        .attr("r", function (d, i) {
          return radius[i];
        })
        .attr("cx", function (d, i) {
          return d.x;
        })
        .attr("cy", function (d, i) {
          return d.y;
        });
    }

    function move() {
      let countries = [...new Set(dataSet.map((d) => d.country))];
      if (chartState.measure == Count.total) {
        // Create simulation with specified dataset
        defaultSimulation.force(
          "x",
          d3.forceX(function (d) {
            return xScale(+d["age"]); // This is the desired position
          })
        );
        defaultSimulation.force(
          "y",
          d3.forceY(function (d) {
            return yScale("All");
          })
        );
        // Manually run simulation
        defaultSimulation.force("collide");
        // Create simulation with specified dataset
        defaultSimulation.alphaTarget(0.1).restart();
        defaultSimulation.nodes(data);
        

        // Manually run simulation
        for (let i = 0; i < 80; i++) {
          defaultSimulation.tick();
        }

        countriesCircles = svg.selectAll(".countries");

        // // Move country circles

        countriesCircles
          .transition()
          .duration(800)
          .attr("cx", function (d, i) {
            return d.x;
          })
          .attr("cy", function (d, i) {
            return d.y;
          })
          .attr("r", function (d, i) {
            return radius[i];
          });
      }

      if (chartState.measure === Count.perCap) {
        defaultSimulation.force(
          "x",
          d3.forceX(function (d) {
            if (countries.length > 0) {
              if (countries.includes(d.country)) return xScale(+d["age"]);
              else return xScale(+d["age"]);
            } else return xScale(+d["age"]); // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
            // This is the desired position
          })
        );
        defaultSimulation.force(
          "y",
          d3.forceY(function (d) {
            if (countries.length > 0) {
              if (countries.includes(d.country)) return yScale(d["country"]);
              else return 2000;
            }
            return 2000;
            // This is the desired position
          })
        );

        // Manually run simulation
        defaultSimulation.force("collide");
        defaultSimulation.nodes(data);

        for (let i = 0; i < 80; i++) {
          defaultSimulation.tick();
        }

        // Move country circles

        if (countries.length > 0) {
          countriesCircles
            .transition()
            .duration(800)
            .attr("fill", function (d, index) {
              if (agePerCountry[d.country].minAge == d.age) {
                return "#25891A";
              } else if (agePerCountry[d.country].maxAge == d.age) {
                return "#0E47CB";
              } else {
                return "#BCBCBC";
              }
            })
            .attr("cx", function (d) {
              return d.x;
            })
            .attr("cy", function (d) {
              return d.y;
            })
            .attr("r", function (d, i) {
              return radius[i];
            });
        } else {
          countriesCircles = svg
            .selectAll(".countries")
            .data(data)
            .attr("cx", 0)
            .attr("cy", function (d) {
              return d.y;
            });
        }
      }
    }

    function redraw() {
      let countries = [...new Set(dataSet.map((d) => d.country))];
      countriesCircles = svg.selectAll(".countries");
      if (chartState.measure == Count.total) {
        height = 420;
        currentWidth = parseInt(d3.select("#svganchor").style("width"), 10);
        svg.attr("height", height).attr("width", currentWidth);
        d3.select(".selectedButton").style("display", "none");
        xScale = d3
          .scaleLinear()
          .range([margin.left + 80, currentWidth - margin.right - 50]);
        yScale = d3
          .scalePoint()
          .range([height - margin.bottom, margin.top + 50]);

        xScale.domain([25, 85]);
        yScale.domain(["All"]);
        centerAnnotation = [
          {
            note: {
              label:
                "The majority of MEPs are aged between 41 and 60 years old. The average MEP age is 52 years old.",
              wrap: 250,
              padding: 10,
            },
            type: d3.annotationXYThreshold,
            color: ["#707070"],
            x: xScale(44),
            y: yScale("All") + 100,
            dy: 50,
            dx: 0,
            subject: {
              x1: xScale(41),
              x2: xScale(60),
              tick: annotationTicksStart
                .attr("x1", xScale(41))
                .attr("y1", yScale("All") + 100)
                .attr("x2", xScale(41))
                .attr("y2", yScale("All") + 100 - 6),
              tick2: annotationTicksEnd
                .attr("x1", xScale(60))
                .attr("y1", yScale("All") + 100)
                .attr("x2", xScale(60))
                .attr("y2", yScale("All") + 100 - 6),
            },
          },
          {
            note: {
              label: `The youngest MEP is  ${minAge} years old.`,
              wrap: 100,
              padding: 10,
            },
            type: d3.annotationCallout,

            x: xScale(25),
            y: yScale("All") + 20,
            dy: 130,
            dx: 0,
          },
          {
            note: {
              label: `The oldest MEP is ${maxAge} years old`,
              wrap: 90,
              padding: 10,
            },
            type: d3.annotationCallout,
            x: xScale(83),
            y: yScale("All") + 20,
            dy: 130,
            dx: 0,
          },
        ];
        let xAxis;
        let yAxis;

        //  Set X axis based on new scale.
        xAxis = d3.axisTop(xScale).tickSizeOuter(0);
        yAxis = d3
          .axisLeft(yScale)
          .tickSize(-xScale(85) + 50)
          .tickSizeOuter(0);
        d3.transition(svg)
          .select(".x.axis")
          .transition()
          .duration(1000)
          .call(xAxis);

        d3.transition(svg)
          .select(".y.axis")
          .transition()
          .duration(1000)
          .call(yAxis);

        d3.selectAll(".annotation-group").remove();
        d3.selectAll(".text-age").remove();
        d3.selectAll(".text-midage").remove();
        d3.selectAll(".line-age").remove();
        d3.selectAll(".legend").style("display", "none");

        if (currentWidth > 800) {
          var makeAnnotations = d3.annotation().annotations(centerAnnotation);
          d3.select("svg")
            .append("g")
            .attr("class", "annotation-group")
            .call(makeAnnotations);
          annotationTicksEnd.style("display", null);
          annotationTicksStart.style("display", null);
        } else {
          annotationTicksEnd.style("display", "none");
          annotationTicksStart.style("display", "none");
        }

        if (currentWidth > 500) {
          // d3.select(".y .axes").style("display","contents")
          d3.select(".y").style("opacity", 1);
        } else {
          d3.select(".y").style("opacity", 0);
        }

        defaultSimulation.force(
          "x",
          d3.forceX(function (d) {
            return xScale(+d["age"]); // This is the desired position
          })
        );
        defaultSimulation.force(
          "y",
          d3.forceY(function (d) {
            return yScale("All");
          })
        );
        // Manually run simulation
        defaultSimulation.force("collide");
        // Create simulation with specified dataset
        defaultSimulation.alphaTarget(0.1).restart();
        defaultSimulation.nodes(data);

        // Manually run simulation
        for (let i = 0; i < data.length; ++i) {
          defaultSimulation.tick();
        }

        countriesCircles = svg.selectAll(".countries");

        // // Move country circles

        countriesCircles
          .transition()
          .duration(1000)
          .attr("fill", function (d) {
            if (d.age == minAge) {
              return "#25891A";
            } else if (d.age == maxAge) {
              return "#0E47CB";
            } else {
              return "#BCBCBC";
            }
          })

          .attr("cx", function (d, i) {
            return d.x;
          })
          .attr("cy", function (d, i) {
            return d.y;
          })
          .attr("r", function (d, i) {
            return radius[i];
          });
      }

      if (chartState.measure === Count.perCap) {
        d3.selectAll(".text-age").remove();
        d3.selectAll(".text-midage").remove();
        d3.selectAll(".line-age").remove();
        d3.selectAll(".legend").style("display", null);
        d3.select(".y").style("opacity", 1);

        if (countries.length < 10) {
          height = 10 * 40;
        } else {
          height = countries.length * 40;
        }

        let currentWidth = parseInt(d3.select("#svganchor").style("width"), 10);
        svg.attr("height", height).attr("width", currentWidth);
        // d3.select("svg").style("height",countries.length*50)

        d3.select(".selectedButton").style("display", null);
        if (currentWidth > 500) {
          xScale = d3
            .scaleLinear()
            .range([margin.left + 80, currentWidth - margin.right - 50]);
          yScale = d3
            .scalePoint()
            .range([height - margin.bottom, margin.top + 50]);
        } else {
          xScale = d3
            .scaleLinear()
            .range([margin.left + 80, currentWidth - margin.right]);
          yScale = d3
            .scalePoint()
            .range([height - margin.bottom, margin.top + 50]);
        }
        xScale.domain([25, 85]);

        yScale.domain(countries);

        let xAxis;
        let yAxis;
        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point

        xAxis = d3.axisTop(xScale).tickSizeOuter(0);

        yAxis = d3
          .axisLeft(yScale)
          .tickSize(-xScale(85) + 50)
          .tickSizeOuter(0);
        d3.selectAll(".annotation-group").remove();
        annotationTicksEnd.style("display", "none");
        annotationTicksStart.style("display", "none");
        d3.transition(svg)
          .select(".x.axis")
          .transition()
          .duration(1000)
          .call(xAxis);

        d3.transition(svg)
          .select(".y.axis")
          .attr("transform", "translate(" + (margin.left + 50) + ",0)")
          .transition()
          .duration(1000)
          .call(yAxis);

        // let memberSimulation = d3
        // .forceSimulation(data)
        // // Apply positioning force to push nodes towards desired position along X axis

        // .force(
        //   "x",
        //   d3.forceX(function (d) {
        //     if (countries.length > 0) {
        //       if (countries.includes(d.country)) return xScale(+d["age"]);
        //       else return xScale(+d["age"]);
        //     } else return xScale(+d["age"]); // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
        //     // This is the desired position
        //   })
        // )
        // .force(
        //   "y",
        //   d3.forceY(function (d) {
        //     if (countries.length > 0) {
        //       if (countries.includes(d.country)) return yScale(d["country"]);
        //       else return 2000;
        //     }
        //     return 2000;
        //     // This is the desired position
        //   })
        // )
        // .force("collide", d3.forceCollide().radius((d,i)=> radius[i]+1)) // // Apply positioning force to push nodes towards center along Y axis
        defaultSimulation.force(
          "x",
          d3.forceX(function (d) {
            if (countries.length > 0) {
              if (countries.includes(d.country)) return xScale(+d["age"]);
              else return xScale(+d["age"]);
            } else return xScale(+d["age"]); // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
            // This is the desired position
          })
        );
        defaultSimulation.force(
          "y",
          d3.forceY(function (d) {
            if (countries.length > 0) {
              if (countries.includes(d.country)) return yScale(d["country"]);
              else return 2000;
            }
            return 2000;
            // This is the desired position
          })
        );
        // Manually run simulation
        defaultSimulation.force("collide");
        defaultSimulation.nodes(data);
        // Stop simulation from starting automatically

        // Manually run simulation
        for (let i = 0; i < data.length; ++i) {
          defaultSimulation.tick();
        }
        // Move country circles
        // countriesCircles = svg.selectAll(".countries");

        if (countries.length > 0) {
          countriesCircles
            .transition()
            .duration(1000)
            .attr("fill", function (d, index) {
              if (agePerCountry[d.country].minAge == d.age) {
                return "#25891A";
              } else if (agePerCountry[d.country].maxAge == d.age) {
                return "#0E47CB";
              } else {
                return "#BCBCBC";
              }
            })
            .attr("cx", function (d) {
              return d.x;
            })
            .attr("cy", function (d) {
              return d.y;
            })
            .attr("r", function (d, i) {
              return radius[i];
            });
        } else {
          countriesCircles = svg
            .selectAll(".countries")
            .data(data)
            .attr("cx", 0)
            .attr("cy", function (d) {
              return d.y;
            });
        }

        for (const d of dataSet) {
          //   svg.append("text").attr("class","text-age")
          // .attr('x',function(){

          //   return xScale(d.age)-10
          // })
          // .attr('y',function(){
          //   return yScale(d.country)-20
          // })
          // .attr("dy", ".35em")
          // .style("fill",function(){
          //   if(agePerCountry[d.country].minAge==d.age){
          //     return "#25891A"
          //   }else if(agePerCountry[d.country].midAge==d.age)
          //   {return "#3B3A3A"}
          //   else if(agePerCountry[d.country].maxAge==d.age){return "#0E47CB"}
          // })
          // .text(function(){
          //   if(agePerCountry[d.country].minAge==d.age||agePerCountry[d.country].maxAge==d.age)
          //          return d.age
          // })

          // svg.append("text").attr("class","text-midage")
          // .attr('x',function(){

          //   return xScale(agePerCountry[d.country].midAge)-10
          // })
          // .attr('y',function(){
          //   return yScale(d.country)-20
          // })
          // .attr("dy", ".35em")
          // .style("fill","#3B3A3A")
          // .text(function(){

          //          return agePerCountry[d.country].midAge
          // })

          svg
            .append("line")
            .attr("stroke", "#1A438F")
            .attr("class", "line-age")
            .attr("x1", xScale(agePerCountry[d.country].midAge))
            .attr("y1", yScale(d.country) + 12)
            .attr("x2", xScale(agePerCountry[d.country].midAge))
            .attr("y2", yScale(d.country) - 12);
        }
      }
    }

    window.addEventListener("resize", redraw);
    // Filter data based on which checkboxes are ticked

    function filter() {
      function getCheckedBoxes(checkboxName) {
        let checkboxes = d3.selectAll(checkboxName).nodes();

        let checkboxesChecked = [];
        for (let i = 0; i < 27; i++) {
          if (checkboxes[i].selected) {
            checkboxesChecked.push(checkboxes[i].value);
          }
        }
        return checkboxesChecked.length > 0 ? checkboxesChecked : null;
      }

      let checkedBoxes = getCheckedBoxes(".country");

      let newData = [];

      if (checkedBoxes == null) {
        dataSet = newData;
        redraw();
        return;
      }

      for (let i = 0; i < checkedBoxes.length; i++) {
        let newArray = data.filter(function (d) {
          return d.country === checkedBoxes[i];
        });
        Array.prototype.push.apply(newData, newArray);
      }

      dataSet = newData;
      redraw();
    }
  })
  .catch(function (error) {
    if (error) throw error;
  });
