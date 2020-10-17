/*
ControlRow component renders a row of controls and ensures only one at a time is selected.
makePick calls the data filter update and passes in the new value and whether I want to unselect. 

In render, set up two divs with Bootstrap classes. The first is a row, and the second is a 
full-width column. Inside the divs, map over all toggles and use the <Toggle> component to 
render each of them. The label is a prettier version of the name, which also serves as a key 
in the toggleValues dictionary. It's going to be the picked attribute in makePick.
*******************************************************************************

The Controls component builds the filter function and filteredBy dictionary based on user choices.
Controls renders 3 rows of buttons and builds filtering out of the choice made on each row. 

Defining default state with an always-true yearFilter and an asterisk for year.
The updateYearFilter function used to update the filter. 

The reportUpdateUpTheChain function bubbles updates to parent component. 
It's a simpler alternative to using React Context or a state management library.

updateYearFilter is a callback passed into ControlRow. When a user picks a year, their action 
triggers this function. When that happens, we create a new partial filter function. The App 
component uses it inside a .filter call. Have to return true for elements I want to keep 
and false for elements I don't. Comparing submit_date.getFullYear() with year achieves that.

The reset argument lets me reset filters back to defaults. Enables users to unselect options.

When I have the year and filter, I update component state. This triggers a re-render and calls 
reportUpdateUpTheChain afterwards. 

The filter method composes multiple functions. The new arrow function takes a dictionary of 
filters as an argument and returns a new function that &&s them all. We invoke it immediately 
with this.state as the argument.

reportUpdateUpTheChain then calls updateDataFilter, which is a callback method on App. 
Defined earlier – it needs a new filter method and a filteredBy dictionary.

Using Set to create a set of distinct years in dataset, then render a ControlRow using props to 
give it the data, a set of toggleNames, a callback to update the filter, and which entry is 
picked right now. Also known as the controlled component pattern, it enables me to maintain 
the data-flows-down, events-bubble-up architecture.Sets is an ES6 data structure that ensures 
every entry is unique.

This pattern is repeated for jobTitles and USstates with only difference is a changed filter 
function and using different keys when setting state. Sets are created and then rendering
two more ControlRow elements with appropriate attributes. They get toggleNames for building 
the buttons, picked to know which is active, an updateDataFilter callback, and US states are 
to render capitalized.  These new keys need to be added to the reportUpdateUpTheChain function.
add them to the filter condition with && and expand the filteredBy argument. Will display rows
of buttons for years, positions and states. 

In the render/return, this section can be thought of as filters for years, US states & job titles.

A second useState() hook was added for routing. Routing makes the viz linkable and stores the 
current filteredBy state in the URL. Can create routes with ReactRouter. This alternative approach
is quicker and will manipulate and read the URL hash. 

The 2nd useEffect hook reads the URL when Controls first render on the page. window.location.hash 
gives the hash part of the URL. Clean it up and split it into three parts: year, USstate, and 
jobTitle. If the URL is localhost:3000/#2013-CA-manager, then year becomes 2013, USstate 
becomes CA, and jobTitle becomes manager. Will need to update reportUpdateUpTheChain by 
updating the URL hash. 


*/

import React, { useState, useEffect } from "react" 

const Toggle = ({ label, name, value, onClick }) => {
    let className = "btn btn-default" 
    
    if (value) {
        className += " btn-primary" 
    }
    return (
        <button className={className} onClick={() => onClick(name, !value)}>
            {label}
        </button>
    ) 
} 

const ControlRow = ({
    data,
    toggleNames,
    picked,
    updateDataFilter,
    capitalize,
}) => {
    function makePick(picked, newState) {
        updateDataFilter(picked, !newState) 
    }

    return (
        <div className="row">
            <div className="col-md-12">
                {toggleNames.map((name) => (
                    <Toggle
                        label={capitalize ? name.toUpperCase() : name}
                        name={name}
                        key={name}
                        value={picked === name}
                        onClick={makePick}
                    />
                ))}
            </div>
        </div>
    ) 
} 

