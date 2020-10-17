import React, {useEffect, useState} from 'react';
import * as d3 from "d3"
import _ from "lodash"
import styles from './styles.css'

import Preloader from './components/Preloader.js'
import { loadAllData } from "./DataHandling"
//import CountyMap from "./components/CountyMap"
import CountyMap from './components/CountyMapHooks'
import Histogram from "./components/Histogram"
import { Title, Description } from "./components/Meta"
import MedianLine from './components/MedianLine'
import Controls from "./components/Controls"

/*Creating a single piece of state that is a complex object that will hold all datasets. 

Calling the loadAllData() function to load data. The page will re-render 1x with all of the datasets. 

Destructuring the datasets from the function.
*/
function App() {
  const [datasets, setDatasets] = useState({
    techSalaries: [],
    medianIncomes: [],
    countyNames: [],
    usTopoJson: null,
    USstateNames: null,
    medianIncomesByCounty : {},
    medianIncomesByUSState : {},
  }) 

  const {techSalaries, 
        medianIncomes, 
        countyNames, usTopoJson, 
        USstateNames, 
        medianIncomesByCounty,
        medianIncomesByUSState,
      } = datasets
  
  
  /*
  The salariesFilter piece of state will filter the salaries. Will always return true.   
  */

  const [salariesFilter, setSalariesFilter] = useState(() => () => true)

  /*
  Creating state for user-controlled data filtering. The filteredBy state allows user to filter 
  by – 3 options: USstate, year, and jobTitle. They are set to "everything" by default. This 
  will tie to the Title component which takes data and filteredBy props. Will render filteredBy
  in the title. This piece of state is used to inform the titles & descriptions and rudimentary 
  routing. 
  */
  const [filteredBy, setFilteredBy] = useState({
    USstate: "*",
    year: "*",
    jobTitle: "*",
  });

  async function loadData(){
    const datasets = await loadAllData()
    setDatasets(datasets)
  }

  /*countyValue() takes a county entry and a map of tech salaries grouped by countyID and returns the 
  delta between median household income and a single tech salary.Use medianIncomes from state to get 
  the median household salary and the techSalariesMap input to get salaries for a specific census area. 
  Then use d3.median to calculate the median value for salaries and return a two-element dictionary 
  with the result. countyID specifies the county and value is the delta the choropleth display. 
  
  medianHousehold takes each row/countyID from the countyNames dataset and looks for that countyID
  in the medianIncomes dataset. 
  
  salaries takes the techSalariesMap (which are tech salaries grouped by CountyID) and maps the county
  name to the techSalariesMap. Passing in county.name because the name of the county is how the 
  techSalariesMap was grouped. 

  median finds median salaries for each grouping of countyID, ie county of Adams, Ada, Santa Clara
  This is used to find the difference between the median salary of the county and median household
  income. 
  
  */
  function countyValue(county, techSalariesMap) {
    const medianHousehold = medianIncomes[county.id], 
          salaries = techSalariesMap[county.name]   
          //console.log('medianHoushold', medianHousehold)
          //console.log('salaries', salaries)
          
    if (!medianHousehold || !salaries) {
      return null
    }
    const median = d3.median(salaries, (d) => d.base_salary) //median salary by County
    return {
      countyID: county.id,
      value: median - medianHousehold.medianIncome,
    }
  }

  /*updateDataFilter method passes the filter function and filteredBy dictionary from 
  arguments to App state. Will use it as a callback in Controls. */
  function updateDataFilter(filter, filteredBy) {
    setFilteredBy(filteredBy)
    setSalariesFilter(() => filter)
  }


  /*Initiate data loading inside useEffect hook which fires when component is first mounted.  */
  useEffect(()=>{
    loadData()
  },[])

  /*The overall objective of this step is to: 
  Use _.groupBy to build a dictionary mapping each countyID to an array of salaries, and use 
  countyValue method to build an array of counties for the map. 
  
  filteredSalaries is assigned to the state value techSalaries; which it received from the
  loadedAllData() function from the DatHandling component.  

  filteredSalariesMap groups the filteredSalaries (aka techSalaries) by countyID. This associates 
  each countyID to an array of salaries. .filter uses the 
  salariesFilter method to throw out anything that doesn't fit.
  
  countyValues = maps over countyNames dataset and passes each row/county to the countyValue() function. 
  Also passing the filteredSalariesMap object as a parameter to the countyValue() function. 
  Also filtering out blanks.

  Set zoom to null for now, will use this later.

  In the return statement, removed  "data loaded" indicator, and added an <svg> element that's 
  1100 pixels wide and 500 pixels high. Inside, placed the CountyMap component with a bunch 
  of properties. Some dataset stuff, some sizing and positioning stuff. Also renders other 
  components including the MediaLine which shows a direct comparison between the histogram's 
  distribution and the median household income in an area. 

  When rendering MedianLine, providing it sizing and positioning props, the dataset, a value 
  accessor, and the median value to show. 

  The <rect/> in the return is a white rectangle under the histogram. SVG doesn't know about 
  element boundaries. It just renders stuff. Gives the histogram an opaque background and covers
  up anything beneath it. 

  Render the Controls component just after </svg> because it's not an SVG component – it uses 
  normal HTML. Unlike other components, it needs the entire dataset as data. Use the 
  updateDataFilter prop to say which callback function it should call when a new filter is ready.
  The Controls component has the default salariesFilter function. The updateDataFilter method 
  passes the filter function and filteredBy dictionary from arguments to App state. Controls
  will get the entire dataset and the update data filter callback. When its done updating its 
  internal state with the filter, its going to call back up and update the main data filter. 
  


  */
  const filteredSalaries = techSalaries.filter(salariesFilter),
        filteredSalariesMap = _.groupBy(filteredSalaries, 'countyID'),
        countyValues = countyNames.map(
          county => countyValue(county, filteredSalariesMap)
        ).filter(d => !_.isNull(d))
      
      //console.log('filteredSalariesMap',filteredSalariesMap)
      //console.log('countyValues',countyValues)
    
      
      if(techSalaries.length<1){
        return <Preloader />
      } else {    

        /*medianIncomesByUSState groups salary data by US state. */
        let zoom = null,
                  medianHousehold = medianIncomesByUSState['US'][0].medianIncome



      /*When a state is selected, update the median household income of the selected state and 
      using the median income of the state*/
      if (filteredBy.USstate !== "*") {
        zoom = filteredBy.USstate;
        medianHousehold = d3.mean(
            medianIncomesByUSState[zoom],
            (d) => d.medianIncome
        )
    }


      return (
      <div className='App container'>
         <Title 
              filteredSalaries={filteredSalaries} 
              filteredBy={filteredBy}
         />
         <Description
              data={filteredSalaries}
              allData={techSalaries}
              filteredBy={filteredBy}
              medianIncomesByCounty={medianIncomesByCounty}
          />
            <svg width="1100" height="500">
            <CountyMap usTopoJson={usTopoJson}
                       USstateNames={USstateNames}
                       values={countyValues}
                       x={0}
                       y={0}
                       width={500}
                       height={500}
                       zoom={zoom} />

            <rect x="500" y="0"
                      width="600"
                      height="500"
                      style={{fill: 'white'}} />
           
            <Histogram bins={10}
                      width={500}
                      height={500}
                      x="500"
                      y="10"
                      data={filteredSalaries}
                      axisMargin={83}
                      bottomMargin={5}
                      value={d => d.base_salary} />

            <MedianLine data={filteredSalaries}
                      x={500}
                      y={10}
                      width={600}
                      height={500}
                      bottomMargin={5}
                      median={medianHousehold}
                      value={d => d.base_salary} />

        </svg>
        <Controls 
          data={techSalaries}
          updateDataFilter={updateDataFilter}
        />
      </div>
      )
    }
  }

export default App
