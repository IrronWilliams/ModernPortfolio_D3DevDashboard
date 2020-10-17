import React from "react"
import * as d3 from "d3"

/*
Like other components, MedianLine includes imports, a constructor that sets up D3 objects, 
an updateD3 method that keeps them in sync, and a render method that outputs SVG.

Begin with a scale for vertical positioning – yScale. It's linear, takes values from 0 to max, 
and translates them to pixels less some margin. For the medianValue, use props, or calculate my 
own, if needed. 

A translate SVG transform helps position the line and label. Use it all to return a <g> grouping 
element containing a <text> for our label, and a <path> for the line.

Building the d attribute for the path, use a line generator from D3.It comes from the d3-shape 
package and generates splines, or polylines. By default, it takes an array of points and builds a 
line through all of them. A line from [0, 5] to [width, 5] in this case. That makes it span the 
entire width and leaves 5px for the label. We're using a transform on the entire group to 
vertically position the final element.



*/


const MedianLine = ({
  data,
  value,
  width,
  height,
  x,
  y,
  bottomMargin,
  median,
}) => {
    const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, value)])
    .range([height - y - bottomMargin, 0]),

    line = d3.line()([
    [0, 5],
    [width, 5],
  ])

    const medianValue = median || d3.median(data, value)
    const translate = `translate(${x}, ${yScale(medianValue)})`,

    medianLabel = `Median Household: $${yScale.tickFormat()(median)}`
    
    return (
    <g className="mean" transform={translate}>
        <text
        x={width - 5}
        y="0"
        textAnchor="end"
        style={{ background: "purple" }}
        >
        {medianLabel}
        </text>
        <path d={line} />
    </g>
    )
}

export default MedianLine