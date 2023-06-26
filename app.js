let height = 480;
let width = parseInt(d3.select('#svganchor').style('width'), 10);
let margin = { top: 10, right: 40, bottom: 34, left: 40 };


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
let colors = d3
  .scaleOrdinal()
  .domain([
    "asia",
    "africa",
    "northAmerica",
    "europe",
    "southAmerica",
    "oceania",
  ])
  .range(["#D81B60", "#1976D2", "#388E3C", "#BCBCBC", "#E64A19", "#455A64"]);

d3.select("#asiaColor").style("color", colors("asia"));
d3.select("#africaColor").style("color", colors("africa"));
d3.select("#northAmericaColor").style("color", colors("northAmerica"));
d3.select("#southAmericaColor").style("color", colors("southAmerica"));
d3.select("#europeColor").style("color", colors("europe"));
d3.select("#oceaniaColor").style("color", colors("oceania"));

let svg = d3
  .select("#svganchor")
  .append("svg")
  .attr("width", width)
  .attr("height", height);
  

let xScale = d3.scaleLinear().range([margin.left+50, width - margin.right-50]);
let yScale = d3.scalePoint();

svg
  .append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + (margin.top+10) + ")");

svg
  .append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + (width) + ",0)");

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
    let allcountries = [...new Set(dataSet.map((d) => d.country))];
    initialize();
    //redraw();

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
    
    
    
    

    function initialize() {
      d3.select(".selectedButton").style("display","none")
      xScale = d3.scaleLinear().range([margin.left+50, width - margin.right-50]);
      yScale = d3.scalePoint().range([height-margin.bottom, margin.top+50]);
      xScale.domain(
        d3.extent(dataSet, function (d) {
          return +d["age"];
        })
      );
      
      let xAxis;
      let yAxis;
      //  Set X axis based on new scale.
      
      yScale.domain(["All"]);
      const centerAnnotation = [
        {
          note: {
            label: "The majority of MEPs are aged between 41 and 60 years old. The average MEP age is 52 years old."
          },
          type: d3.annotationCalloutCircle,
          subject: {
            radius: 180,         // circle radius
            radiusPadding: 30   // white space around circle befor connector
          },
          color: ["#707070"],
          x: xScale(54),
          y: yScale("All"),
          dy: 180,
          dx: 250
        },
        {
          note: {
            label: "The youngest MEP is 24 years old.",
            wrap: 150
          },
          connector: {
            color: ["#25891A"],
            end: "dot",
            type: "curve",
            //can also add a curve type, e.g. curve: d3.curveStep
            // points: [[100, 14],[190, 52]]
          },
          x: xScale(25),
          y: yScale("All"),
          dy: 137,
          dx: 262
        },
        {
          note: {
            label: "The oldest MEP is 85 years old",
            wrap: 150
          },
          connector: {
            color: ["#25891A"],
            end: "dot",
            type: "curve",
            //can also add a curve type, e.g. curve: d3.curveStep
            // points: [[100, 14],[190, 52]]
          },
          x: xScale(83),
          y: yScale("All"),
          dy: 137,
          dx: -10
        },
      ]
      xAxis = d3.axisTop(xScale).tickSizeOuter(0);
      yAxis = d3.axisLeft(yScale).tickSize(width-margin.right).tickSizeOuter(0);
      d3.transition(svg)
        .select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);
      
        d3.transition(svg)
        .select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis)

        var makeAnnotations = d3.annotation()
                .annotations(centerAnnotation)

      d3.select("svg")
        .append("g")
        .attr("class", "annotation-group")
        .call(makeAnnotations)
        //.attr("transform", "translate(" + (margin.left+10 ) + ",0)");
      // Create simulation with specified dataset
      let simulation = d3
        .forceSimulation(dataSet)
        //  Apply positioning force to push nodes towards desired position along X axis
        .force(
          "x",
          d3
            .forceX(function (d) {
                     // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
              return xScale(+d["age"] ); // This is the desired position
            })
        ) // Increase velocity
        .force("y", d3.forceY(yScale("All"))) // // Apply positioning force to push nodes towards center along Y axis
        .force("collide", d3.forceCollide(5)) // Apply collision force with radius of 8 - keeps nodes centers 8 pixels apart
        .stop(); // Stop simulation from starting automatically

      // Manually run simulation
      for (let i = 0; i < dataSet.length; ++i) {
        simulation.tick();
      }

      // Create country circles
      let countriesCircles = svg
        .selectAll(".countries")
        .data(dataSet, function (d) {
          return d.country;
        });

      
      // fill bubles with color based on whatever we declare
      countriesCircles
        .enter()
        .append("circle")
        .attr("class", "countries")
        .attr("cx", 0)
        .attr("cy",yScale("All"))
        .attr("r", 3)
        .attr("fill", function (d) {
          return colors("europe");
        })
        //.attr("fill", function(d){ return colors(d.continent)})
        .merge(countriesCircles)
        .transition()
        .duration(2000)
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });


        d3.selectAll(".countries")
          .on("mousemove", function (d) {
            tooltip
              .html(
                `
                  <div style="height:4px;width:100%;" class="red-line"></div>
                  <div class="container">
                  <div class="name"><h2>${d["mep_honorific_prefix"]} ${d["mep_given_name"]} ${d["mep_family_name"]}</h2></div><hr/>
                  <div style="display:flex;" class="elected">
                    <div style="text-align: left;width:50%;"><h5>Elected by</h5></div>
                    <div style="text-align: right;width:50%;"><h5><strong>${d["country"]}</strong></h5></div>
                  </div><hr/>
                <div style="display:flex;" class="party">
                  <div style="text-align: left;width:50%;"><h5>Party</h5></div>
                  <div style="text-align: right;width:50%;"><h5><strong>${d["political_group_abb"]}</strong></h5></div>
                </div><hr/>
                <div style="display:flex;" class="age">
                  <div style="text-align: left;width:50%;"><h5>Age</h5></div>
                  <div style="text-align: right;width:50%;"><h5><strong>${d["age"]}</strong></h5></div>
                </div><hr/>
                </div>`
              )
              .style("top", d3.event.pageY - 12 + "px")
              .style("left", d3.event.pageX + 25 + "px")
              .style("opacity", 1);

            
          })
          .on("mouseout", function (_) {
            tooltip.style("opacity", 0);
            xLine.attr("opacity", 0);
          });
    }

    function redraw() {
      
      let countries = [...new Set(dataSet.map((d) => d.country))];
      if (chartState.measure == Count.total) {
        height=480;
        let currentWidth = parseInt(d3.select('#svganchor').style('width'), 10);
        svg.attr("height",height).attr("width",currentWidth)
        // d3.select("svg").style("height",480)
        d3.select(".selectedButton").style("display","none")
        xScale = d3.scaleLinear().range([margin.left+50, currentWidth - margin.right-50]);
        yScale = d3.scalePoint().range([height-margin.bottom, margin.top+50]);
      
        xScale.domain(
        d3.extent(data, function (d) {
          return +d["age"];
        })
        );

      let xAxis;
      let yAxis;
      //  Set X axis based on new scale.
      
      yScale.domain(["All"]);

      const centerAnnotation = [
        {
          note: {
            label: "The majority of MEPs are aged between 41 and 60 years old. The average MEP age is 52 years old."
          },
          type: d3.annotationCalloutCircle,
          subject: {
            radius: 180,         // circle radius
            radiusPadding: 30   // white space around circle befor connector
          },
          color: ["#707070"],
          x: xScale(54),
          y: yScale("All"),
          dy: 180,
          dx: 250
        },
        {
          note: {
            label: "The youngest MEP is 24 years old.",
            wrap: 150
          },
          connector: {
            color: ["#25891A"],
            end: "dot",
            type: "curve",
            //can also add a curve type, e.g. curve: d3.curveStep
            // points: [[100, 14],[190, 52]]
          },
          x: xScale(25),
          y: yScale("All"),
          dy: 137,
          dx: 262
        },
        {
          note: {
            label: "The oldest MEP is 85 years old",
            wrap: 150
          },
          connector: {
            color: ["#25891A"],
            end: "dot",
            type: "curve",
            //can also add a curve type, e.g. curve: d3.curveStep
            // points: [[100, 14],[190, 52]]
          },
          x: xScale(83),
          y: yScale("All"),
          dy: 137,
          dx: -10
        },
      ]

      xAxis = d3.axisTop(xScale);
      yAxis = d3.axisLeft(yScale).tickSize(width-margin.right);
      d3.transition(svg)
        .select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis);
      
        d3.transition(svg)
        .select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis)

        var makeAnnotations = d3.annotation()
        .annotations(centerAnnotation)
        d3.selectAll(".annotation-group").remove();
      d3.select("svg")
      .append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations)    

        // Create simulation with specified dataset
        let simulation = d3
          .forceSimulation(data)
                        //  Apply positioning force to push nodes towards desired position along X axis
          .force(      // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
            "x",
            d3.forceX(function (d) {
              
              return xScale(+d["age"]);
             
            })
          )

          // Increase velocity
          .force("y", d3.forceY(yScale("All") )) // // Apply positioning force to push nodes towards center along Y axis
          .force("collide", d3.forceCollide(5)) // Apply collision force with radius of 8 - keeps nodes centers 8 pixels apart
          .stop(); // Stop simulation from starting automatically

        // Manually run simulation
        for (let i = 0; i < data.length; ++i) {
          simulation.tick();
        }
       

        // Create country circles
         countriesCircles = svg
          .selectAll(".countries")
          
        
          countriesCircles
          .transition()
          .duration(2000)
          .attr("cx", function (d) {
            return d.x;
          })
          .attr("cy", function (d) {
            return d.y;
          }); 

        

        // Show tooltip when hovering over circle (data for respective country)
        d3.selectAll(".countries")
          .on("mousemove", function (d) {
            tooltip
              .html(
                `
                  <div style="height:4px;width:100%;" class="red-line"></div>
                  <div class="container">
                  <div class="name"><h2>${d["mep_honorific_prefix"]} ${d["mep_given_name"]} ${d["mep_family_name"]}</h2></div><hr/>
                  <div style="display:flex;" class="elected">
                    <div style="text-align: left;width:50%;"><h5>Elected by</h5></div>
                    <div style="text-align: right;width:50%;"><h5><strong>${d["country"]}</strong></h5></div>
                  </div><hr/>
                <div style="display:flex;" class="party">
                  <div style="text-align: left;width:50%;"><h5>Party</h5></div>
                  <div style="text-align: right;width:50%;"><h5><strong>${d["political_group_abb"]}</strong></h5></div>
                </div><hr/>
                <div style="display:flex;" class="age">
                  <div style="text-align: left;width:50%;"><h5>Age</h5></div>
                  <div style="text-align: right;width:50%;"><h5><strong>${d["age"]}</strong></h5></div>
                </div><hr/>
                </div>`
              )
              .style("top", d3.event.pageY - 12 + "px")
              .style("left", d3.event.pageX + 25 + "px")
              .style("opacity", 1);

            
          })
          .on("mouseout", function (_) {
            tooltip.style("opacity", 0);
            xLine.attr("opacity", 0);
          });
      }

      if (chartState.measure === Count.perCap) {
        height=countries.length*40
        let currentWidth = parseInt(d3.select('#svganchor').style('width'), 10);
        svg.attr("height",height).attr("width",currentWidth)
        // d3.select("svg").style("height",countries.length*50)
        
        d3.select(".selectedButton").style("display",null)
        xScale = d3.scaleLinear().range([margin.left+50, currentWidth - margin.right-50]);
        yScale = d3.scalePoint().range([height-margin.bottom, margin.top+50]);
        xScale.domain(
          d3.extent(dataSet, function (d) {
            return +d["age"];
          })
        );
        
        yScale.domain(countries);

        let xAxis;
        let yAxis;
        // Set X axis based on new scale. If chart is set to "per capita" use numbers with one decimal point

        xAxis = d3.axisTop(xScale).tickSizeOuter(0);
        
        yAxis = d3.axisLeft(yScale).tickSize(width-margin.right-margin.left).tickSizeOuter(0);
        d3.selectAll(".annotation-group").remove();
        d3.transition(svg)
          .select(".x.axis")
          .transition()
          .duration(1000)
          .call(xAxis);

        d3.transition(svg)
          .select(".y.axis")
          .attr("transform", "translate(" + (width) + ",0)")
          .transition()
          .duration(1000)
          .call(yAxis);

        // Create simulation with specified dataset
        let simulation = d3
          .forceSimulation(data)
          // Apply positioning force to push nodes towards desired position along X axis

          .force(
            "x",
            d3.forceX(function (d) {
              if(countries.length>0){
                if(countries.includes(d.country))
                return xScale(+d["age"]);
                else
                return xScale(0);}
                else
                return xScale(0) // Mapping of values from age/country column of dataset to range of SVG chart (<margin.left, margin.right>)
               // This is the desired position
            })
          )
          //.force("collide", d3.forceCollide(8)) // Increase velocity
          .force(
            "y",
            d3.forceY(function (d) {
              if(countries.length>0){
              if(countries.includes(d.country))
              return yScale(d["country"]);
              else
              return 0;
              }
              return 0;
              // This is the desired position
            })
          )
          .force("collide", d3.forceCollide(4)) // // Apply positioning force to push nodes towards center along Y axis

          .stop(); // Stop simulation from starting automatically

        // Manually run simulation
        for (let i = 0; i < data.length; ++i) {
          simulation.tick();
          
        }
        ;
        // Create country circles
        countriesCircles = svg
          .selectAll(".countries")
          

          

          if(countries.length>0){
            countriesCircles
            .transition()
            .duration(2000)
            .attr("cx", function (d) {
              return d.x;
            })
            .attr("cy", function (d) {
              return d.y;
            });}
            else{countriesCircles
              .transition()
              .duration(2000)
              .attr("cx", 0)
              .attr("cy", function (d) {
                return d.y;
              });}  
          
          
        // Show tooltip when hovering over circle (data for respective country)
        d3.selectAll(".countries")
          .on("mousemove", function (d) {
            tooltip
            .html(
              `
                <div style="height:4px;width:100%;" class="red-line"></div>
                <div class="container">
                <div class="name"><h2>${d["mep_honorific_prefix"]} ${d["mep_given_name"]} ${d["mep_family_name"]}</h2></div><hr/>
                <div style="display:flex;" class="elected">
                  <div style="text-align: left;width:50%;"><h5>Elected by</h5></div>
                  <div style="text-align: right;width:50%;"><h5><strong>${d["country"]}</strong></h5></div>
                </div><hr/>
              <div style="display:flex;" class="party">
                <div style="text-align: left;width:50%;"><h5>Party</h5></div>
                <div style="text-align: right;width:50%;"><h5><strong>${d["political_group_abb"]}</strong></h5></div>
              </div><hr/>
              <div style="display:flex;" class="age">
                <div style="text-align: left;width:50%;"><h5>Age</h5></div>
                <div style="text-align: right;width:50%;"><h5><strong>${d["age"]}</strong></h5></div>
              </div><hr/>
              </div>`
            )
              .style("top", d3.event.pageY - 12 + "px")
              .style("left", d3.event.pageX + 25 + "px")
              .style("opacity", 1);

            
              
          })
          .on("mouseout", function (_) {
            tooltip.style("opacity", 0);
            xLine.attr("opacity", 0);
            yLine.attr("opacity", 0);
          });
      }
    }

    window.addEventListener('resize', redraw );  
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

