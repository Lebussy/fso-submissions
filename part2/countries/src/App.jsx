import { useEffect, useState } from "react"
import axios from "axios"
import countriesService from './services/countries'
import CountriesDisplay from "./components/CountriesDisplay"
import getWeatherForCountry from "./services/weather"

const App = () => {
  const [searchValue, setSearchValue] = useState('')
  // Piece of state to remember all the countries between renders
  // Initialised to empty array to avoid error when filter occurs
  const [allCountries, setAllCountries] = useState([])

  // Controller for the search input element
  const handleSearchValueChange = (event) => {
    setSearchValue(event.target.value)
  }

  // Effect executes after first render, and retrieves all the countries data
  useEffect(() => {
    countriesService.retrieveAllCountries().then(data => setAllCountries(data))
  }, [])

  // Filters the countries based on search field
  const countriesToShow = allCountries.filter(country => {
    return country.name.common.toLowerCase().includes(searchValue.toLowerCase())
  })

  return (
    <>
      <input value={searchValue} onChange={handleSearchValueChange}/>
      <CountriesDisplay countries={countriesToShow}/>
    </>
  )
}

export default App