const Controls = ({ data, updateDataFilter }) => {
    /*Default state before routing  
    const [filteredBy, setFilteredBy] = useState({
        year: "*",
        USstate: "*",
        jobTitle: "*",
    }) 
    */

    //Updating default state to read the location hash
    let locationHash = window.location.hash.replace("#", "").split("-") 
    
    const [filteredBy, setFilteredBy] = useState({
        year: locationHash[0],
        USstate: locationHash[1],
        jobTitle: locationHash[2],
    }) 

    const [filterFunctions, setFilter] = useState({
        year: () => true,
        USstate: () => true,
        jobTitle: () => true,
    }) 

    /*prior to routing 
    function reportUpdateUpTheChain() {
        window.location.hash = [
            filteredBy.year,
            filteredBy.USstate,
            filteredBy.jobTitle,
        ].join("-") */

        //updating URL has for routing
        function reportUpdateUpTheChain() {
            window.location.hash = [
                filteredBy.year || '*',
                filteredBy.USstate || '*',
                filteredBy.jobTitle || '*',
            ].join("-") 

        const filter = (d) =>
            filterFunctions.year(d) &&
            filterFunctions.USstate(d) &&
            filterFunctions.jobTitle(d) 

        updateDataFilter(filter, filteredBy) 
    }

    const updateYearFilter = (year, reset) => {
        let yearFilter = (d) => d.submit_date.getFullYear() === year 

        if (reset || !year) {
            yearFilter = () => true 
            year = "*" 
        }

        setFilteredBy((filteredBy) => {
            return { ...filteredBy, year } 
        }) 
        setFilter((filterFunctions) => {
            return { ...filterFunctions, year: yearFilter } 
        }) 
    } 

    const updateJobTitleFilter = (jobTitle, reset) => {
        let jobTitleFilter = (d) => d.clean_job_title === jobTitle 

        if (reset || !jobTitle) {
            jobTitleFilter = () => true 
            jobTitle = "*" 
        }

        setFilteredBy((filteredBy) => {
            return { ...filteredBy, jobTitle } 
        }) 
        
        setFilter((filterFunctions) => {
            return { ...filterFunctions, jobTitle: jobTitleFilter } 
        }) 
    } 

    const updateUSstateFilter = (USstate, reset) => {
        let USstateFilter = (d) => d.USstate === USstate 

        if (reset || !USstate) {
            USstateFilter = () => true 
            USstate = "*" 
        }

        setFilteredBy((filteredBy) => {
            return { ...filteredBy, USstate } 
        }) 
        
        setFilter((filterFunctions) => {
            return { ...filterFunctions, USstate: USstateFilter } 
        }) 
    } 

    useEffect(() => {
        reportUpdateUpTheChain() 
    }, [filteredBy, filterFunctions]) 

    
    useEffect(() => {
        let [year, USstate, jobTitle] = window.location.hash
            .replace("#", "")
            .split("-") 

        if (year !== "*" && year) {
            updateYearFilter(Number(year)) 
        }
        if (USstate !== "*" && USstate) {
            updateUSstateFilter(USstate) 
        }
        if (jobTitle !== "*" && jobTitle) {
            updateJobTitleFilter(jobTitle) 
        }
    }, []) 

    const years = new Set(data.map((d) => d.submit_date.getFullYear())),
        jobTitles = new Set(data.map((d) => d.clean_job_title)),
        USstates = new Set(data.map((d) => d.USstate)) 

    return (
        <div>
            <ControlRow
                data={data}
                toggleNames={Array.from(years.values())}
                picked={filteredBy.year}
                updateDataFilter={updateYearFilter}
            />
            <ControlRow
                data={data}
                toggleNames={Array.from(jobTitles.values())}
                picked={filteredBy.jobTitle}
                updateDataFilter={updateJobTitleFilter}
            />
            <ControlRow
                data={data}
                toggleNames={Array.from(USstates.values())}
                picked={filteredBy.USstate}
                updateDataFilter={updateUSstateFilter}
                capitalize="true"
            />
        </div>
    ) 
} 

export default Controls 
    





  
  
  
  
