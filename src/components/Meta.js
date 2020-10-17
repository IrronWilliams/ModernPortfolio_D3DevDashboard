import React, { Component } from "react"
//only importing whats needed from D3
import { scaleLinear } from "d3-scale"
import { mean as d3mean, extent as d3extent, deviation as d3deviation } from "d3-array"  
import _ from 'lodash'
import S from 'string' 


import USStatesMap from './USStatesMaps'


/*  yearsFragment describes the selected year
    USstateFragment describes the selected US state
    jobTitleFragment describes the selected job title
    format returns a number formatter

The yearsFragment and USstateFragment functions get the appropriate value from Title's filteredBy 
prop, then return a string with the value or an empty string.
 
Then use D3's built-in number formatters to build format. Linear scales have the one that turns 
10000 into 10,000. Tick formatters don't work well without a domain, so we define it. 
Don't need a range because never use the scale itself in this example. 

format() returns a function, which makes it a higher order function. Being a getter makes it 
really nice to use: this.format(). Looks just like a normal function call. 

The jobTitleFragment function has more conditionals.  Function manages the jobTitle & year 
combination. Each influences the other when building the fragment for a total 4 different options.
*/

export const Title = ({ filteredSalaries, filteredBy }) => {
    function yearsFragment() {
        const year = filteredBy.year;
        return year === "*" ? "" : `in ${year}`;
    }
    function USstateFragment() {
        const USstate = filteredBy.USstate;
        return USstate === "*" ? "" : USStatesMap[USstate.toUpperCase()];
    }
    function format() {
        return scaleLinear()
            .domain(d3extent(filteredSalaries, (d) => d.base_salary))
            .tickFormat();
    }

    function jobTitleFragment() {
        const { jobTitle, year } = filteredBy
        let title = ""
        if (jobTitle === "*") {
          if (year === "*") {
            title = "The average H1B in tech pays"
          } else {
            title = "The average tech H1B paid"
          }
        } else {
          title = `Software ${jobTitle}s on an H1B`
          if (year === "*") {
            title += " make"
          } else {
            title += " made"
          }
        }
        return title
    }

    /*
    Put all this together in the render method. A conditional decides which of the two situations 
    user is in and then return an <h2> tag with the right text. 

    Calculate the mean value using d3.mean with a value accessor, format the number with 
    with format(), then use one of two string patterns to make a title.
    */

    const mean = format()(d3mean(filteredSalaries, (d) => d.base_salary))

    let title

    if (yearsFragment() && USstateFragment()) {
      title = (
        <h2>
          In {USstateFragment()}, {jobTitleFragment()}${mean}/year{" "}
          {yearsFragment()}
        </h2>
      )
    } else {
      title = (
        <h2>
          {jobTitleFragment()} ${mean}/year
          {USstateFragment() ? `in ${USstateFragment()}` : ""}
          {yearsFragment()}
        </h2>
      )
    }
    return title
}

/*
The dynamic description component is class based and is like the title component. 
It's just longer and more complex and uses more code. Apply the same approach as 
before which is:

Add imports in App.js
Add component to App render
Implement component in components/Meta.js
Use getters for sentence fragments
Play with conditionals to construct different sentence

*/

class Description extends React.Component {
    allDataForYear(year, data = this.props.allData) {
        return data.filter((d) => d.submit_date.getFullYear() === year);
    }

    allDataForJobTitle(jobTitle, data = this.props.allData) {
        return data.filter((d) => d.clean_job_title === jobTitle);
    }

    allDataForUSstate(USstate, data = this.props.allData) {
        return data.filter((d) => d.USstate === USstate);
    }

    get yearsFragment() {
        const year = this.props.filteredBy.year;

        return year === "*" ? "" : `In ${year}`;
    }

    get USstateFragment() {
        const USstate = this.props.filteredBy.USstate;

        return USstate === "*" ? "" : USStatesMap[USstate.toUpperCase()];
    }

