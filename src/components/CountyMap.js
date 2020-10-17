import React from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson' //using topojson library to translate geographical datasets into GeoJSON, which is another way of defining geo data with JSON.
import _ from 'lodash'

/*
The CountyMap components purpose is to focus on a given US state by finding the centroid of a 
polygon, re-centering the map, and increasing the sizing factor. This creates the zoom effect.

The County component/function is built from two parts: imports and color constants, and a component 
that returns a <path>. All the hard calculation happens in CountyMap function. 
The render method uses a quantize scale to pick the right color and returns a <path> element. 
geoPath generates the d attribute, set style to fill the color, and give our path a title.

Need 3 D3 objects to build a choropleth map: a geographical projection, a path generator, and a 
quantize scale for colors. Geographical projections geographical projections map a sphere to a 
flat surface. Using geoAlbersUsa because it's made specifically for maps of the USA.

A geoPath generator takes a projection and returns a function that generates the d attribute of 
<path> elements. This is the most general way to specify SVG shapes,

quantize is a D3 scale. This scale splits a domain into 9 quantiles and assigns them specific values 
from the range. Let's say domain goes from 0 to 90. Calling the scale with any number between 0 and 9 
would return 1. 10 to 19 returns 2 and so on. This will be used to pick colors from an array.

With CountyMap function, destructure projection, quantize, and geoPath out of component state. 
These are the D3 object that will be updated. The projection variable, translate (move) it to the 
center of drawing area and set the scale property. You have to play around with this value until you 
get a nice result because it's different for every projection.

Zoom has not been defined at this time.

The if(zoom && usTopoJson) gets the list of all US state features in the geo data, find the one I'm 
zoom-ing on, and use the geoPath.centroid method to calculate its center point. This gives a new 
coordinate to translate my projection onto.

The calculation in .translate() helps align the center point of the zoom US state with the center of 
the drawing area. Also tweak the .scale property to make the map bigger. This creates a zooming effect.
Then update the quantize scale's domain with new values. 

Using d3.quantile lets me offset the scale to produce a more interesting map. These values discovered 
through experiment - they cut off the top and bottom of the range because there isn't much there. 
This brings higher contrast to the richer middle of the range.
*/

const ChoroplethColors = _.reverse([
    "rgb(247,251,255)",
    "rgb(222,235,247)",
    "rgb(198,219,239)",
    "rgb(158,202,225)",
    "rgb(107,174,214)",
    "rgb(66,146,198)",
    "rgb(33,113,181)",
    "rgb(8,81,156)",
    "rgb(8,48,107)",
  ])
  
const BlankColor = "rgb(240,240,240)" //this is a hue of gray

const County = ({ geoPath, feature, zoom, key, quantize, value }) => {
    let color = BlankColor
    if (value) {
      color = ChoroplethColors[quantize(value)]
    }
    return (
      <path d={geoPath(feature)} style={{ fill: color }} title={feature.id} />
    )
  }

const CountyMap = ({
    usTopoJson, USstateNames, x, y, width, height, zoom, values,
}) => {
    const projection = d3
        .geoAlbersUsa()
        .scale(1280)
        .translate([width / 2, height / 2])
        .scale(width * 1.3)

    const geoPath = d3.geoPath().projection(projection)

    const quantize = d3.scaleQuantize().range(d3.range(9))

    if (zoom && usTopoJson) {
        const us = usTopoJson,
        USstatePaths = topojson.feature(us, us.objects.states).features,
        id = _.find(USstateNames, { code: zoom }).id

        projection.scale(width * 4.5)

        const centroid = geoPath.centroid(_.find(USstatePaths, { id: id })),
        translate = projection.translate()
    
        projection.translate([
        translate[0] - centroid[0] + width / 2,
        translate[1] - centroid[1] + height / 2,
    ])
    }

    if (values) {
    quantize.domain([
        d3.quantile(values, 0.15, (d) => d.value),
        d3.quantile(values, 0.85, (d) => d.value),
    ])
    }
    
/*Rendering Data: Prep data then loop through it and render a County element for each entry.

Use the TopoJSON library to grab data out of the usTopoJson dataset.
.mesh calculates a mesh for US states – a thin line around the edges. 
.feature calculates feature for each count – fill in with color.

Mesh and feature aren't tied to US states or counties by the way. It's just a matter of what you 
get back: borders or flat areas. What you need depends on what you're building.

Use Lodash's _.fromPairs to build a dictionary that maps county identifiers to their values. 
Building it beforehand makes code faster. 

The return statement loops through the list of counties and renders County components. 
Each gets a bunch of attributes and returns a <path> element that looks like a specific county.

For US state borders, render a single <path> element and use geoPath to generate the d attribute.
*/

    if (!usTopoJson) {
        return null
    } else {
        const us = usTopoJson,
        USstatesMesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b),
        counties = topojson.feature(us, us.objects.counties).features
        const countyValueMap = _.fromPairs(values.map((d) => [d.countyID, d.value]))
    return (
      <g>
        {counties.map((feature) => (
          <County
            geoPath={geoPath}
            feature={feature}
            zoom={zoom}
            key={feature.id}
            quantize={quantize}
            value={countyValueMap[feature.id]}
          />
        ))}
        <path
          d={geoPath(USstatesMesh)}
          style={{
            fill: "none",
            stroke: "#fff",
            strokeLinejoin: "round",
          }}
        />
      </g>
    )
  }

}

export default CountyMap