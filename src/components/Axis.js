import React from 'react'
import { useD3 } from 'd3blackbox'  //npm add d3blackbox (library makes it easier to embed d3 code in React)
import * as d3 from 'd3'


/*
Use D3's axis generator based on the type prop and pass in a scale. To render, select the anchor 
element and call the axis generator on it.

To render the Axis, add it to the Histogram component. It's a two step process:
    Import Axis component
    Render it: Add it to the render method with some props. 
               It takes an x and y coordinate, the data, and a scale.

*/

const Axis = ({ x, y, scale, type = 'Left' }) => {
  const gRef = useD3((anchor) => {
    const axis = d3[`axis${type}`](scale)
    d3.select(anchor).call(axis)
  })
  return <g transform={`translate(${x}, ${y})`} ref={gRef} />
}
export default Axis