    get previousYearFragment() {
        const year = this.props.filteredBy.year;

        let fragment;

        if (year === "*") {
            fragment = "";
        } else if (year === 2012) {
            fragment = "";
        } else {
            const { USstate, jobTitle } = this.props.filteredBy;
            let lastYear = this.allDataForYear(year - 1);

            if (jobTitle !== "*") {
                lastYear = this.allDataForJobTitle(jobTitle, lastYear);
            }

            if (USstate !== "*") {
                lastYear = this.allDataForUSstate(USstate, lastYear);
            }

            if (this.props.data.length / lastYear.length > 2) {
                fragment =
                    ", " +
                    (this.props.data.length / lastYear.length).toFixed() +
                    " times more than the year before";
            } else {
                const percent = (
                    (1 - lastYear.length / this.props.data.length) *
                    100
                ).toFixed();

                fragment =
                    ", " +
                    Math.abs(percent) +
                    "% " +
                    (percent > 0 ? "more" : "less") +
                    " than the year before";
            }
        }

        return fragment;
    }

    get jobTitleFragment() {
        const jobTitle = this.props.filteredBy.jobTitle;
        let fragment;

        if (jobTitle === "*") {
            fragment = "H1B work visas";
        } else {
            if (jobTitle === "other") {
                fragment = "H1B work visas";
            } else {
                fragment = `H1B work visas for software ${jobTitle}s`;
            }
        }

        return fragment;
    }

    /*Section finds the richest city and county.  In summary countyFragment() does: 
    Group the dataset by county, then sort counties by their income delta. 
    Then look only at counties that are bigger than 1% of the entire dataset. 
    Define income delta as the difference between a county's median household income 
    and the median tech salary in our dataset.
    
    To make more efficient, could optimize by just looking for the max value??
    
    */
    get countyFragment() {
        const byCounty = _.groupBy(this.props.data, "countyID"),
            medians = this.props.medianIncomesByCounty;

        let ordered = _.sortBy(
            _.keys(byCounty)
                .map((county) => byCounty[county])
                .filter((d) => d.length / this.props.data.length > 0.01),
            (items) =>
                d3mean(items, (d) => d.base_salary) -
                medians[items[0].countyID][0].medianIncome
        );

        let best = ordered[ordered.length - 1],
            countyMedian = medians[best[0].countyID][0].medianIncome;

        const byCity = _.groupBy(best, "city");

        ordered = _.sortBy(
            _.keys(byCity)
                .map((city) => byCity[city])
                .filter((d) => d.length / best.length > 0.01),
            (items) => d3mean(items, (d) => d.base_salary) - countyMedian
        );

        best = ordered[ordered.length - 1];

        const city = S(best[0].city).titleCase().s + `, ${best[0].USstate}`,
            mean = d3mean(best, (d) => d.base_salary);

        const jobFragment = this.jobTitleFragment
            .replace("H1B work visas for", "")
            .replace("H1B work visas", "");

        return (
            <span>
                The best city{" "}
                {jobFragment.length
                    ? `for ${jobFragment} on an H1B`
                    : "for an H1B"}{" "}
                {this.yearFragment ? "was" : "is"} <b>{city}</b> with an average
                salary ${this.format(mean - countyMedian)} above the local
                household median. Median household income is a good proxy for
                cost of living in an area.{" "}
            </span>
        );
    }

    get format() {
        return scaleLinear()
            .domain(d3extent(this.props.data, (d) => d.base_salary))
            .tickFormat();
    }

    render() {
        const format = this.format,
            mean = d3mean(this.props.data, (d) => d.base_salary),
            deviation = d3deviation(this.props.data, (d) => d.base_salary);

        return (
            <p className="lead">
                {this.yearsFragment ? this.yearsFragment : "Since 2012"} the{" "}
                {this.UStateFragment} tech industry{" "}
                {this.yearsFragment ? "sponsored" : "has sponsored"}{" "}
                <b>
                    {format(this.props.data.length)} {this.jobTitleFragment}
                </b>
                {this.previousYearFragment}. Most of them paid{" "}
                <b>
                    ${format(mean - deviation)} to ${format(mean + deviation)}
                </b>{" "}
                per year. {this.countyFragment}
            </p>
        );
    }
}

export { Description }