import * as d3 from 'd3'
import { median } from 'd3'
import _ from 'lodash' 


/*The data parsing functions take a row of data as 'd', returns a dictionary with nicer names,
casts numbers and dates into appropriate formats. The rows of data in the csv files begin as strings. 
This process is a way to contain/manage messy data. 
*/
const cleanIncome = (d) =>({
    countyName: d['Name'],
    USstate: d['State'],
    medianIncome: Number(d['Median Household Income']),
    lowerBound: Number(d['90% CI Lower Bound']),
    upperBound: Number(d['90% CI Upper Bound']),
})

const dateParse = d3.timeParse('%m/%d/%Y')
const cleanSalary = (d) => {
    if(!d['base salary'] || Number(d['base salary']) >300000){
        return null  //Returns null when a salary is either undefined or >300k, which is extremely high.
    } 
    return {
        employer: d.employer,
        submit_date: dateParse(d['submit date']),
        start_date: dateParse(d['start date']),
        case_status: d['case status'],
        job_title: d['job title'],
        clean_job_title: d['job title'],
        base_salary: Number(d['base salary']),
        city: d['city'],
        USstate: d['state'],
        county: d['county'],
        countyID: d['countyID'],
    }
} 

const cleanUSStateName = (d)=>({
    code: d.code,
    id: Number(d.id),
    name: d.name,
})

const cleanCounty = (d)=>({
    id: Number(d.id),
    name: d.name,
})

/*Load data with fetch requests. 
In version 5, D3 updated its data loading methods to use promises instead of callbacks. 
You can load a single file using d3.csv("filename").then(data => .....). 
The promise resolves with your data, or throws an error.

Each d3.csv call makes a fetch request, parses the fetched CSV file into an array of JavaScript 
dictionaries, and passes each row through the provided cleanup function. I pass all median incomes 
through cleanIncome, salaries through cleanSalary, etc.

To load multiple files, use Promise.all with a list of unresolved promises. Once resolved, the .then 
handler gets a list of results. I use array destructuring to expand that list into our respective 
datasets before running some more logic to tie them together.
*/
export const loadAllData = async ()=>{
    const dataSets = await Promise.all([
        d3.json('data/us.json'),
        d3.csv('data/us-county-names-normalized.csv', cleanCounty),
        d3.csv('data/county-median-incomes.csv', cleanIncome),
        d3.csv('data/h1bs-2012-2018.csv', cleanSalary),
        d3.tsv('data/us-state-names.tsv', cleanUSStateName)
    ])
    /*Destructuring/exploding dataSets into individual variables; easier to work with. */ 
    let [us, countyNames, medianIncomes, techSalaries, USstateNames] = dataSets
    console.log('dataSets',dataSets)

    /*
    This section ties the datasets together. The goal is to create a dictionary that maps county ids to 
    their household income data.

    find() method iterates over the countyNames object and returns the first element that the
    callback (2nd parameter) returns as truey. The filter on medianIncomes ensures that all incomes 
    have a countyName or discards any incomes whose countyName cant be found. In other words, the callback
    in filter iterates thru each row in the medianIncomes dataset and uses find() to search for all of the 
    medianIncomes "countyName" records/keys in the countyNames dataset. If the countyName record/key
    from medianIncomes is in the countyNames dataset then return in the filter. 

    Next, walk through the filtered array with a forEach, find the correct countyID, and add each 
    entry to medianIncomesMap. Meaning for each row of the filtered array, create a new key called 
    countyID where the value is equal to county 'id' in the countyNames dataset. The id is found by
    using the countyName key/record from the filtered array. Then populate each row of the filtered 
    array now including the new countyID key into the medianIncomeMap object. This results in a large 
    dictionary that maps county ids to their household income data. 

    Then filter techSalaries to remove any empty values where the cleanSalaries function returned null. 
    Returns null when a salary is either undefined or absurdly high.

    When dataset is ready, return a dictionary of the new datasets. To make future access quicker, 
    use _.groupBy to build dictionary maps of counties by county name and by US state. The revised
    datasets will be passed to different parts of application. 

    */
    let medianIncomesMap = {}
    medianIncomes.filter(d => _.find(countyNames,{name: d['countyName']}))
                 .forEach((d) => {d['countyID'] = _.find(countyNames,{name: d['countyName']}).id
                     medianIncomesMap[d.countyID] = d
                 })
    techSalaries = techSalaries.filter(d => !_.isNull(d))
    //console.log('medianIncomesMap',medianIncomesMap)
    
    return {
        usTopoJson: us,
        countyNames: countyNames,
        medianIncomes: medianIncomesMap,
        medianIncomesByCounty: _.groupBy(medianIncomes, 'countyName'),
        medianIncomesByUSState: _.groupBy(medianIncomes, 'USstate'),
        techSalaries: techSalaries,
        USstateNames: USstateNames
    }

}




