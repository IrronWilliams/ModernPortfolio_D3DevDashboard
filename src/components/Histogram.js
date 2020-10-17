/*Will use 2 components for the histogram. The Histogram component will will make the general 
layout; will deal with D3, and translating raw data into a histogram. The HistogramBar component
will draw a single bar and label it. 

First step is to stub out the histogram based upon props passed by the Histogram component in App.js

Const histograms: configures the histogram generator(); thresholds specify how many bins I want 
and value specifies the value accessor function. Both come from props passed into the Histogram 
component.This makes 20 bins, and the value accessor returns each data point's base_salary.

Const bars: feeds the data prop into our histogram generator, and counts how many values are 
in each bin with a .map call. Will need those to configure the scales.

Console logging the result of histogram(), you'll see an array structure where each entry holds 
metadata about the bin and the values it contains. This info can be used to set up the scales. 

Const widthScale: has a range from the smallest (d3.min) bin to the largest (d3.max), and a range 
of 0 to width less a margin. Will use it to calculate bar sizes.

Const yScale: has a range from 0 to the largest x1 coordinate we can find in a bin. Bins go from 
x0 to x1, which reflects the fact that most histograms are horizontally oriented. This one will be
vertical so that labels are easier to read. The range goes from 0 to the maximum height less a 
margin.

Render/Return: Take everything I need out of state and props with destructuring, call histogram() 
on the data to get a list of bars, and render. Render method returns a <g> grouping element 
transformed to the position given in props and walks through the bars array, calling makeBar 
for each. This is a great example of React's declarativeness. I have a bunch of stuff, and all it 
takes to render is a loop. No need to worry about how it renders, where it goes, or anything 
like that. Walk through data, render, done. Setting the key prop is important. React uses it to 
tell the bars apart and only re-render those that change.



*/

import React from "react"
import * as d3 from "d3"
import Axis from './Axis'

//stubbing out the histogram 
const Histogram = ({
  bins,
  width,
  height,
  x,
  y,
  data,
  axisMargin,
  bottomMargin,
  value,
}) => {
    const histogram = d3.histogram().thresholds(bins).value(value)
    
    const bars = histogram(data),
      counts = bars.map((d) => d.length)
    
    const widthScale = d3
      .scaleLinear()
      .domain([d3.min(counts), d3.max(counts)])
      .range([0, width - axisMargin])
    
    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bars, (d) => d.x1)])
      .range([height - y - bottomMargin, 0])

    //console.log('Bars', bars)
  
    return(
        <g className="histogram" transform={`translate(${x}, ${y})`}>
            <g className="bars">
            {bars.map((bar) => (
                <HistogramBar
                percent={(bar.length / data.length) * 100}
                x={axisMargin}
                y={yScale(bar.x1)}
                width={widthScale(bar.length)}
                height={yScale(bar.x0) - yScale(bar.x1)}
                key={`histogram-bar-${bar.x0}`}
                />
            ))}
            </g>
            <Axis x={axisMargin - 3} y={0} data={bars} scale={yScale} /> {/*rendering Axis component */}
        </g>
    )
}

/*
Need another component for the histogram to display, so creating HistogramBar. Could have put all
code in once function, but it makes sense to keep separate. Better future flexibility.

Can write small components like this in the same file as their main component. 
They're not reusable since they fit a specific use-case, and they're small enough so 
my files don't get too out of hand.

Destruct props passed from the Histogram component (App.js). Begin by deciding how much precision 
to put in the label. Want to make the smaller bars easier to read. 

Then render a rectangle for the bar and add a text element for the label. Positioning based on 
size.
*/
const HistogramBar = ({ percent, x, y, width, height }) => {
    let translate = `translate(${x}, ${y})`,
      label = percent.toFixed(0) + "%"
    if (percent < 1) {
      label = percent.toFixed(2) + "%"
    }
    if (width < 20) {
      label = label.replace("%", "")
    }
    if (width < 10) {
      label = ""
    }
    return (
      <g transform={translate} className="bar">
        <rect width={width} height={height - 2} transform="translate(0, 1)" />
        <text textAnchor="end" x={width - 5} y={height / 2 + 3}>
          {label}
        </text>
      </g>
    )
  }


export default Histogram